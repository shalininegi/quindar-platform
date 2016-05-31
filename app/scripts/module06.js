// Program: module06.js
// Purpose: webSocket server for data streaming, including from GMAT
// Author:  Ray Lai
// Updated: May 26, 2016
// License: MIT license
// 
// Change History: 
//  5/24/2016 Masaki - add GMAT data types
//
module.exports = function(app, socketServer, socketPort, io, syslogger, logger, helper) {
  var io = require('socket.io')(socketServer);
  socketServer.listen(socketPort);
  console.log('socket.io webSocket server with port ' + socketPort);

  var randomstring = require('randomstring');
  var satData1;
  var satData2;
  var satData3;

  io.on('connection', function(socket) {
    console.log("socket.io Server connected.")

    socket.on('satData1', function(data) {
		  satData1 = data;     		
    });

	  socket.on('satData2', function(data) {
		  satData2 = data;     		
	  });

	  socket.on('satData3', function(data) {
		  satData3 = data;     		
	  });

	  socket.on('attiData1', function(data) {
		  attiData1 = data;     		
	  });

	  socket.on('attiData2', function(data) {
		  attiData2 = data;     		
	  });

    socket.on('attiData3', function(data) {
		  attiData3 = data;     		
    });	

    socket.on('telemetry', function (data) {
      socket.join(data.room)	/** enable room **/
    
    	if (data.type == 'orbit') {
		    telemetryData = {"type":"orbit","data": JSON.stringify(getOrbitData(Math.random() * 0.2, Math.random() * 0.3, 200))};
        socket.broadcast.emit('orbit', telemetryData);
    	} else if (data.type == 'attitude') {
        telemetryData1 = {"type": "attitude", "room": "Audacy1", "data": attiData1};
        telemetryData2 = {"type": "attitude", "room": "Audacy2", "data": attiData2};
        telemetryData3 = {"type": "attitude", "room": "Audacy3", "data": attiData3};		   
		   
        // GMAT specific data types
        if (data.room == 'Audacy1') {
				  io.sockets.in(data.room).emit('attitude', telemetryData1);
				  //console.log(telemetryData1)
		    } else if (data.room == 'Audacy2') {
				  io.sockets.in(data.room).emit('attitude', telemetryData2);
				  //console.log(telemetryData2)
		    } else if (data.room == 'Audacy3') {
				  io.sockets.in(data.room).emit('attitude', telemetryData3);
				  //console.log(telemetryData3)
        };  
      } else if (data.type == 'position') {
        //console.log(satData)
        telemetryData1 = {"type": "position", "room": "Audacy1", "data": satData1};
        telemetryData2 = {"type": "position", "room": "Audacy2", "data": satData2};
        telemetryData3 = {"type": "position", "room": "Audacy3", "data": satData3};

        // GMAT specific data types
        if (data.room == 'Audacy1') {
				  io.sockets.in(data.room).emit('position', telemetryData1);
				  //console.log(telemetryData1)
        } else if (data.room == 'Audacy2') {
				  io.sockets.in(data.room).emit('position', telemetryData2);
				  //console.log(telemetryData2)
        } else if (data.room == 'Audacy3') {
				  io.sockets.in(data.room).emit('position', telemetryData3);
				  //console.log(telemetryData3)
        }
    	} else if (data.type == 'vehicle') {
        telemetryData = {"type": "vehicle", "data": JSON.stringify(getVehiclesData(500.9999, -500.9999))};
        socket.broadcast.emit('vehicle', telemetryData);
    	};
    });
});


io.on('close', function(socket) {
   console.log("socket.io Server connection closed.");
});

function sendOrbitData() {
    var vehicleId = getVehicleId();
    var orbitData = getOrbit(Math.random() * 0.2, Math.random() * 0.3, 5);
    var timestamp = Math.floor(new Date() / 1000);
    var nData = {"type":"orbit","vehicleId": vehicleId, "data": JSON.stringify(orbitData),
      "timestamp": timestamp };
	 //  io.emit('telemetry', {"type":"orbit","vehicleId": vehicleId, "data": JSON.stringify(orbitData),
   //    "timestamp": timestamp });
     io.emit('telemetry', nData);
};

function getOrbitData(initX, initY, nTimes) {
    var vehicleId = getVehicleId();
    var orbitData = getOrbit(initX, initY, nTimes);
    var timestamp = Math.floor(new Date() / 1000);
    var nData = {"type":"orbit","vehicleId": vehicleId, "data": JSON.stringify(orbitData),
      "timestamp": timestamp };
   return nData;
     
};

function getOrbit(initX, initY, nTimes) {
     var nData = [];
     var x = initX, y = initY; 
     var topic = "audacy.orbit";

     for (var i=0; i < nTimes; i++) {
          x = x + 7 * Math.random() * 0.3 ;
          y = 45 * Math.sin(2 * x / 180 * Math.PI);
          nData.push([x, y]);
        }
     return nData;
}

// test data generator - attitude
function getAttitudeData(high, low) {
   var testData= {};

   var q1 =  Math.random() * (high - low) + low;
   var q2 =  Math.random() * (high - low) + low;
   var q3 =  Math.random() * (high - low) + low;
   var q4 =  Math.random() * (high - low) + low;
   var timestamp = Math.floor(new Date() / 1000);

   var vehicleId = getVehicleId();

   testData = { "vehicleId": vehicleId, "q1": Number(q1.toFixed(6)), "q2": Number(q2.toFixed(6)),
	"q3": Number(q3.toFixed(6)), "q4": Number(q4.toFixed(6)), "timestamp": timestamp};
   return testData;
};

// test data generator - position
function getPositionData(high, low, velocityHigh, velocityLow) {
   var testData = {};

   var x = Math.random() * (high - low) + low;
   var y = Math.random() * (high - low) + low;
   var z = Math.random() * (high - low) + low;
   var vx = Math.random() * (velocityHigh - velocityLow) + velocityLow;
   var vy = Math.random() * (velocityHigh - velocityLow) + velocityLow;
   var vz = Math.random() * (velocityHigh - velocityLow) + velocityLow;
   var timestamp = Math.floor(new Date() / 1000);
//   var vehicleId = "ISS-" + randomstring.generate({ length: 4,
//        charset: 'alphabetic'});

   var vehicleId = getVehicleId();

   testData = { "vehicleId": vehicleId, "x": Number(x.toFixed(4)), "y": Number(y.toFixed(4)), "z": Number(z.toFixed(4)),
      "vx": Number(vx.toFixed(6)), "vy": Number(vy.toFixed(6)), "vz": Number(vz.toFixed(6)),
      "timestamp": timestamp };
   return testData;
};

// test data generator - vehicles
function getVehiclesData(high, low) {
   var testData = {};
   //var vehicleId = "ISS-" + randomstring.generate({ length: 4,
   //     charset: 'alphabetic'});

   var vehicleId = getVehicleId();
   var calibrationHigh = 0.99999;
   var calibrationLow = -0.99999;

   var value = Math.random() * (high - low) + low;
   var alertHigh = (Math.random() * (high - low) + low) * 1.12;
   var alertLow = (Math.random() * (high - low) + low) * 0.85;
   var warnHigh = (Math.random() * (high - low) + low) * 1.09;
   var warnLow = (Math.random() * (high - low) + low) * 0.92;
   var uom = "Kevin";
   var calibrationFactor = (Math.random() * (calibrationHigh - calibrationLow) + calibrationLow).toString();
   var deviceId = "Battery-" + randomstring.generate({ length: 3,
        charset: 'alphabetic'});
   var timestamp = Math.floor(new Date() / 1000);

   testData = { "vehicleId": vehicleId, "value": value, "uom": uom, "alertHigh": alertHigh, "alertLow": alertLow,
	"warnHigh": warnHigh, "warnLow": warnLow, "calibrationFactor": calibrationFactor, 
  "deviceId": deviceId,
	"timestamp": timestamp };
   return testData;
}

// get vehicleId
function getVehicleId() {
   var vehicles = ["IBEX", "CST-100 Starliner", "Orion MPCV", "Dream Chaser CRS-2", "ISRO OV",
   "Skylon D1", "XCOR Lynx", "SIRIUS-1", "ISS (ZARYA)"];
   var x = Math.round((Math.random() * vehicles.length) - 1);
//   console.log("x=" + x + "  vehicle=" + vehicles[x]);
//   return vehicles[x];
   return "IBEX";
}

//setInterval(sendOrbitData, 5000);

// end of module
};