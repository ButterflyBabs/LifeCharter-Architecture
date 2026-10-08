import SendWindow from "./SendWindow";

export const dynamic = "force-dynamic";

// The DM message in its own small window, opened from a pipeline card (see DmPipeline.openSend).
export default function DmSendPage() {
  return <SendWindow />;
}
