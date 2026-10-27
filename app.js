const express = require('express');
const app = express();

const router = require('./router');

// Middleware to parse incoming request bodies (form data and JSON)
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Serve static files from the "public" directory
app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use('/', router);

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
