var path = require('path');
var express = require('express');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var flash = require('connect-flash');   //信息提示
//var config = require('config-lite'); 
var config = require('./config/default');   //原网站代码 require('config-lite')，暂有问题
var routes = require('./routes'); //源代码改为 require('./routes/index') 也可以
var pkg = require('./package');
var winston = require('winston');   //日志相关
var expressWinston = require('express-winston');    //日志相关

var app = express();

//设置模板目录
app.set('views', path.join(__dirname, 'views'));

//设置模板引擎
app.set('view engine', 'ejs');

//设置静态文件目录
app.use(express.static(path.join(__dirname, 'public')));

//session中间件
app.use(session({
    name: config.session.key,   //设置 cookie 中保存 session id 的字段名称
    secret: config.session.secret,  //通过设置 secret 来计算 hash 值并放在 cookie 中，使产生的 signedCookie 防篡改
    cookie: {
        maxAge: config.session.maxAge   // 过期时间，过期后 cookie 中的 session id 自动删除
    },
    store: new MongoStore({ // 将 session 存储到 mongodb
        url: config.mongodb //mongodb地址
    })
}));

//flash中间件，用来显示通知
app.use(flash());

//处理表单及文件上传的中间件
app.use(require('express-formidable')({
    uploadDir: path.join(__dirname, './public/img'),  //上传文件目录
    keepExtensions: true   //保留后缀
}));

//设置模板全局变量
app.locals.blog = {
    title: pkg.name,
    discription: pkg.discription
};

app.use((req, res, next) => {
    res.locals.user = req.session.user;
    res.locals.success = req.flash('success').toString();
    res.locals.error = req.flash('error').toString();
    next();
});

// 正常请求的日志
app.use(expressWinston.logger({
    transports: [
        new (winston.transports.Console)({
            json: true,
            colorize: true
        }),
        new winston.transports.File({
            filename: 'logs/success.log'
        })
    ]
}));

// 路由
routes(app);

// 错误请求的日志
app.use(expressWinston.errorLogger({
    transports: [
        new winston.transports.Console({
            json: true,
            colorize: true
        }),
        new winston.transports.File({
            filename: 'logs/error.log'
        })
    ]
}));

// error page
app.use(function (err, req, res, next) {
  res.render('error', {
    error: err
  });
});

//监听端口，启动程序
app.listen(config.port, () => {
    console.log(`${pkg.name} listening on port ${config.port}`);
});

//注意：中间件的加载顺序很重要。如上面设置静态文件目录的中间件应该放到 routes(app) 之前加载，这样静态文件的请求就不会落到业务逻辑的路由里；flash 中间件应该放到 session 中间件之后加载，因为 flash 是基于 session 的。