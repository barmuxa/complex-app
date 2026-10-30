const express = require('express');
const session = require('express-session');
const app = express();

// Session middleware
const sessionOptions = session({
  secret: process.env.SESSIONSECRET, // secret used to sign the session ID cookie (in .env, so it's not on GitHub)
  resave: false, // don't save session if unmodified
  saveUninitialized: false, // don't create session until something stored
  cookie: { maxAge: 1000 * 60 * 60 * 24, httpOnly: true, sameSite: 'strict' }, // 1 day and HTTP only meaning the cookie cannot be accessed via client-side JavaScript
});

app.use(sessionOptions);

const router = require('./router');

// Middleware to parse incoming request bodies (form data and JSON)
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Serve static files from the "public" directory
app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use('/', router);

module.exports = app;
