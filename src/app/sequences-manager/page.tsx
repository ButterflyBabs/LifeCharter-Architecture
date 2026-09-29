import SequencesManager from "./SequencesManager";

export const dynamic = "force-dynamic";

// Every account: its own timed email series (each account sees only its own).
export default function SequencesManagerPage() {
  return <SequencesManager />;
}
