var express = require('express');
var router = express.Router();
const stringtags = require('striptags');
const moment = require('moment');
const convertPagination = require('../modules/convertPagination');
var firebaseAdminDb = require('../connections/firebase_admin');

const categoriesRef = firebaseAdminDb.ref('/categories/');
const articlesRef = firebaseAdminDb.ref('/articles/');

// const ref = firebaseAdminDb.ref('any');
// ref.once('value', function (snapshot) {
//   console.log(snapshot.val());
// });

/* GET home page. */
router.get('/', function (req, res, next) {
  let currentPage = Number.parseInt(req.query.page || 1);
  let categories = [];
  categoriesRef.once('value').then(function (snapshot) {
    categories = snapshot.val();
    return articlesRef.orderByChild('update_time').once('value');
  })
    .then(function (snapshot) {
      const articles = [];
      snapshot.forEach(function (snapshotChild) {
        if ('public' === snapshotChild.val().status) {
          articles.push(snapshotChild.val());
        }
      });
      articles.reverse();
      const {page, data} = convertPagination(articles, currentPage);

      // 分頁結束
      res.render('index', {
        categories,
        articles: data,
        page,
        stringtags,
        moment
      });
    });
});

router.get('/post/:id', function (req, res, next) {
  const id = req.param('id');
  let categories = [];
  categoriesRef.once('value').then(function (snapshot) {
    categories = snapshot.val();
    return articlesRef.child(id).once('value');
  })
    .then(function (snapshot) {
      const article = snapshot.val();
      if (!article) {
        return res.render('error', {title: '找不到該文章'})
      }
      res.render('post', {
        categories,
        article,
        stringtags,
        moment
      });
    });
});

module.exports = router;
