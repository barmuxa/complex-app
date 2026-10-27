---
description: Add a new entry to LEARNING-LOG.md
argument-hint: [optional: what happened / what I learned]
---

Add a new entry to LEARNING-LOG.md in the project root (my learning log for Brad Schiff's Complex App course).

What to write about: usually we have just discussed a problem in this conversation. Base the entry on that discussion (what I did, what went wrong, why, how we fixed it). If I wrote a topic after the command (see the last line), focus on that. If neither makes it clear what the note is about, ask me before writing.

File layout: the title and intro line, then `## Contents`, then one `#` section per topic, each with a one-line intro:
- `# Course lessons`: anything Brad's course teaches (Node, Express, EJS, npm, MongoDB, etc.).
- `# Git notes`: git questions (git isn't part of the course).
If an entry fits neither section, ask me whether to add a new section before writing it.

Format. Copy it exactly from the existing entries:
- Add the entry at the END of its section (oldest first). Don't touch the title, the intro lines or any existing entry.
- Add a line for the entry at the end of its section's list in `## Contents`: `  - [<heading text>](#<anchor>)`. Make the anchor the way GitHub does: lowercase, remove backticks and every character except letters, digits, `_`, `-` and spaces, then turn each space into `-` (so ` – ` becomes `--`). If you add a new section, add it to `## Contents` too.
- Heading for a course entry: `## Lesson <number> – <short title>`, with an en dash (–). If you don't know the lesson number, ask me.
- Heading for a git entry: `## Git – <short title>`, with an en dash (–). No lesson number.
- Then these bullets, in this order, each label in bold:
  - **Date:** today's date, YYYY-MM-DD
  - **Where:** in my app, in Brad's demo (complex-finished-product), or in my setup
  - **What happened:** what I did or saw, and what I expected instead
  - **Cause:** why it happened
  - Use **Fix:** for a bug (credit whoever fixed it, e.g. "**Fix (by Gordon, Docker's AI assistant):**"), OR **What I do now:** for a lesson about habits or workflow, as a numbered list
  - **What I learned:** the takeaway in 1–3 sentences
- Wrap lines at about 90 characters. Continuation lines are indented 2 spaces. In numbered lists, continuation lines are indented 5 spaces. Sub-lists use "  - ".
- If a field needs an extra paragraph after a list, add a blank line and indent it 2 spaces.
- Code, commands, file names in code and versions go in `backticks`. Use _underscores_ for emphasis.

Content:
- Write in first person ("I", "my"), in plain, simple English. I'm learning, so explain the cause so I'll understand it later.
- Keep it short: one entry = one problem or one idea.
- Don't guess facts. Check real versions with `npm ls <package>`, and check code by reading the actual file before you quote it.
- Brad's course uses CommonJS, Express 4 and his lesson-45 package versions. Don't suggest modern rewrites in the entry unless I ask.

When you're done, show me `git diff LEARNING-LOG.md` and don't commit.

Topic I wrote after the command (may be empty): $ARGUMENTS
