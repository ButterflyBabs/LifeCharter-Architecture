import { ReviewText } from "@/components/website/ReviewText";

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "");

// A delivered Review as the client sees it on their Website Review page. The owner's Preview uses the same card.
export default function ReviewDelivered({ website, publishedAt, content }: { website: string; publishedAt: string | null; content: string }) {
  return (
    <article className="rounded-2xl border border-[#1a2b4a]/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#1a2b4a]/40">
      <p className="mb-4 text-xs text-[#7b6b8d]">{[website, publishedAt ? `Delivered ${fmt(publishedAt)}` : ""].filter(Boolean).join(" · ")}</p>
      <ReviewText text={content} />
      <p className="mt-6 border-t border-[#1a2b4a]/10 pt-4 text-sm text-[#5b5f73] dark:border-white/10 dark:text-[#b8a898]">
        Questions, or want to talk it through? Write to <a className="text-[#2E7C83] underline" href="mailto:support@lccommandsuite.com">support@lccommandsuite.com</a>.
      </p>
    </article>
  );
}
