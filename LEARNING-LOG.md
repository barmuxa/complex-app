## Lesson 42 – Brad's finished product (Docker demo) crashed

- **Date:** 2026-10-20
- **Where:** Brad's demo in `complex-finished-product`, not my app
- **What happened:** the Node container crashed on startup / when using the chat.
- **Cause:** `app.js` passes Socket.IO connections through the express-session middleware with
  `sessionOptions(socket.request, socket.request.res, next)`. In newer Socket.IO 4.x versions,
  `socket.request.res` is missing, so express-session crashes.
  Docker runs `npm install` on start, and `"socket.io": "^4.4.0"` allows newer 4.x versions
  than Brad used in 2021.
- **Fix (by Gordon, Docker's AI assistant):** replaced the `io.use(...)` block with
  `io.engine.use(sessionOptions)`. After that, http://localhost:8080 returned HTTP 200.
- **What I learned:** a `^` version range can install a newer version that breaks old code.
  I'll probably meet the same problem in the chat lessons of my own app.

## Lesson 45 – package versions, package-lock.json and npm ci

- **Date:** 2026-10-26
- **Where:** my Complex App setup (and the reason Brad's Docker demo crashed in lesson 42)
- **What happened:** Brad's package.json uses ranges like `"express": "^4.19.2"`, not exact versions.
  His Docker demo had no 2021 lock file and ran `npm install` on start,
  so it installed a newer Socket.IO than his code was written for, and the chat crashed.
- **Cause:** `^` means "this version or any newer one with the same MAJOR number"
  (^4.19.2 → any 4.x, never 5.0). The first `npm install` picks the newest allowed
  versions. Only package-lock.json records exactly which ones were chosen,
  including the packages my packages depend on.
- **What I do now:**
  1. Once: put Brad's lesson-45 package.json in place and run `npm install`
     (creates package-lock.json).
  2. Commit package.json AND package-lock.json.
  3. From then on, reinstall with `npm ci`: after cloning, when node_modules acts strangely,
     and as the build command on Render.
  4. If something behaves differently from the video, check the real version: `npm ls <package>`.
- **What I learned:** package.json says what _may_ be installed; package-lock.json says what
  _was_ installed. `npm ci` installs exactly the lock, never changes it, and fails loudly
  if the two files disagree. Docker only freezes what's inside the image, and Brad's setup
  installed packages at startup, so they weren't frozen.

## Lesson 45 – package.json vs package-lock.json: where are the installed versions?

- **Date:** 2026-10-27
- **Where:** my Complex App setup
- **What happened:** I read package.json to see my packages and presumed `npm install`
  would update it, either rewriting all lines or the ones being installed, with the
  versions it actually installed. It doesn't: package.json still says
  `"express": "^4.19.2"`, while the really installed version (e.g. 4.21.2) is only
  in package-lock.json.
- **Cause:** package.json is the wish list (which ranges _may_ be installed);
  package-lock.json is the receipt (what _was_ installed). package.json changes only
  one line at a time:
  - `npm install` / `npm ci` with no package name: never changes it
  - `npm install validator`: adds one line, `"validator": "^<installed version>"`
  - `npm install express@5`: changes only the express line
  - `npm uninstall md5`: removes only that line
  - editing it by hand (e.g. replacing it with Brad's lesson-45 file): whatever I change
    The lock also only updates affected entries, except when it's created for the
    first time or deleted and regenerated.
- **What I do now:**
  1. Read package.json to see _which_ packages the project uses.
  2. Check the _really installed_ versions with `npm ls --depth=0`
     (or one package: `npm ls socket.io`).
  3. Put Brad's lesson-45 package.json in place _before_ the first install, so I never
     need the "delete the lock and reinstall" step.
  4. Use `git diff` to see exactly which lines of package.json and package-lock.json changed.
- **What I learned:** package.json = names + allowed ranges; package-lock.json = exact
  installed versions; `npm ls` = the quick way to see them. package.json only changes
  when I add, remove or change a package (one line each), never on a plain `npm install`.
