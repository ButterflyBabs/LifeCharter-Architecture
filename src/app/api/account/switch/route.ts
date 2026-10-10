import { NextResponse } from "next/server";
import { ACCOUNT_COOKIE, hasOwnAccount, isOwnerEmail, prefersTeamAccount, sessionUser } from "@/lib/authz";
import { crossOriginBlocked } from "@/lib/security";
import { switcherAllowed } from "@/lib/accountSwitcher";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Account switcher: one login that owns its own account AND is an invited team member of another
// (e.g. Marcello: his own account + the Sales role on AmiLynne's). The choice is the lc_acct cookie,
// and every request re-checks the membership, so the cookie can only ever pick between two things
// the person genuinely has.

interface TeamAccount {
  label: string;
  role: string;
  house: boolean; // the house account (AmiLynne's own LCCS), shown as "LCCS <role>"
}

async function teamAccountFor(email: string): Promise<TeamAccount | null> {
  const supabase = createServerClient();
  const { data: m } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .ilike("email", email)
    .in("status", ["active", "pending"])
    .maybeSingle();
  if (!m?.workspace_id) return null;
  const { data: ws } = await supabase.from("workspaces").select("name, master_plan_id").eq("id", m.workspace_id).maybeSingle();
  let name = (ws?.name as string) || "Team account";
  let house = false;
  if (ws?.master_plan_id) {
    const { data: plan } = await supabase
      .from("client_master_plans")
      .select("client_name, client_email")
      .eq("id", ws.master_plan_id)
      .maybeSingle();
    if (plan?.client_name) name = plan.client_name as string;
    house = Boolean(plan?.client_email && isOwnerEmail(plan.client_email as string));
  }
  const role = ((m.role as string) || "member").toLowerCase();
  return { label: name, role, house };
}

const ROLE_LABEL: Record<string, string> = { sales: "Sales", admin: "Admin", editor: "Editor", viewer: "Viewer", member: "Team" };

export async function GET() {
  const user = await sessionUser();
  const none = NextResponse.json({ canSwitch: false });
  if (!user?.email || !switcherAllowed(user.email)) return none;
  const [own, team] = await Promise.all([hasOwnAccount(user.id), teamAccountFor(user.email)]);
  if (!own || !team) return none;
  return NextResponse.json(
    {
      canSwitch: true,
      active: prefersTeamAccount() ? "team" : "own",
      team: {
        label: team.label,
        role: ROLE_LABEL[team.role] || "Team",
        // What the toggle button says: "LCCS Sales" for the house account, else "<account> · <role>".
        display: team.house ? `LCCS ${ROLE_LABEL[team.role] || "Team"}` : `${team.label} · ${ROLE_LABEL[team.role] || "Team"}`,
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const user = await sessionUser();
  if (!user?.email) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!switcherAllowed(user.email)) return NextResponse.json({ error: "The account switcher isn't available for your login yet." }, { status: 403 });

  let to = "";
  try {
    to = String((await request.json())?.to || "");
  } catch {
    /* empty body */
  }
  if (to !== "own" && to !== "team") return NextResponse.json({ error: "Choose an account." }, { status: 400 });

  if (to === "team") {
    const team = await teamAccountFor(user.email);
    if (!team) return NextResponse.json({ error: "You are not a member of a team account." }, { status: 403 });
  } else if (!(await hasOwnAccount(user.id))) {
    return NextResponse.json({ error: "You don't have an account of your own." }, { status: 403 });
  }

  const res = NextResponse.json({ ok: true, active: to });
  res.cookies.set(ACCOUNT_COOKIE, to === "team" ? "team" : "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: to === "team" ? 60 * 60 * 24 * 365 : 0,
  });
  return res;
}
