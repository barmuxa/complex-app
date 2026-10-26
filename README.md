# Complex App

A social-network style web app built with **Node.js**, **Express**, **MongoDB** and **EJS**, following Brad Schiff's Udemy course _Learn JavaScript: Full-Stack from Scratch_ (App #2).

## Status

🚧 In progress — built lesson by lesson along with the course.

## Goals

The course builds an app where users can:

- register, log in and log out
- create, edit and delete posts (with Markdown)
- follow other users and see a feed of their posts
- search posts live and chat in real time

## Approach

1. **Follow the course exactly.** Code and package versions match Brad's lessons (Express 4, MongoDB driver 6, CommonJS `require`, nodemon, dotenv), so the videos and this code behave the same.
2. **Modernize later.** Once the app is finished, a separate pass will update it (ES modules, Express 5, MongoDB driver 7, `node --watch`, `--env-file`).

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

2. Start the server (restarts automatically when you save a file):

   ```bash
   npm run watch
   ```

3. Open http://localhost:3000

## Environment variables

Secrets live in a `.env` file, which is listed in `.gitignore` and never committed.

| Variable           | Description                                                         |
| ------------------ | ------------------------------------------------------------------- |
| `CONNECTIONSTRING` | MongoDB Atlas connection string (added once the database is set up) |
| `PORT`             | Optional. Defaults to `3000`.                                       |
