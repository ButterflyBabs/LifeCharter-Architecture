// The shape of a starter-library item and the helper that builds one. Kept apart so the library can be split across files.

export type LibraryChannel = "sales" | "email" | "dm" | "objection" | "social";

export interface LibraryItem {
  id: string;
  title: string;
  description: string;
  itemType: "script" | "template";
  category: string;
  channel: LibraryChannel;
  tags: string[];
  content: string;
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function item(
  category: string,
  channel: LibraryChannel,
  itemType: "script" | "template",
  title: string,
  description: string,
  tags: string,
  content: string
): LibraryItem {
  return {
    id: `lib-${slug(category)}-${slug(title)}`,
    title,
    description,
    itemType,
    category,
    channel,
    tags: tags.split(",").map((t) => t.trim()),
    content: content.trim(),
  };
}
