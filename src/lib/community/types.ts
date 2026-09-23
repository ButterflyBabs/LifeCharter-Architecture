// Row shapes for The LifeCharter Collective (cm_* tables).

export type SpaceSection = "start" | "community" | "programs" | "alumni";

export interface Space {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  emoji: string | null;
  logo_url: string | null;
  cover_url: string | null;
  section: SpaceSection;
  visibility: "public" | "private";
  is_default: boolean;
  join_enabled: boolean;
  sort_order: number;
  archived: boolean;
}

export interface Channel {
  id: string;
  space_id: string;
  slug: string;
  name: string;
  emoji: string | null;
  description: string | null;
  kind: "discussion" | "announcements";
  post_policy: "members" | "moderators";
  prompt: string | null;
  sort_order: number;
  archived: boolean;
}

export type SpaceRole = "member" | "moderator" | "admin";

export interface Membership {
  space_id: string;
  user_id: string;
  role: SpaceRole;
  notify_level: "all" | "announcements" | "none";
  joined_at: string;
}

export interface Profile {
  user_id: string;
  display_name: string;
  headline: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  website: string | null;
  show_in_directory: boolean;
  allow_dms: boolean;
  notify_email: boolean;
  notify_push: boolean;
  status: "active" | "suspended";
  onboarded: boolean;
  created_at: string;
}

export interface Attachment {
  name: string;
  url: string;
  path?: string;
  type?: string;
  size?: number;
}

export interface Post {
  id: string;
  space_id: string;
  channel_id: string;
  author_id: string;
  title: string | null;
  body: string;
  attachments: Attachment[];
  pinned: boolean;
  comment_count: number;
  last_activity_at: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
}

export interface Comment {
  id: string;
  post_id: string;
  space_id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
}

export interface Reaction {
  id: string;
  post_id: string | null;
  comment_id: string | null;
  user_id: string;
  emoji: string;
}

export interface DmThread {
  id: string;
  is_group: boolean;
  title: string | null;
  last_message_at: string;
}

export interface DmMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  deleted_at: string | null;
}

export type EventKind = "anchor" | "session" | "workshop" | "masterclass" | "office_hours" | "challenge" | "summit" | "other";

export interface CommunityEvent {
  id: string;
  space_id: string | null;
  title: string;
  description: string | null;
  kind: EventKind;
  starts_at: string;
  ends_at: string | null;
  timezone: string;
  join_url: string | null;
  location: string | null;
  replay_url: string | null;
  cover_url: string | null;
  recurrence: string | null;
}

export interface Resource {
  id: string;
  space_id: string | null;
  category: string;
  title: string;
  description: string | null;
  kind: "file" | "link" | "video";
  url: string | null;
  storage_path: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  sort_order: number;
  created_at: string;
}

export interface DiscoverCard {
  id: string;
  space_id: string | null;
  title: string;
  blurb: string | null;
  teaser: string | null;
  image_url: string | null;
  cta_label: string;
  cta_url: string | null;
  sort_order: number;
  active: boolean;
}

export interface CommunityNotification {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  href: string | null;
  actor_id: string | null;
  space_id: string | null;
  read_at: string | null;
  created_at: string;
}

export const SECTION_LABELS: Record<SpaceSection, string> = {
  start: "Start Here",
  community: "Community",
  programs: "Your Programs",
  alumni: "Alumni & Professional",
};

export const EVENT_KIND_LABELS: Record<EventKind, string> = {
  anchor: "Alignment Anchor",
  session: "Session",
  workshop: "Workshop",
  masterclass: "MasterClass",
  office_hours: "Office Hours",
  challenge: "Challenge",
  summit: "Summit",
  other: "Event",
};
