var express = require('express');
var router = express.Router();

var checkLogin = require('../middlewares/check').checkLogin;

//GET /signup 登出
router.get('/', checkLogin, (req, res, next) => {
    //res.send(req.flash());
    //清空session中的用户信息
    req.session.user = null;
    req.flash('success', '登出成功');
    //等出成功后跳转到首页
    res.redirect('/posts');
});

module.exports = router;