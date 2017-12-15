var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

require('dotenv').load();

var env = process.env.NODE_ENV || 'dev';
console.log('node env:' + process.env.NODE_ENV);
var inDev = env == 'dev';

//connect to MongoDB
const mLabUri = 'mongodb://' + process.env.dbUsername + ':' + process.env.dbPassword + '@ds141786.mlab.com:41786/loginsimulator';
const localDbUri = 'mongodb://localhost/authDb';
mongoose.connect(inDev ? localDbUri : mLabUri);
var db = mongoose.connection;

//handle mongo error
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log('DB CONNECTED');
});

// set templating engine
app.set('view engine', 'ejs')

// //use sessions for tracking logins
app.use(session({
    secret: 'magical koolaid here',
    resave: true,
    saveUninitialized: false,
    store: new MongoStore({
        mongooseConnection: db
    })
}));

// parse incoming requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var routes = require('./routes/router');
app.use('/', routes);

// serve static files from /views
app.use(express.static(__dirname + '/views'));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('File Not Found');
    err.status = 404;
    next(err);
});

// error handler
// define as the last app.use callback
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.send(err.message);
});


let port = inDev ? 8000 : process.env.PORT;
app.listen(port, function () {
    console.log('Express app listening on port ' + port + ' dev:' + inDev);
});