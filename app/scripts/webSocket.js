// Program: module06.js
// Purpose: webSocket server for data streaming, including from GMAT
// Author:  Ray Lai
// Updated: May 31, 2016
// License: MIT license
// 
// Change History: 
//  5/24/2016 Masaki - add GMAT data types
//
module.exports = function(app, socketPort, syslogger, logger, helper) {

  //var socketServer = require('http').createServer(app);
  var socketServer = require('http').createServer(app);
  var io = require('socket.io').listen(app.listen(socketPort, function() {
     console.log('socket.io Server listening at socket port %d ', socketPort);
     console.log("/webSocket.js webSocket server non-SSL loaded.");
  }));

  io.sockets.emit('connection');

  io.on('connection', function(socket) {
    console.log("socket.io Server connected.")
    socket.emit('connection', 'Quindar connected');

    // broadcast telemetry data from sender
    socket.on('position', function(data) {
      socket.broadcast.emit('position', data);
    });

    socket.on('attitude', function(data) {
      socket.broadcast.emit('attitude', data);
    });

    socket.on('vehicle', function(data) {
      socket.broadcast.emit('vehicle', data);
    });

    socket.on('orbit', function(data) {
      socket.broadcast.emit('orbit', data);
    });
  });
    
  io.on('close', function(socket) {
    console.log("socket.io Server connection closed.");
  });

// end of module
};