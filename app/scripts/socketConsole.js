// Program: socketConsole.js
// Purpose: display generated data on browser client when received
// Author:  Ray Lai
// Updated: Jun 6, 2016
// License: MIT license
//
var socket = io('ws://platform.audacy.space:7904');

socket.on('connection', function() {
  //console.log("...connected");
  //alert("connected");
});

socket.on('error', console.error.bind(console));

socket.on('attitude', function(telemetryData) {  
  console.log("Data: " + JSON.stringify(telemetryData));
});

socket.on('position', function(telemetryData) {  
  console.log("Data: " + JSON.stringify(telemetryData));
});

socket.on('vehicle', function(telemetryData) {  
  console.log("Data: " + JSON.stringify(telemetryData));
});

socket.on('orbit', function(telemetryData) {  
  console.log("Data: " + JSON.stringify(telemetryData));
});