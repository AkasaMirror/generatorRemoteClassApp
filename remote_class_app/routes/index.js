const express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index.ejs', { 
    title: 'Express Top Page' ,
    link_teacher: {
      href : "/meeting/join_Teacher",
      text : "Meeting for Teacher"
    },
    link_meeting: {
      href : "/meeting/join",
      text : "Meeting for Student"
    }
  });
});

router.post('/', (req, res, next) => {
  console.log("/ test");

  // データをクライアント（静的プログラム）に送信
  res.end();
});

module.exports = router;