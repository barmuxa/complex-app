# Complex App

A social-network style web app built with **Node.js**, **Express**, **MongoDB** and **EJS**, following Brad Schiff's Udemy course _Learn JavaScript: Full-Stack from Scratch_ (App #2).

## Status

🚧 In progress — built lesson by lesson along with the course. So far (up to lesson 62 of 139): registration with validation, users saved in MongoDB Atlas with passwords hashed by `bcryptjs`, and login. Sessions (staying logged in) come in the next lessons.

## Goals

The course builds an app where users can:

- register, log in and log out
- create, edit and delete posts (with Markdown)
- follow other users and see a feed of their posts
- search posts live and chat in real time

## Approach

1. **Follow the course exactly.** Code and package versions match Brad's lessons (Express 4, MongoDB driver 6, CommonJS `require`, nodemon, dotenv), so the videos and this code behave the same.
2. **Modernize later.** Once the app is finished, a separate pass will update it. See [Modernization plan](#modernization-plan).

## Modernization plan

After the course, the same app rewritten the modern way, without changing what it does:

1. **Tag the course version** (`git tag brad-version`) and do the rewrite on a branch, so Brad's version stays easy to find.
2. **ES modules**: `import`/`export` instead of `require`.
3. **Newer packages and Node features**: Express 5, MongoDB driver 7, `node --watch` instead of nodemon, `--env-file` instead of dotenv.
4. **Classes** instead of constructor functions with `prototype`, and `async`/`await` everywhere, e.g. `await bcrypt.hash()` instead of `hashSync`, which blocks the server while it hashes.
5. **TypeScript**: `.ts` files with types, so the editor catches mistakes like `user.usrname` while I type. Node 24 can run `.ts` files directly, so no build step at first. It comes after the other changes because it touches every file.
6. **Zod** for clean-up and validation: one schema replaces most of `cleanUp` and `validate`, and `z.infer` turns the same schema into a TypeScript type.

## Running it locally

1. Install dependencies:

   ```bash
   npm install
   ```

   The first `npm install` picks the newest versions allowed by the `^` ranges in `package.json` and records exactly which ones it chose in `package-lock.json`. Commit `package.json` and `package-lock.json` together. Run `npm install` again only when you add or update a package (`npm install <package>`), which updates both files.

   **Reinstalling later:** once `package-lock.json` exists, use `npm ci` instead:

   ```bash
   npm ci
   ```

   `npm ci` deletes `node_modules` and installs exactly the versions listed in `package-lock.json`. It never changes that file, and it stops with an error if `package.json` and `package-lock.json` disagree. So every reinstall gets the same versions: after cloning, when `node_modules` acts strangely, or on Render.

2. Create a `.env` file in the project folder (see [Environment variables](#environment-variables) below).

3. Start the server (restarts automatically when you save a `.js` file):

   ```bash
   npm run watch
   ```

   Or without auto-restart: `npm start`. Both start `db.js`, which connects to MongoDB first and only then starts the Express app from `app.js`. nodemon doesn't watch `.env`, so after changing it, type `rs` and press Enter in the terminal to restart.

4. Open http://localhost:3000

## Environment variables

Secrets and settings live in a `.env` file, which is listed in `.gitignore` and never committed. `db.js` loads it with `dotenv`. Both variables are required:

```
CONNECTIONSTRING=mongodb+srv://<user>:<password>@<cluster>/ComplexApp?retryWrites=true&w=majority
PORT=3000
```

| Variable           | Description                                                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CONNECTIONSTRING` | MongoDB Atlas connection string. The part after `.net/` (`ComplexApp`) is the database the app uses.                                              |
| `PORT`             | The port the server listens on. There is no default: without it, the app starts on a random port without any error, and `localhost:3000` won't load. |

No quotes, and no spaces around `=`. On a host like Render, set the same names in its dashboard instead of uploading `.env`.
