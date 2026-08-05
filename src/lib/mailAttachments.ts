import type { OutgoingAttachment } from "@/lib/google";

// Validate/normalize an attachments array coming from a request body.
export function normalizeAttachments(input: unknown): OutgoingAttachment[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((a): a is Record<string, unknown> => Boolean(a && typeof a === "object"))
    .map((a) => ({
      name: String(a.name ?? "attachment"),
      mimeType: String(a.mimeType ?? "application/octet-stream"),
      contentBase64: String(a.contentBase64 ?? ""),
    }))
    .filter((a) => a.contentBase64.length > 0);
}
