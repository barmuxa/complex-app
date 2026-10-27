# Learning Log

Problems I ran into and what I learned while building the Complex App.

## Contents

- [Course lessons](#course-lessons)
  - [Lesson 42 – Brad's finished product (Docker demo) crashed](#lesson-42--brads-finished-product-docker-demo-crashed)
  - [Lesson 45 – package versions, package-lock.json and npm ci](#lesson-45--package-versions-package-lockjson-and-npm-ci)
  - [Lesson 45 – package.json vs package-lock.json: where are the installed versions?](#lesson-45--packagejson-vs-package-lockjson-where-are-the-installed-versions)
  - [Lesson 43 – why `__dirname` in `app.set('views', ...)`](#lesson-43--why-__dirname-in-appsetviews-)
  - [Lesson 43 – `href="main.css"` vs `href="/main.css"`](#lesson-43--hrefmaincss-vs-hrefmaincss)
- [Git notes](#git-notes)
  - [Git – `git status` shows folders, not the files inside](#git--git-status-shows-folders-not-the-files-inside)
  - [Git – fixing a commit message after pushing (`--amend`, then "cannot push")](#git--fixing-a-commit-message-after-pushing---amend-then-cannot-push)

# Course lessons

Things I learned from Brad's course, by lesson number.

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

## Lesson 43 – why `__dirname` in `app.set('views', ...)`

- **Date:** 2026-10-27
- **Where:** my app (`app.js`)
- **What happened:** I wrote `app.set('views', __dirname + '/views');` and wondered if
  `__dirname` is needed at all. I thought `'views'` alone would always find my `views` folder.
- **Cause:** a relative path like `'views'` is resolved from `process.cwd()`, the folder I
  _run_ `node` from, not the folder `app.js` is in. `__dirname` is the absolute path of the
  folder that contains the current file (here `complex-app`), so `__dirname + '/views'`
  always points to `complex-app/views`.
  - `node app.js` from `complex-app/`: both versions find `complex-app/views`
  - `node complex-app/app.js` from the parent folder: `'views'` looks in `parent/views`
    and EJS can't find `home-guest`; `__dirname + '/views'` still works

  Express's default for `views` is also `process.cwd() + '/views'`, so it has the same
  problem.
- **What I do now:**
  1. Keep `__dirname + '/views'` in `app.set('views', ...)`.
  2. If I get a "Failed to lookup view" error, first check which folder I started
     `node` from.
- **What I learned:** relative paths depend on where I start the app; `__dirname` depends on
  where the file is. `__dirname` makes the path work no matter where `node` is started.

## Lesson 43 – `href="main.css"` vs `href="/main.css"`

- **Date:** 2026-10-27
- **Where:** my app (`views/home-guest.ejs`)
- **What happened:** my template has `<link rel="stylesheet" href="main.css">` and the CSS
  loads fine on `/`. I wondered if I need a `/` in front, since it already works.
- **Cause:** without the `/`, the browser treats `main.css` as relative to the _current
  page's folder_. With the `/`, it always starts from the site root, and that is where
  `app.use(express.static(__dirname + '/public'))` serves `public/main.css`.
  - on `/`: both request `/main.css`
  - on `/post/123`: `main.css` requests `/post/main.css` (404), `/main.css` still works
  - on `/profile/brad/followers`: `main.css` requests `/profile/brad/main.css` (404)

  So it only breaks later, on deeper URLs. The page still gets Bootstrap from the CDN,
  so it looks only a little off, and that is easy to miss.
- **What I do now:**
  1. Start links to my own files (CSS, JS, images) with `/`, e.g. `href="/main.css"`.
  2. If a page looks unstyled, open DevTools → Network and check which URL the CSS
     was requested from.
- **What I learned:** a link without `/` depends on the page URL; a link with `/` always
  starts from the root that `express.static` serves. Working on `/` doesn't prove it works
  everywhere.

# Git notes

Git questions I had along the way. Git isn't part of the course, so these have no lesson number.

## Git – `git status` shows folders, not the files inside

- **Date:** 2026-10-27
- **Where:** my setup (git)
- **What happened:** after adding `views/home-guest.ejs` and `public/main.css`, `git status`
  only showed `views/` and `public/`. I expected to see the file names.
- **Cause:** when _nothing_ in a folder is tracked yet, git shows the folder as one line
  instead of listing every file in it. Once a file in the folder is committed, new files
  there are listed one by one.
- **What I do now:**
  1. Run `git status -u` (short for `--untracked-files=all`) to see every untracked file.
  2. For a compact list, run `git status -s -u`: `??` = untracked, `M` = modified.
     Today it showed `?? public/main.css` and `?? views/home-guest.ejs`.
  3. Optional: `git config --global status.showUntrackedFiles all` makes plain
     `git status` always list the files.
- **What I learned:** a folder in `git status` doesn't mean only the folder is new; it means
  everything inside is untracked. `-u` shows exactly which files those are.

## Git – fixing a commit message after pushing (`--amend`, then "cannot push")

- **Date:** 2026-10-27
- **Where:** my setup (git and GitHub)
- **What happened:** I wanted to change one letter in my last commit message
  (`use ejs` → `Use ejs`), which I had already pushed. I ran `git commit --amend` and
  fixed it, but then `git push` was rejected. I expected the push to just update the message.
- **Cause:** a commit can't be edited. `--amend` makes a _new_ commit with a new ID
  (`5abf5a3` → `60513fb`) and drops the old one from my branch. GitHub still had the old
  one, so `git status` said `ahead 1, behind 1`. A normal push never removes commits from
  GitHub, so it was rejected.
- **What I do now:**
  1. Fix commit messages _before_ pushing: `git commit --amend` (opens the editor) or
     `git commit --amend -m "new message"`.
  2. If it's already pushed and I'm the only one using the branch, push with
     `git push --force-with-lease`. It replaces GitHub's commit with mine, but refuses
     if GitHub has something I haven't seen yet.
  3. Don't run `git pull` in this situation: it would merge the old commit back in.
  4. For a one-letter typo, it's also fine to leave it.
- **What I learned:** amending rewrites history: same files, new commit ID. That's
  harmless before pushing, but after pushing it needs a force push, which is only safe
  on a branch nobody else uses.
