# LifeCharter Command Suite: rules for every change

## Update et al

After shipping any change, update ALL of these in the same turn, unasked, and say what changed in each:

1. **LCCS Academy** (`src/content/academy`): the lessons and quiz questions that teach the changed feature.
2. LCCS Feature Directory
3. User Guide (`src/lib/userGuide/entries.ts`)
4. Help (`src/lib/knowledgeBase.ts`, `src/app/help`)
5. What's New
6. AI Assistant: `src/lib/ai/appMap.ts`, the prompt in `assistantContext.ts`, and tools in `src/lib/ai/actions`
7. Starter Guide (`public/starter-guide.html`)
8. LCCS Tasks and Projects

Client-facing places (User Guide, Help, What's New, the assistant, the Starter Guide, and client lessons) only change when a client's own account is affected.

## Keeping the LCCS Academy current

The Academy must never teach something the app no longer does. The app changes first, then the User Guide, then the lessons written from it.

- Every lesson lists its `sources` (User Guide entries) and optional `files` (repo paths).
- `npm test` fails when a source changes and the lesson has not been reviewed, and when a new User Guide entry is in no lesson and not on `src/content/academy/coverage.ts`.
- To fix it, run `npm run academy:check`. Read each lesson it names against what changed, then rewrite the text and the questions, answers and explanations that are now wrong.
- Then run `npm run academy:stamp -- <lesson ids>`. Stamp a lesson only after reading it. Stamping is the statement that the lesson is correct.
- A new feature gets a lesson or a place in an existing one. Use `coverage.ts` only when a named later level will teach it.
- Changing a lesson's wording shows "Edited since approved" on the page. Tell Babs which lessons need her Approved again.

Every try-it has a question. Answers go to the assistant through `buildAssistantKnowledge`. A lesson with a `dimension` lifts that score (`academyLift`), so give a new lesson a dimension only where its work really affects that score.

Babs approves lessons in the Academy. `ACADEMY_STAGE` in `src/lib/academy/flag.ts` is `review`, `team` or `all`. Client announcements go out only at `all`.
