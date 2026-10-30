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
  - [Lesson 47 – same name in two layers: the controller's `login` vs the model's `login`](#lesson-47--same-name-in-two-layers-the-controllers-login-vs-the-models-login)
  - [Lesson 52 – bogus properties: mass assignment and the allow-list in `cleanUp`](#lesson-52--bogus-properties-mass-assignment-and-the-allow-list-in-cleanup)
  - [Lesson 55 – creating a database with the MongoDB VS Code extension (Playground)](#lesson-55--creating-a-database-with-the-mongodb-vs-code-extension-playground)
  - [Lesson 55 – does `"main"` in package.json have to be `db.js`?](#lesson-55--does-main-in-packagejson-have-to-be-dbjs)
  - [Lesson 56 – what `dotenv.config()` does](#lesson-56--what-dotenvconfig-does)
  - [Lesson 60 – three ways to wait for slow work: callbacks, `.then`, `async`/`await`](#lesson-60--three-ways-to-wait-for-slow-work-callbacks-then-asyncawait)
  - [Lesson 62 – hashing passwords with bcryptjs: `hashSync` and `compareSync`](#lesson-62--hashing-passwords-with-bcryptjs-hashsync-and-comparesync)
  - [Lesson 63 – how a server trusts a request: authentication vs authorization](#lesson-63--how-a-server-trusts-a-request-authentication-vs-authorization)
  - [Lesson 63 – sessions and cookies: how `express-session` tells browsers apart](#lesson-63--sessions-and-cookies-how-express-session-tells-browsers-apart)
  - [Lesson 64 – session security: CSRF and `sameSite: 'strict'`](#lesson-64--session-security-csrf-and-samesite-strict)
  - [Lesson 65 – passing data to an EJS template: `res.render` and `<%= %>`](#lesson-65--passing-data-to-an-ejs-template-resrender-and--)
  - [Lesson 66 – `req.session.destroy()` takes a callback, not `await`](#lesson-66--reqsessiondestroy-takes-a-callback-not-await)
- [Git notes](#git-notes)
  - [Git – `git status` shows folders, not the files inside](#git--git-status-shows-folders-not-the-files-inside)
  - [Git – fixing a commit message after pushing (`--amend`, then "cannot push")](#git--fixing-a-commit-message-after-pushing---amend-then-cannot-push)
  - [Git – an empty folder is not committed](#git--an-empty-folder-is-not-committed)
  - [Git – working directory, staging area and last commit (`git diff` vs `git diff HEAD`)](#git--working-directory-staging-area-and-last-commit-git-diff-vs-git-diff-head)

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

## Lesson 47 – same name in two layers: the controller's `login` vs the model's `login`

- **Date:** 2026-10-29
- **Where:** my app (`router.js`, `controllers/userController.js`, `models/User.js`)
- **What happened:** `controllers/userController.js` has `exports.login = function (req, res)`
  and `models/User.js` has `User.prototype.login = async function (callback)`. The same
  happens with `register`. With so many moving parts, two functions with one name confused
  me: which `login` runs, and when?
- **Cause:** they are two different functions stored on two different objects, and the
  part before the dot tells JavaScript (and me) which one is meant:
  - `userController.login` (the waiter): called by `router.js`. It gets `req` and `res`,
    creates `new User(req.body)` and sends the answer with `res.send(result)`.
  - `user.login(...)` (the kitchen): a method every `User` object has. It runs
    `this.cleanUp()` and looks the user up in `usersCollection`. It knows nothing about
    `req` or `res`.
  - inside `userController.js`, a bare `login` doesn't even exist: `exports.login` is a
    property of the exports object, not a variable, so the controller has to write
    `user.login(...)`.

  Giving them the same name is a convention on purpose: both are the same step, "log in",
  seen from two layers. One login request:
  `router.post('/login', userController.login)` → `user.login(callback)` →
  `callback('Congrats!')` → `res.send(result)`.
- **What I do now:**
  1. I always say the full name, even in my head: "the controller's `login`" or "the
     model's `login`" (`userController.login` vs `user.login`), never just "`login`".
  2. To tell them apart, I ask: does it use `req`/`res`? Then it's the controller. Does it
     use `this.data` or the database? Then it's the model.
  3. To trace a request, I follow the same name through the files: `router.js` →
     `controllers/userController.js` → `models/User.js`.
  4. I keep Brad's names. Other projects make the layer part of the name (e.g.
     `handleLogin` in the controller, `authenticate()` in the model); that's only style.
- **What I learned:** the same name in different layers isn't a conflict, it's a
  convention: the name says _which step_, the file (or the part before the dot) says
  _which layer_. Matching names make it easy to follow one request from file to file.

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

## Lesson 60 – three ways to wait for slow work: callbacks, `.then`, `async`/`await`

- **Date:** 2026-10-29
- **Where:** my app (`models/User.js`, `controllers/userController.js`) and Brad's
  CodePen meal example
- **What happened:** in lessons 58–60 I wrote the same login twice: first with a callback,
  then with a Promise and `.then`/`.catch`. In the CodePen, the meals (`eatBreakfast()`,
  `eatLunch()`, ...) finished in the wrong order, even though I called them in the right
  order. I wasn't sure how the three approaches differ.
- **Cause:** JavaScript _starts_ each function in order, but it doesn't wait for the slow
  part (a timer, or a database query). That part finishes later, so I need a way to say
  "do this when it's done":
  - **Callback**: I hand over a function, and it's called when the work is done
    (`user.login(function (result) {...})` in lesson 58). Several steps in a row means
    one level deeper per step ("callback hell"), and every step needs its own error check.
  - **`.then`/`.catch`**: the slow function returns a Promise, an object for a result that
    arrives later. `.then` gets the value passed to `resolve`, `.catch` gets what was
    passed to `reject`. Each `.then` _returns_ the next Promise, so the steps stay flat:
    `eatBreakfast().then(() => eatLunch()).then(() => eatDinner())`, and one `.catch` at
    the end handles an error from any step. The controller's `login` uses this now.
  - **`async`/`await`**: `await` pauses until the Promise settles and gives me its value:
    `const attemptedUser = await usersCollection.findOne(...)`. The code reads top to
    bottom like normal code. Brad's favorite.

  Approaches 2 and 3 use the same Promise in two ways: `await` and `.then` both "unwrap"
  it. MongoDB's `client.connect()`, `findOne()` and `insertOne()` all return Promises.
  Rules for `await`:
  - it only works inside an `async` function
  - if the Promise rejects, `await` _throws_, so I need `try { ... } catch (e) { ... }`
  - an `async` function always returns a Promise itself, so its caller has to wait too
- **What I do now:**
  1. Keep Brad's code as he writes it. From here on he uses `async`/`await` most of the
     time, not callbacks.
  2. Every `await` that can fail needs a `try`/`catch` (or a `.catch`) _where the error
     happens_, so it can become a `reject` and travel up to the code that answers the
     browser.
  3. Remember the gap in the model's `login`: if `findOne` fails inside
     `new Promise(async (resolve, reject) => ...)`, nothing calls `reject`, so the
     controller's `.catch` never runs and the browser waits forever. Brad's finished app
     fixes it with `findOne(...).then(...).catch(() => reject('Please try again later.'))`.
- **What I learned:** all three solve the same problem: "do this when the slow work is
  done". Callbacks nest, `.then` chains stay flat, and `await` reads like normal code. A
  rejected Promise still needs a `try`/`catch` or a `.catch`.

## Lesson 62 – hashing passwords with bcryptjs: `hashSync` and `compareSync`

- **Date:** 2026-10-29
- **Where:** my app (`models/User.js`, the model's `register`, `login` and `validate`)
- **What happened:** my users' passwords were saved in Atlas as plain text. Brad added
  `bcryptjs` (`bcryptjs@2.4.3`): the model's `register` now saves a long hash instead of
  the password, and the model's `login` checks it with `bcrypt.compareSync(...)`. I wanted
  to understand what both steps really do, and why `==` doesn't work anymore.
- **Cause:** if my database ever leaked, plain-text passwords would also open my users'
  other accounts, because people reuse passwords. A _hash_ is a one-way conversion
  (Brad: like burning paper into ash). Encryption can be decrypted; a hash can't be
  turned back into the password, it can only be checked.

  **Hashing (the model's `register`):**
  ```js
  let salt = bcrypt.genSaltSync(10);
  this.data.password = bcrypt.hashSync(this.data.password, salt);
  ```
  - `genSaltSync(10)` makes a _salt_: a random value, new for every user. `10` is the
    _cost_: bcrypt runs 2¹⁰ rounds, slow on purpose (about 68 ms on my Mac), so an
    attacker can't try millions of guesses quickly.
  - `hashSync` mixes the password with the salt and returns a 60-character string, and
    I overwrite `this.data.password` with it before `insertOne`. The salt is stored
    _inside_ the hash, so I don't need a separate field for it:
    `$2a$` (algorithm) + `10$` (cost) + 22 characters of salt + 31 characters of hash.
  - because the salt is random, the same password gives a different hash every time. Two
    users with the same password don't get the same hash, and an attacker can't look
    hashes up in a ready-made table of common passwords.
  - it runs inside `if (!this.errors.length)`, after `validate`: the length checks need
    the password as typed (every hash is 60 characters), and there's no point hashing a
    password that gets rejected.

  **Comparing (the model's `login`):**
  ```js
  if (attemptedUser && bcrypt.compareSync(this.data.password, attemptedUser.password)) {
  ```
  - `==` can't work anymore: the typed password is plain text, the stored one is a hash.
  - hashing the typed password again with `hashSync` wouldn't match either, because a
    new random salt would give a different hash.
  - `compareSync(typed, storedHash)` reads the salt and cost out of the stored hash,
    hashes the typed password with that _same_ salt, and returns `true` if the results
    match, `false` if not. The order matters: plain password first, hash second.
  - the old plain-text users couldn't log in anymore (`compareSync` just returns `false`),
    so I deleted them in Atlas.

  **The 50-character limit (the model's `validate`):** bcrypt only uses the first 72
  _bytes_ of a password and silently ignores the rest. Claude tested it on my version:
  72 × `a` plus `EXTRA` still matched. So Brad lowered the max from 100 to 50 characters. (Bytes, not
  characters: `č` takes 2 bytes, an emoji 4.)
- **What I do now:**
  1. Never store or log a real password; store only the hash from `hashSync`.
  2. Validate first, hash second, then save.
  3. Check a password only with `compareSync(typed, storedHash)`, never with `==`.
  4. Use a slow password hash like bcrypt, never a fast one like `md5` (Brad uses `md5`
     later only for Gravatar images, not for passwords).
- **What I learned:** the server never needs to know the password, only whether the typed
  one produces the same hash. The random salt is why the same password gives different
  hashes, and why I need `compareSync`, which reuses the salt saved inside the hash.

## Lesson 63 – how a server trusts a request: authentication vs authorization

- **Date:** 2026-10-30
- **Where:** Brad's lesson 63 (no code yet, just the idea before sessions)
- **What happened:** Brad said there are two ways for the server to trust the requests
  that come after a login: _sessions_ and _tokens_. I wondered if there are others, and
  what this whole topic is called.
- **Cause:** HTTP is _stateless_: the server forgets me as soon as it has answered. So
  every request has to carry some proof of who I am. The ways to do it:
  - **Session** (lesson 63): the browser sends only an ID in the `connect.sid` cookie;
    the data (`req.session.user`) stays on the server. Logging out = delete the session.
  - **Token** (later, for the API, `jsonwebtoken`): the data travels _inside_ a signed
    token, sent in a header (`Authorization: Bearer <token>`). The server stores
    nothing, only checks the signature, so a token stays valid until it expires.
  - **HTTP Basic Auth**: username and password sent with _every_ request (the grey
    browser pop-up). Only safe with HTTPS.
  - **API key**: one fixed string that identifies a _program_, not a logged-in person
    (e.g. the SendGrid key later in the course).
  - **Client certificates**: proof during the HTTPS connection; mostly between servers.

  "Log in with Google" (OAuth) and passkeys are ways to _log in_, not to stay logged in:
  afterwards the app still gives me a session or a token.

  All of this is **authentication** ("_who_ are you?"). It's easy to mix up with
  **authorization** ("_what_ may you do?"), which always comes second.
- **What I do now:**
  1. Ask "who is this?" (authentication) separately from "may they do this?"
     (authorization).
  2. Expect both in the course: login, sessions and `mustBeLoggedIn` are authentication;
     "only the author can edit or delete their post" is authorization.
- **What I learned:** I can log in in many ways (password, Google, passkey). But after
  that, the server remembers me with a session cookie or a token in almost every web
  app, and those are the two that Brad teaches. Authentication (authn) says who I am;
  authorization (authz) says what I'm allowed to do.

## Lesson 63 – sessions and cookies: how `express-session` tells browsers apart

- **Date:** 2026-10-30
- **Where:** my app (`app.js`, `controllers/userController.js`), `express-session@1.19.0`
- **What happened:** after a successful login, the controller's `login` now stores
  `req.session.user = { hobby: 'coding', username: user.data.username }`, and the
  controller's `home` shows "Welcome to the actual application." when
  `req.session.user` exists. It worked in Chrome, but a private window still got the
  guest page. I wondered how the server keeps one session per visitor apart from all
  the others.
- **Cause:** `app.use(sessionOptions)` runs before my routes on every request. With the
  default store, all sessions live in one object in the server's memory
  (`this.sessions` in `express-session/session/memory.js`), keyed by session ID:
  `{ '<id 1>': { cookie, user }, '<id 2>': { cookie, user } }`. On each request:
  1. It looks for the `connect.sid` cookie (Brad says "Connected", but that's the name).
     - **no cookie**: a new, empty `req.session` with a new ID: `uid(24)`, 24 random
       bytes written as 32 characters. Impossible to guess.
     - **a cookie**: it checks the cookie's _signature_ with my `secret`. If it matches,
       it finds that ID in the store and puts its data on `req.session`. If someone
       edited the ID, the signature fails and they get a new, empty session instead.
  2. My controller reads or writes `req.session`, which is only this visitor's entry.
  3. When the response is sent, it saves the session under its ID and sends
     `Set-Cookie: connect.sid=s:<id>.<signature>`. The browser then sends that cookie back
     automatically with every request to `localhost:3000`.

  So the server recognizes _cookies_, not people: Chrome and a private window have
  different cookies, so they are two different sessions. The options in my `app.js`:
  - `secret`: signs the cookie, so nobody can fake or change an ID. Must stay secret, so
    mine is `process.env.SESSIONSECRET` from `.env`, not text in `app.js` (Brad's way).
  - `resave: false`: don't save a session again if it didn't change.
  - `saveUninitialized: false`: a cookie only once something is stored, so only after
    login. `true` would give every guest a cookie and a session on the first visit.
  - `cookie.maxAge`: how long the cookie lives, in ms: `1000 * 60 * 60 * 24` = 1 day.
  - `cookie.httpOnly: true`: JavaScript in the page can't read the cookie
    (`document.cookie`), so a malicious script can't steal it.
- **What I do now:**
  1. Put `app.use(sessionOptions)` _above_ `app.use('/', router)`; otherwise
     `req.session` is `undefined` in my controllers.
  2. Check the cookie in DevTools → _Application_ → _Cookies_ → `localhost:3000`:
     `connect.sid`, with _HttpOnly_ ticked.
  3. Remember that sessions are in memory for now: every nodemon restart wipes them. My
     browser still has the cookie, but the server no longer knows its ID, so I'm a guest
     again. The next lesson moves sessions into MongoDB with `connect-mongo`.
- **What I learned:** the browser keeps only a signed, random ID; the data stays on the
  server. The ID can't be guessed and the signature means it can't be faked, so "you
  have an ID I gave you" is enough for the server to trust the request.

## Lesson 64 – session security: CSRF and `sameSite: 'strict'`

- **Date:** 2026-10-30
- **Where:** my app (`app.js`, the session cookie options)
- **What happened:** Brad added one option to the session cookie and said it protects
  against _CSRF_ attacks, without explaining what CSRF is:
  ```js
  cookie: { maxAge: 1000 * 60 * 60 * 24, httpOnly: true, sameSite: 'strict' },
  ```
  I wanted to know what the attack is and why one line stops it.
- **Cause:** the browser sends my `connect.sid` cookie automatically with _every_ request
  to my app, no matter which page started the request. _CSRF_ (Cross-Site Request
  Forgery) uses exactly that:
  1. I'm logged in to my app, so my browser has the session cookie.
  2. I visit `evil.com`. It has a hidden form that submits itself to my app (e.g.
     `POST /delete-post`).
  3. My browser sends the request _with my cookie_, so the server thinks it's me.

  The attacker never sees the cookie (`httpOnly` hides it anyway); my own browser does
  the work. `sameSite: 'strict'` tells the browser to send the cookie only when the
  request comes from my own site. A request started by `evil.com` arrives without it, so
  the server treats it as a guest and the attack does nothing.
- **What I do now:**
  1. Spell it exactly: `sameSite` with a capital S, and the value `'strict'` in
     lowercase. A typo gives no error; the option just does nothing.
  2. Check it in DevTools → _Application_ → _Cookies_ → `localhost:3000` →
     `connect.sid`: the _SameSite_ column must say _Strict_.
  3. Log in again after the change. Saving `app.js` restarts nodemon, which wipes the
     in-memory sessions, and the browser only gets the new setting when the server sends
     the cookie again.
  4. Remember that a _site_ is not an _origin_. A site is the main domain, without
     subdomains and ports: `media.mydomain.com` is the same site as `mydomain.com`. So a
     hacked subdomain could still get my cookie sent, which is Brad's warning. For the
     same reason, `localhost:3000` (my app) and `localhost:4000` (my roadmap) are the
     same site; harmless, since both are mine.
  5. Expect the side effect of `strict`: if I click a link to my app from _another_ site
     (e.g. an email in Gmail), that first request also comes without the cookie, so I
     look logged out until I click around or refresh. The milder `'lax'` sends the
     cookie on simple link clicks but still blocks cross-site form `POST`s. Brad uses
     `strict`, so I do too.
  6. Brad's later CSRF chapter shows the old fix: a CSRF token in every form (the
     `csurf` package). That's history; `sameSite` gives the same protection now.
- **What I learned:** cookies are sent automatically, which is what makes sessions work
  and also what CSRF abuses. `sameSite: 'strict'` makes the browser keep my session
  cookie away from requests that other sites start.

## Lesson 65 – passing data to an EJS template: `res.render` and `<%= %>`

- **Date:** 2026-10-30
- **Where:** my app (`controllers/userController.js`, `views/home-dashboard.ejs`),
  `ejs@3.1.10`
- **What happened:** Brad replaced the placeholder name in the dashboard's `<h2>` with
  `<%= username %>`, and now the page says "Hello cat" for each logged-in user. He said
  `<% %>` runs JavaScript and the `=` prints something. I wanted to understand the tags,
  and where `username` comes from, since the template never reads `req.session`.
- **Cause:** EJS is a _template engine_: an HTML file with holes in it. The controller
  fills the holes with the second argument of `res.render`:
  ```js
  res.render('home-dashboard', { username: req.session.user.username });
  ```
  Every property of that object becomes a variable in the template, so `username` exists
  there. Nothing else does: the template can't see `req`, `req.session` or my controller's
  variables unless I pass them. EJS turns the template into HTML on the server, and the
  browser only gets the finished HTML. The tags:
  - `<% %>`: runs JavaScript, prints nothing (for `if` and loops, later in the course)
  - `<%= %>`: prints the value, _escaped_: `<` becomes `&lt;` and `>` becomes `&gt;`.
    Claude tested it on my version: a username `<b>cat</b>` comes out as text,
    `&lt;b&gt;cat&lt;/b&gt;`, so the browser shows it instead of running it as HTML.
  - `<%- %>`: prints the value _raw_, as real HTML. Safe only for HTML I wrote or
    cleaned myself, never for text a user typed.
  - `<%# %>`: a comment; it isn't sent to the browser at all

  Inside the tags, any JavaScript expression works, not just a variable: my
  `home-guest.ejs` footer already has `<%= new Date().getFullYear() %>`. A misspelled or
  missing variable (`<%= usernme %>`, or `res.render` without the object) gives
  `ReferenceError: usernme is not defined`, and the page doesn't render at all.
- **What I do now:**
  1. Pass data as the second argument of `res.render` and use the same property name in
     the template.
  2. Print anything a user typed (username, post title, ...) with `<%= %>`.
  3. Use `<%- %>` only for HTML I trust.
  4. If I see "... is not defined", check the spelling in both files, and that the
     controller really passes that property.
- **What I learned:** `res.render(view, data)` hands the template only what's in `data`.
  `<%=` prints it safely escaped, `<%-` prints it as raw HTML, and `<%` just runs code.

## Lesson 66 – `req.session.destroy()` takes a callback, not `await`

- **Date:** 2026-10-30
- **Where:** my app (`controllers/userController.js`, the controller's `logout`),
  `express-session@1.19.0`
- **What happened:** my first version of the controller's `logout` was
  ```js
  req.session.destroy();
  res.redirect('/');
  ```
  Brad said to put the redirect inside a callback, because the session package doesn't
  return Promises "as of the time of this recording", so I wondered if it's still true, and
  if I could just write `await req.session.destroy()` instead.
- **Cause:** deleting the session in Atlas takes a moment. Without waiting, the redirect
  goes out at once, and the browser's `GET /` can arrive while the session still
  exists, so I'd see the dashboard right after signing out. The same goes for login
  and `req.session.save()`.

  Brad is still right: `1.19.0` is the newest version, and in its `session/session.js`
  both `destroy` and `save` end with `return this;`. They return the session object,
  not a Promise, and they take a function (a callback) that the store calls when it's
  done. `await` only waits for a Promise; given anything else, it carries on at once.
  So `await req.session.destroy()` gives no error, but it still redirects too early,
  the same bug, just harder to see.
- **What I do now:**
  1. Put the redirect inside the callback, so it runs only after the store is done:
     ```js
     req.session.destroy(function () {
       res.redirect('/');
     });
     ```
     The same for login: `req.session.save(function () { res.redirect('/'); });`.
  2. Before I `await` something, I check that it really returns a Promise (the docs,
     or the package's code in `node_modules`).
  3. If I ever want `await` here (e.g. when modernizing), I wrap the call in
     `new Promise(...)` myself, like the model's `login` does.
- **What I learned:** `await` doesn't make a function wait; it only waits for a Promise
  that the function returns. Libraries that use callbacks, like `express-session`,
  still need the callback.

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

## Git – working directory, staging area and last commit (`git diff` vs `git diff HEAD`)

- **Date:** 2026-10-28
- **Where:** my setup (git)
- **What happened:** I wanted to see everything I had changed since my last commit. I
  pictured the three areas as a line, working directory → staging area → commits, where
  my work _moves_ from left to right. So I didn't understand what `git diff` compares:
  the areas as they were before, or as they are now?
- **Cause:** I had two things wrong:
  - **git copies, it doesn't move.** `git add` copies my file into the staging area, and
    my file stays. `git commit` copies the staging area into a new commit, and the
    staging area stays full.
  - **each area always has a full copy of every file.** The staging area (also called
    the _index_) isn't a box of changes. It's the complete next commit. Right after a
    commit, all three areas are the same.

  So every `git diff` compares two areas as they are _right now_. Git doesn't remember
  older versions of my files or of the staging area. Only commits are history.
  - `git diff`: my files vs the staging area
  - `git diff --staged`: the staging area vs the last commit
  - `git diff HEAD`: my files vs the last commit (`HEAD` = the last commit)

  One file going through time (v1, v2, v3 are its versions):
  - I commit: all three areas have v1, so every diff is empty
  - I edit it (my file is v2): `git diff` and `git diff HEAD` both show v1 → v2
  - I `git add` it (staging is v2): `git diff` is now empty, because my file and the
    staging area are the same. `git diff --staged` and `git diff HEAD` show v1 → v2.
  - I edit again (v3), then `git commit`: the commit saves _v2_, not v3, because a commit
    copies the staging area, not my files
- **What I do now:**
  1. In my usual workflow I run `git add` and `git commit` right after each other, so
     nothing is staged in between. Then `git diff` and `git diff HEAD` show the same thing.
  2. If I `git add` and keep working, I use `git diff HEAD` to see everything since the
     last commit, and `git diff --staged` to see what the next commit will contain.
  3. I run `git add` again right before `git commit`, so my latest edits aren't left out.
  4. I also run `git status`, because no `git diff` shows untracked (brand-new) files.
- **What I learned:** the three areas are three full copies that exist at the same time,
  and `git diff` compares them as they are now. A commit saves the staging area, not the
  files on my disk.
