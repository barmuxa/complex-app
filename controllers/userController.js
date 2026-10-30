const User = require('../models/User');

exports.login = function (req, res) {
  let user = new User(req.body);
  user
    .login()
    .then(result => {
      req.session.user = { hobby: 'coding', username: user.data.username };
      res.send(result);
    })
    .catch(err => res.send(err));
};

exports.logout = function (req, res) {};

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
    console.log(req.session);
    res.send('Welcome to the actual application.');
  } else {
    res.render('home-guest');
  }
};
