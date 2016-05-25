// Program:  server.js
// Purpose:  Quindar-platform NodeJS server startup scripts
// Author:   Ray Lai
// Updated:  May 25, 2016
// License:  MIT license
//
'use strict';
var express 			= require('express');
var app      			= express();
var port     			= process.env.PORT || 3000;
var securePort 			= process.env.SECUREPORT || 3001;
var mongoose 			= require('mongoose');
var flash    			= require('connect-flash');
//var passport 			= require('passport');
//var Strategy 			= require('passport-local').Strategy;
var syslogger			= require('morgan');
var logger				= require('winston');
var FileStreamRotator 	= require('file-stream-rotator');
var cookieParser 		= require('cookie-parser');
var bodyParser   		= require('body-parser');
var session      		= require('express-session');
var jwt    	 			= require('jsonwebtoken');
var fs		 			= require('fs');
var https    			= require('https');
var http     			= require('http');
var helper   			= require('./app/scripts/module05.js');

// read SSL cert (self-signed cert for testing)
var quindarKey = fs.readFileSync('./keys/quindar-key.pem');
var quindarCert = fs.readFileSync('./keys/quindar-cert.pem');
var sslOptions = {
  key: quindarKey,
  cert: quindarCert
};

// logging
//app.use(syslogger('dev')); // log every request to the console
var logDirectory = __dirname + '/log'
var accessLogStream = FileStreamRotator.getStream({
  date_format: 'YYYYMMDD',
  filename: logDirectory + '/access-%DATE%.log',
  frequency: 'daily',
  verbose: false
})
app.use(syslogger('combined', {stream: accessLogStream}))

app.use(cookieParser()); // read cookies (needed for auth)

// # system env config
// - allow NodeJS to handle unlimited # of events
require('events').EventEmitter.prototype._maxListeners = 0;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(flash()); // use connect-flash for flash messages stored in session

//var User   = require('./app/models/user');
//require('./config/passport')(passport); // pass passport for configuration
//app.set('superSecret', configDB.secret);

//app.engine('html', cons.swig)
app.set('views', __dirname + '/app/views');
app.set('view engine', 'html');
//app.set('view engine', 'ejs'); // set up ejs for templating

// required for passport, include XSS prevention
app.use(session({ 
	secret: 'race2space',
	resave: true,
	saveUninitialized: true,
	cookie: {
    	httpOnly: true,
    	secure: true
  	}
})); // session secret

//app.use(passport.initialize());
//app.use(passport.session()); // persistent login sessions
//require('./app/myauth.js')(app, passport, User, jwt, Strategy);

app.use(express.static(__dirname + '/'));

require('./app/scripts/module01.js')(app);
require('./app/scripts/module02.js')(app, mongoose, syslogger, logger);
require('./app/scripts/module03.js')(app, bodyParser, mongoose, fs, syslogger, logger, helper);
require('./app/scripts/module04.js')(app, bodyParser, fs, syslogger, logger, helper);

var server = http.createServer(app);
server.listen(port, function() {
	console.log('Express Web server listening on port ' + port);
});

var secureServer = https.createServer(sslOptions, app);
secureServer.listen(securePort, function() {
	console.log('Express Web server listening on port ' + securePort + ' over HTTPS');
});	
