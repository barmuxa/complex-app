const express = require('express');
const app = express();

app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('home-guest');
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
