const User = require('../models/User');

exports.login = function (req, res) {
  let user = new User(req.body);
  user
    .login()
    .then(result => {
      req.session.user = { hobby: 'coding', username: user.data.username }; // saving user info in session
      req.session.save(function () {
        // ensure session is saved before redirecting
        res.redirect('/');
      });
    })
    .catch(err => {
      req.flash('errors', err); // saving error message in session flash object
      req.session.save(function () {
        // ensure session is saved before redirecting
        res.redirect('/');
      });
    });
};

exports.logout = function (req, res) {
  req.session.destroy(function () {
    res.redirect('/');
  });
};

exports.register = function (req, res) {
  let user = new User(req.body);
  user.register();
  if (user.errors.length) {
    res.send(user.errors);
  } else {
    res.send('Congrats, there are no errors');
  }
};

exports.home = function (req, res) {
  if (req.session.user) {
    res.render('home-dashboard', { username: req.session.user.username });
  } else {
    res.render('home-guest', { errors: req.flash('errors') });
  }
};
