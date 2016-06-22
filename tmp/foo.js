// Program: foo.js
// Purpose: timer to push data changes to widgets (browser clients)
// Author:  Ray Lai
// Updated: mau 31, 2016
//

var express = require('express');
var app = express();
app.use(express.static(__dirname + '/'));
var port = process.env.PORT || 3003;

var server = require('http').createServer(app);
var io = require('socket.io')(server);

// Socket.io server listens to our app
var io = require('socket.io').listen(app.listen(port, function() {
  console.log('Server listening at port %d ', port);
}));

io.on('connection', function(socket) {
    socket.emit('connection', 'hi');
    console.log("socket.io Server connected.")
});

io.on('close', function(socket) {
   console.log("socket.io Server connection closed.");
});
