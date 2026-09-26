import { redirect } from "next/navigation";

// These questions now live in the Marketing Plan's Build tab; old links land
// on the matching section.
export default function Page() {
  redirect("/marketing-plan?section=brand_voice");
}
