// LCCS Academy release stage. Babs approves each lesson on the page before anyone else sees it.
//   review  Babs and the Eloise tester only
//   team    plus members of Babs's own team
//   all     every account (client wording in What's New, Help and the assistant goes out at this step)
export type AcademyStage = "review" | "team" | "all";
export const ACADEMY_STAGE = "team" as AcademyStage;
const ACADEMY_TESTERS = ["msamilynne+eloise-practice@gmail.com"];

export const isAcademyTester = (email: string | null | undefined) => ACADEMY_TESTERS.includes((email || "").toLowerCase());

export const academyOpenFor = (email: string | null | undefined, architect: boolean, houseMember: boolean, stage: AcademyStage = ACADEMY_STAGE) =>
  architect || isAcademyTester(email) || stage === "all" || (stage === "team" && houseMember);
