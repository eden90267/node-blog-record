const express = require('express');
const router = express.Router();
const stringtags = require('striptags');
const moment = require('moment');
const firebaseAdminDb = require('../connections/firebase_admin');

const categoriesRef = firebaseAdminDb.ref('/categories/');
const articlesRef = firebaseAdminDb.ref('/articles/');

router.get('/', function (req, res, next) {
  res.render('dashboard/index', {email: req.session.email});
})

router.get('/article/create', function(req, res, next) {
  categoriesRef.once('value').then(function (snapshot) {
    const categories = snapshot.val();
    res.render('dashboard/article', {
      categories
    });
  })
});

router.get('/article/:id', function(req, res, next) {
  const id = req.param('id');
  let categories = [];
  categoriesRef.once('value').then(function (snapshot) {
    categories = snapshot.val();
    return articlesRef.child(id).once('value');
  })
    .then(function (snapshot) {
      const article = snapshot.val();
      res.render('dashboard/article', {
        categories,
        article
      });
    });
});

router.post('/article/create', function (req, res) {
  const data = req.body;
  const articleRef = articlesRef.push();
  const key = articleRef.key;
  const updateTime = Math.floor(Date.now() / 1000);
  data.id = key;
  data.update_time = updateTime;
  articleRef.set(data).then(function () {
    res.redirect(`/dashboard/article/${key}`);
  });
});

router.post('/article/update/:id', function (req, res) {
  const data = req.body;
  const id = req.param('id');
  res.redirect(`/dashboard/article/${id}`)
  articlesRef.child(id).update(data).then(function () {
    res.redirect(`/dashboard/article/${id}`);
  });
});

router.post('/article/delete/:id', function (req, res, next) {
  const id = req.param('id');
  articlesRef.child(id).remove();
  req.flash('info', '欄位已刪除');
  res.send('文章已刪除');
  res.end();
  // res.redirect('/dashboard/categories');
});




router.get('/archives', function(req, res, next) {
  const status = req.query.status || 'public';
  let categories = [];
  categoriesRef.once('value').then(function (snapshot) {
    categories = snapshot.val();
    return articlesRef.orderByChild('update_time').once('value');
  })
    .then(function (snapshot) {
      const articles = [];
      snapshot.forEach(function (snapshotChild) {
        if (status === snapshotChild.val().status) {
          articles.push(snapshotChild.val());
        }
      });
      articles.reverse();
      res.render('dashboard/archives', {
        categories,
        articles,
        stringtags,
        moment,
        status
      })
    });
});





router.get('/categories', function(req, res, next) {
  const messages = req.flash('info');
  categoriesRef.once('value').then(function (snapshot) {
    const categories = snapshot.val();
    res.render('dashboard/categories', {
      categories,
      messages,
      hasInfo: messages.length > 0
    });
  });

});

router.post('/categories/create', function (req, res, next) {
  const data = req.body;
  const categoryRef = categoriesRef.push(); // 取得單一個的路徑，裡面的子項目
  const key = categoryRef.key;
  data.id = key;
  categoriesRef.orderByChild('path').equalTo(data.path).once('value').then(function (snapshot) {
    if (snapshot.val() !== null) {
      req.flash('info', '已有相同路徑');
      res.redirect('/dashboard//categories');
    } else {
      categoryRef.set(data).then(function () {
        res.redirect('/dashboard//categories');
      });
    }
  });
});
// form 只支援 POST 方法
router.post('/categories/delete/:id', function (req, res, next) {
  const id = req.param('id');
  categoriesRef.child(id).remove();
  req.flash('info', '欄位已刪除');
  res.redirect('/dashboard/categories');
});


module.exports = router;