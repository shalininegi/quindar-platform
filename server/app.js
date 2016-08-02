// *** main dependencies *** //
var express = require('express');
var path = require('path');
//var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');
var mongoose = require('mongoose');
var systemSettings = require('../config/systemSettings');
var syslogger			= require('morgan');
var logger				= require('winston');
var helper = require('./scripts/helper');
var fs		 			= require('fs');

// *** scripts *** //
console.log('APP - in scripts');
//var scripts = require('./scripts/coreAdmin.js');
// Program: module01.js
// Purpose: main app
// Author: Shalini Negi
// Updated: July 12, 2016
// License: MIT license
//
// *** express instance *** //
var app = express();

app.set('port', 7902);

// *** config middleware *** //
app.use(syslogger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../client/public')));


// *** server config *** //
//var server = http.createServer(app);
app.listen(app.get('port'), function() {
  var host = 'platform.audacy.space';
  var port = app.get('port');
  console.log("Audacy Data Service Backend Listening at http://%s:%s", host, port);
});

require('./scripts/coreAdmin')(app, bodyParser, mongoose, fs, syslogger, logger, helper);
require('./scripts/analytics')(app, bodyParser, fs, syslogger, logger, helper);
require('./scripts/verifyMe')(app);

console.log(app.get('port'));
module.exports = app;
