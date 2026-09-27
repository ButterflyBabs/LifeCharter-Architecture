// Renders a Website Alignment Review written as simple text: "## " headings, "- " bullets,
// "1. " numbered items, blank lines between paragraphs, **bold**. Everything is escaped.
function inline(s: string) {
  const esc = s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
  return esc.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

export function ReviewText({ text }: { text: string }) {
  const blocks = text.replace(/\r/g, "").split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="space-y-4 text-[15.5px] leading-relaxed text-[#1a2b4a] dark:text-[#F8F5F0]">
      {blocks.map((b, i) => {
        if (b.startsWith("## ")) return <h2 key={i} className="pt-2 text-xl font-semibold" dangerouslySetInnerHTML={{ __html: inline(b.slice(3)) }} />;
        const lines = b.split("\n");
        if (lines.every((l) => /^[-*] /.test(l)))
          return <ul key={i} className="list-disc space-y-1 pl-6">{lines.map((l, j) => <li key={j} dangerouslySetInnerHTML={{ __html: inline(l.slice(2)) }} />)}</ul>;
        if (lines.every((l) => /^\d+\. /.test(l)))
          return <ol key={i} className="list-decimal space-y-1 pl-6">{lines.map((l, j) => <li key={j} dangerouslySetInnerHTML={{ __html: inline(l.replace(/^\d+\. /, "")) }} />)}</ol>;
        return <p key={i} dangerouslySetInnerHTML={{ __html: inline(lines.join(" ")) }} />;
      })}
    </div>
  );
}
