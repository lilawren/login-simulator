var express = require('express');
var app = express();

var routes = require('./routes/router');
app.use('/', routes);

// serve static files from /client
app.use(express.static(__dirname + '/client'));

app.listen(8000, function () {
  console.log('Express app listening on port 8000');
});