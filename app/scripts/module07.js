// Program: module07.js
// Purpose: webSocket server for data streaming, including from GMAT
// Author:  Ray Lai
// Updated: May 31, 2016
// License: MIT license
// 
// Change History: 
//  5/24/2016 Masaki - add GMAT data types
//
module.exports = function(app, secureSocketServer, secureSocketPort, io, syslogger, logger, helper) {
  var io = require('socket.io')(secureSocketServer);
  secureSocketServer.listen(secureSocketPort);
  console.log('socket.io webSocket server with port ' + secureSocketPort);

  var randomstring = require('randomstring');


  io.on('connection', function(socket) {
    console.log("socket.io Server connected.")

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