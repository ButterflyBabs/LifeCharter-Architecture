import { NextRequest, NextResponse } from "next/server";
import { fireExecConsultTag, writeExecConsultFields } from "@/lib/execConsultGC";
import { createServerClient } from "@/lib/supabase/server";

/**
 * Called from the two Executive Consultation qualification questionnaires
 * (/schedule/masterclass and /schedule/website) right before the prospect
 * is sent on to actually pick a time. Fires the source-specific Global
 * Control tag (lccs-execconsult-masterclass or lccs-execconsult-website),
 * then writes every answer onto that contact's custom fields — regardless
 * of whether they end up booking, showing up, or buying. "Appointment
 * booked/canceled" and "sold" are tracked separately: the first two are
 * Global Control's own booking-automation tags (that step happens entirely
 * on Global Control's booking page, which this app never sees), and "sold"
 * fires later from the New Client Onboarding form on /sales-reference.
 */

const MC_TAG_ID = process.env.GC_EXEC_MC_TAG_ID;
const WEBSITE_TAG_ID = process.env.GC_EXEC_WEBSITE_TAG_ID;

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

    const tagId = body.source === "masterclass" ? MC_TAG_ID : WEBSITE_TAG_ID;
    const { status: gcTagStatus, contactId } = await fireExecConsultTag(tagId, {
      email: body.email,
      firstName,
      lastName,
    });

    await writeExecConsultFields(contactId, {
      source: body.source,
      revenue_range: body.revenueRange,
      bottleneck: body.bottleneck,
      is_decision_maker: body.isDecisionMaker ? "Yes" : "No",
      tools: (body.tools || []).join(", "),
      implementation_timeline: body.implementationTimeline || "",
      qualified_at: new Date().toISOString().slice(0, 10),
      // No-ops until GC_EXEC_FIELD_MAP has a "session_source" entry — same
      // graceful-degrade pattern as every other field here.
      session_source: body.sessionSource || "",
    });

    // Best-effort audit row — independent of whether GC_EXEC_FIELD_MAP has a
    // session_source mapping yet, so attribution is queryable immediately.
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
        gc_contact_id: contactId,
        gc_tag_status: gcTagStatus,
      });
    } catch (e) {
      console.error("[consultation/qualify] audit insert failed:", e);
    }

    return NextResponse.json({ success: true, gcTagStatus });
  } catch (error) {
    console.error("Consultation qualify error:", error);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}
