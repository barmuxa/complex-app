# Learning Log

Problems I ran into and what I learned while building the Complex App.

## Contents

- [Course lessons](#course-lessons)
  - [Lesson 42 – Brad's finished product (Docker demo) crashed](#lesson-42--brads-finished-product-docker-demo-crashed)
  - [Lesson 45 – package versions, package-lock.json and npm ci](#lesson-45--package-versions-package-lockjson-and-npm-ci)
  - [Lesson 45 – package.json vs package-lock.json: where are the installed versions?](#lesson-45--packagejson-vs-package-lockjson-where-are-the-installed-versions)
  - [Lesson 43 – why `__dirname` in `app.set('views', ...)`](#lesson-43--why-__dirname-in-appsetviews-)
  - [Lesson 43 – `href="main.css"` vs `href="/main.css"`](#lesson-43--hrefmaincss-vs-hrefmaincss)
  - [Lesson 47 – `module.exports` vs `exports`](#lesson-47--moduleexports-vs-exports)
  - [Lesson 47 – MVC: which code goes in which file](#lesson-47--mvc-which-code-goes-in-which-file)
  - [Lesson 52 – bogus properties: mass assignment and the allow-list in `cleanUp`](#lesson-52--bogus-properties-mass-assignment-and-the-allow-list-in-cleanup)
  - [Lesson 55 – creating a database with the MongoDB VS Code extension (Playground)](#lesson-55--creating-a-database-with-the-mongodb-vs-code-extension-playground)
  - [Lesson 55 – does `"main"` in package.json have to be `db.js`?](#lesson-55--does-main-in-packagejson-have-to-be-dbjs)
  - [Lesson 56 – what `dotenv.config()` does](#lesson-56--what-dotenvconfig-does)
- [Git notes](#git-notes)
  - [Git – `git status` shows folders, not the files inside](#git--git-status-shows-folders-not-the-files-inside)
  - [Git – fixing a commit message after pushing (`--amend`, then "cannot push")](#git--fixing-a-commit-message-after-pushing---amend-then-cannot-push)
  - [Git – an empty folder is not committed](#git--an-empty-folder-is-not-committed)

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

## Lesson 47 – `module.exports` vs `exports`

- **Date:** 2026-10-27
- **Where:** my app (`router.js` and `controllers/userController.js`)
- **What happened:** `router.js` ends with `module.exports = router;`, but
  `controllers/userController.js` uses `exports.login = function (req, res) {};`.
  I didn't know why there are two ways, or if they are the same thing.
- **Cause:** when Node loads a file, it creates one empty object, `module.exports = {}`,
  and a shortcut variable `exports` that points to the _same_ object. `require()` always
  returns `module.exports`.
  - `exports.login = ...` adds a property to that shared object, so `require` gets
    `{ login, logout, register, home }`. Writing `module.exports.login = ...` does the same.
  - `module.exports = router` replaces the whole object, so `require('./router')`
    returns the router itself, which `app.use('/', router)` in `app.js` needs.
  - `exports = router` would only point the shortcut somewhere else. `module.exports`
    would still be `{}`, and `require` would return `{}`.
- **What I do now:**
  1. Several named things (like controller functions): `exports.name = ...`.
  2. One single thing (a router, a class, one function): `module.exports = ...`.
  3. Never write `exports = ...`.
- **What I learned:** `exports` is just a shortcut to `module.exports`, and `require`
  returns `module.exports`. Adding properties works with either, but replacing the whole
  export only works with `module.exports`.

## Lesson 47 – MVC: which code goes in which file

- **Date:** 2026-10-27
- **Where:** my app (`router.js`, `controllers/`, `views/`)
- **What happened:** Brad started MVC (Model–View–Controller) and said it's hard to get
  my head around. At first I didn't see why the code is split into so many files, when
  my first route in `router.js` did everything inline.
- **Cause:** MVC is a rule about _which job_ goes in _which file_, so that each file
  does one thing. It's like a restaurant:
  - **Router** (the host at the door): `router.js` only says which URL goes to which
    controller function, e.g. `router.get('/', userController.home);`.
  - **Controller** (the waiter): `controllers/userController.js` takes the request, asks
    the model for what's needed and sends back a response, e.g. `exports.home` does
    `res.render('home-guest')`. It doesn't "cook".
  - **Model** (the kitchen): the data and its rules (validate, save to and read from
    MongoDB). It knows nothing about URLs or HTML. I don't have a `models` folder yet.
  - **View** (the plating): `views/home-guest.ejs` only turns data into HTML.

  One request: browser → router → controller → model → controller → view → browser.
- **What I do now:**
  1. When I write new code, I first ask: is it a URL (router), a data rule or database
     work (model), HTML (view), or the glue between them (controller)?
  2. When something is wrong, I open the file for that job: wrong URL → `router.js`,
     wrong data rules → the model, wrong HTML → the view.
- **What I learned:** MVC isn't new code, it's a way to sort code. The controller is the
  thin middle that connects the model (data and rules) with the view (HTML).

## Lesson 52 – bogus properties: mass assignment and the allow-list in `cleanUp`

- **Date:** 2026-10-28
- **Where:** my app (`models/User.js`, `User.prototype.cleanUp`)
- **What happened:** Brad said to ignore any extra "bogus" properties besides `username`,
  `email` and `password`, but didn't explain the danger. In my lesson 51 check, a request
  to `/register` with an extra `isAdmin=true` was accepted ("Congrats, there are no
  errors"). I thought the server only gets the fields my form has.
- **Cause:** the server never sees my form, only the request, and anyone can add fields
  to it (DevTools → Inspect → add an `<input>`, or `curl`/Postman). The extra field goes
  all the way: `req.body` → `new User(req.body)` → `this.data` → (next lesson)
  `insertOne(this.data)`. MongoDB stores whatever object I give it, so without a clean-up
  the visitor decides what's saved in their user document:
  - `isAdmin: true`: harmless today, an admin the day I write `if (user.isAdmin)`
  - their own `_id`
  - megabytes of junk text

  This attack is called _mass assignment_. In 2012 Egor Homakov used it on GitHub to add
  his key to the Ruby on Rails repository.
- **What I do now:**
  1. In `cleanUp`, rebuild `this.data` from only the fields I expect (an _allow-list_):
     `this.data = { username: ..., email: ..., password: ... }`. Everything else is dropped.
  2. Never save `req.body` directly; copy over only the fields I need. Same later for
     posts (`title`, `body`).
  3. Prefer an allow-list over a block-list (`delete this.data.isAdmin`), which only
     stops the fields I thought of.
- **What I learned:** I can't control what reaches my server, only what I accept and
  keep. "Accept only what I described" is safer than "reject what looks bad".

## Lesson 55 – creating a database with the MongoDB VS Code extension (Playground)

- **Date:** 2026-10-28
- **Where:** my setup (MongoDB for VS Code extension, connected to Atlas)
- **What happened:** I clicked _Create Database_ in the MongoDB extension and expected a
  form asking for a database name. Instead it opened a Playground, a `.mongodb.js` file
  with template code, and I wasn't sure if that was the right way.
- **Cause:** MongoDB creates databases _lazily_: a database only exists once one of its
  collections has data in it. That's why there is nothing to "create" with a form. The
  template does it with code:
  - `use('dbName')` only switches to the database; it creates nothing yet
  - `db.getCollection('users').insertOne({...})` saves a document, and that creates the
    database and the collection
- **What I do now:**
  1. In the template, change the database name (and collection name) to the one I want.
  2. Check in the status bar that the Playground uses my Atlas connection, not a local one.
  3. Click _Run_ (▶) at the top right, or Command Palette → _MongoDB: Run All From
     Playground_.
  4. Refresh the connection in the MongoDB sidebar to see the new database.
  5. Don't save the Playground into the project; if I do, delete it or add `*.mongodb.js`
     to `.gitignore` so it stays out of my lesson commits.
- **What I learned:** in MongoDB, a database or collection appears the first time I insert
  data into it, so the Playground is the normal way to create one from VS Code. My app's
  first `insertOne` would create the `users` collection on its own anyway.

## Lesson 55 – does `"main"` in package.json have to be `db.js`?

- **Date:** 2026-10-28
- **Where:** my app (`package.json`, `db.js`, `app.js`)
- **What happened:** I moved `app.listen(3000, ...)` out of `app.js` into the new `db.js`,
  so the app now starts from `db.js`. I changed the scripts to `"start": "node db.js"`
  and `"watch": "nodemon db"`, but `package.json` still says `"main": "app.js"`. I thought
  `"main"` had to point to the file that starts the server.
- **Cause:** `"main"` is the file Node loads when _another_ project does
  `require('complex-app')`, i.e. when my project is used as a library. Nobody does that
  with this app. What really starts it are my scripts, and they name the file directly:
  - `npm start` runs `node db.js`
  - `npm run watch` runs `nodemon db`

  The only time `"main"` matters for me is plain `nodemon` with no file name: then
  nodemon falls back to `"main"` and runs `app.js`. That file no longer calls `listen()`,
  so the server would never start.
- **What I do now:**
  1. Leave `"main": "app.js"` as Brad has it. Changing it to `"db.js"` would also be
     fine; nothing breaks either way.
  2. Start the app with `npm run watch` (or `npm start`), never plain `nodemon`.
- **What I learned:** the `scripts` decide which file starts my app; `"main"` is only for
  `require`-ing the package from somewhere else.

## Lesson 56 – what `dotenv.config()` does

- **Date:** 2026-10-28
- **Where:** my app (`db.js`, `.env`)
- **What happened:** I moved my Atlas connection string out of `db.js` into a `.env` file
  and added `const dotenv = require('dotenv');` and `dotenv.config();` (`dotenv@16.6.1`).
  I didn't know what `dotenv.config()` actually does.
- **Cause:** `process.env` is the object where Node keeps environment variables.
  `dotenv.config()` reads the `.env` file and copies every `KEY=value` line onto
  `process.env`. After that, `process.env.KEY` holds the value, which is how
  `new MongoClient(process.env...)` gets the connection string.
  - it looks for `.env` in the folder I _start_ `node` from (`process.cwd()`), not the
    folder of `db.js`
  - it must run _before_ any line that reads `process.env`
  - it doesn't overwrite a variable that's already set (in my shell, or on a host like
    Render), so the host can use its own values without a `.env` file
  - a missing `.env` or a misspelled name gives no error, just `undefined`
  - every value is a string: `PORT=3000` gives `"3000"`, not the number `3000`
- **What I do now:**
  1. Put secrets (connection string, passwords) only in `.env`, never in the code.
  2. Keep `.env` in `.gitignore` so it never gets committed.
  3. Call `dotenv.config()` at the very top of the file that starts the app (`db.js`).
  4. If a value is `undefined`, check that the name in `.env` and in `process.env.NAME`
     is spelled exactly the same, and that I started `node` from the project folder.
- **What I learned:** `dotenv.config()` just copies `.env` into `process.env` once, at
  startup. It keeps secrets out of my code and out of git, and other computers can
  give the same names different values.

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

## Git – an empty folder is not committed

- **Date:** 2026-10-27
- **Where:** my setup (git)
- **What happened:** I had an empty `controllers` folder in my app and wondered if it
  would be part of my commit. I thought git would save the folder, even with nothing in it.
- **Cause:** git tracks only _files_, not folders. A folder exists in a commit only because
  a file inside it has that path, e.g. `views/home-guest.ejs`. An empty folder doesn't show
  in `git status` (not even with `-u`), can't be added with `git add`, and won't exist
  on GitHub or after cloning.
- **What I do now:**
  1. Usually nothing: the folder gets committed as soon as I put its first file in it.
  2. If an empty folder really must exist in the repo, I add a placeholder file:
     `touch controllers/.gitkeep`, then `git add controllers/.gitkeep`. `.gitkeep` is
     just a common name, not a git feature. I delete it once the folder has real files.
- **What I learned:** git sees paths of files, not folders. No files inside means no
  folder in the commit.
