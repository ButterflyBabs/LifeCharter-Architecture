import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { upsertContact, logEvent } from "@/lib/crm";
import { ownerMasterPlanId } from "@/lib/housePlan";

/**
 * Called from the two Executive Consultation qualification questionnaires
 * (/schedule/masterclass and /schedule/website) right before the prospect
 * is sent on to actually pick a time. Saves the person as a contact in Babs's
 * own Suite CRM (tagged executive-consultation-request + consult-<source>) with
 * every answer on their timeline — regardless of whether they end up booking,
 * showing up, or buying — plus an audit row for attribution reporting.
 */

interface QualifyBody {
  source: "masterclass" | "website";
  fullName: string;
  email: string;
  revenueRange: string;
  bottleneck: string;
  isDecisionMaker: boolean;
  tools?: string[];
  implementationTimeline?: string;
  /** e.g. "mc-2026-09-24" — which MasterClass/channel this came from, if known. */
  sessionSource?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: QualifyBody = await req.json();

    if (!body.source || (body.source !== "masterclass" && body.source !== "website")) {
      return NextResponse.json({ error: "Invalid source" }, { status: 400 });
    }
    if (!body.fullName || !body.email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }
    if (!body.revenueRange || !body.bottleneck || typeof body.isDecisionMaker !== "boolean") {
      return NextResponse.json({ error: "Please answer every question" }, { status: 400 });
    }
    if (body.source === "website" && (!body.tools?.length || !body.implementationTimeline)) {
      return NextResponse.json({ error: "Please answer every question" }, { status: 400 });
    }

    const [firstName, ...rest] = body.fullName.trim().split(/\s+/);
    const lastName = rest.join(" ");

    const answers = {
      source: body.source,
      revenue_range: body.revenueRange,
      bottleneck: body.bottleneck,
      is_decision_maker: body.isDecisionMaker ? "Yes" : "No",
      tools: (body.tools || []).join(", "),
      implementation_timeline: body.implementationTimeline || "",
      session_source: body.sessionSource || "",
    };

    // Babs's own contacts: the request lands on the person's timeline.
    try {
      const planId = await ownerMasterPlanId();
      if (planId) {
        const c = await upsertContact({
          masterPlanId: planId,
          email: body.email,
          firstName: firstName || null,
          lastName: lastName || null,
          source: `consult-${body.source}`,
          tags: ["executive-consultation-request", `consult-${body.source}`],
        });
        if (c) await logEvent(planId, c.id, "form", "Executive Consultation questionnaire", { answers });
      } else {
        console.error("[consultation/qualify] owner account not found — contact not saved");
      }
    } catch (e) {
      console.error("[consultation/qualify] contact save failed:", e);
    }

    // Best-effort audit row, so attribution is queryable. The gc_* columns are
    // left over from a retired integration.
    try {
      const supabase = createServerClient();
      await supabase.from("exec_consult_qualifications").insert({
        source: body.source,
        full_name: body.fullName,
        email: body.email,
        revenue_range: body.revenueRange,
        bottleneck: body.bottleneck,
        is_decision_maker: body.isDecisionMaker,
        tools: (body.tools || []).join(", ") || null,
        implementation_timeline: body.implementationTimeline || null,
        session_source: body.sessionSource || null,
        gc_contact_id: null,
        gc_tag_status: "not_used",
      });
    } catch (e) {
      console.error("[consultation/qualify] audit insert failed:", e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Consultation qualify error:", error);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}
