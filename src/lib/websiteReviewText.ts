// Plain-text outlines for the sections every Website Alignment Review carries. No server imports, so client pages can use them.

/** Every Review carries this section, so each client is shown how to get their pages found in search. */
export const SEO_SECTION_HEADING = "## Keywords and SEO: getting found";
export const hasSeoSection = (text: string) => text.includes(SEO_SECTION_HEADING);

/** The outline the owner starts from for a client's SEO section (filled in from the site's own title, headings, images and sitemap). */
export const SEO_SECTION_OUTLINE = `${SEO_SECTION_HEADING}

**What a search engine sees today**

- **Page title:** ...
- **Headings:** ... (one H1 per page)
- **Image descriptions:** ... of ... images have no alt text.
- **Structured data, sitemap and sharing image:** ...
- **Already good:** ...

**Keywords to target.** A starting list drawn from the client's offers. Check search volume and competition in Google Search Console or Google Keyword Planner before committing to any of it.

- ...

**Where to put them**

- **Title tag** (about 60 characters): ...
- **H1:** ...
- **Meta description** (about 150 characters): ...
- **Alt text:** ...
- **One page per offer or topic:** ...

**Technical fixes**

- ...

**Content that earns rankings**

- ...

**How to measure it.** In Google Search Console, watch Queries and Pages for these phrases. Expect movement in weeks, not days: check at four and eight weeks.
`;

/** Every Review also shows the client how their own AI Assistant in the Suite helps them carry out each change. */
export const ASSISTANT_SECTION_PREFIX = "## Putting this into action with";
export const hasAssistantSection = (text: string) => text.includes(ASSISTANT_SECTION_PREFIX);

/** The outline for that section, using the name the client gave their assistant (their own, never ours). */
export function assistantSectionOutline(assistantName: string): string {
  const n = assistantName.trim() || "your assistant";
  return `${ASSISTANT_SECTION_PREFIX} ${n}, your AI Assistant

${n} works only in your own Command Suite account, on your own AI key. It can write the wording, build your to-do list, and set up forms and booking links inside the Suite. It cannot edit your website or open Google Search Console, so you (or whoever looks after the site) paste its wording in. Anything it changes in your Suite waits for you to press Approve first.

**How to start.** Open ${n} from the AI Assistant box on Executive Home, or from the button in the corner of any page. ${n} cannot see this Review on its own, so paste in the change you are working on, say which page you mean, and say what you want.

- **To plan the whole job:** paste the changes and ask, "Create a project called Website fixes with a task for each of these changes, spread over the next three weeks." You will see a card to Approve.
- **Change 1:** "..." (a request written for this client's first change, and what ${n} will produce)
- **Change 2:** "..."
- **Change 3:** "..."
- **Change 4:** "..."
- **Change 5:** "..."
- **Keywords and SEO:** "Write a page title under 60 characters, an H1 and a meta description of about 150 characters for each page, using these keywords: [paste your list]." Also alt text for the images, and an outline for each article that answers a question buyers ask.
- **To keep it moving:** "Remind me in four weeks and again in eight weeks to check the Queries report in Google Search Console." It comes as a card to Approve.

When ${n}'s wording is not right, say what to change ("shorter", "more direct", "less formal") and it will rewrite it.
`;
}
