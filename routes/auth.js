var express = require('express');
var router = express.Router();
var firebaseAuth = require('../connections/firebase_client').auth();

router.get('/signup', function (req, res, next) {
  res.render('auth/signup', {messages: req.flash('error')});
});

router.get('/signin', function (req, res, next) {
  res.render('auth/signin', {messages: req.flash('error')});
});

router.post('/signout', function (req, res, next) {
  req.session.uid = '';
  req.session.email = '';
  res.redirect('/auth/signin');
});


router.post('/signup', function (req, res, next) {
  var email = req.body.email;
  var password = req.body.password;
  var confirmPassword = req.body.confirm_password;
  if (password !== confirmPassword) {
    req.flash('error', '密碼與確認密碼不相符');
    return res.redirect('/auth/signup');
  }
  firebaseAuth.createUserWithEmailAndPassword(email, confirmPassword)
    .then(function (user) {
      res.redirect('/auth/signin');
    })
    .catch(function (error) {
      var errorMessage = error.message;
      req.flash('error', errorMessage);
      res.redirect('/auth/signup');
    });
});

router.post('/signin', function (req, res, next) {
  var email = req.body.email;
  var password = req.body.password;
  firebaseAuth.signInWithEmailAndPassword(email, password)
    .then(function (user) {
      req.session.uid = user.uid;
      req.session.email = email;
      res.redirect('/dashboard')
    })
    .catch(function (error) {
      var errorMessage = error.message;
      req.flash('error', errorMessage);
      res.redirect('/auth/signin');
    })
});

module.exports = router;