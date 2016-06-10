// Program: adminConsoleDirectives.js
// Purpose: AngularJS router for quindar dashboard
// Author:  Ray Lai
// Updated: Jun 6, 2016
// License: MIT license

// AngularJS module definition
'use strict';
app.factory('adminFactory', ['$http', '$q', function($http, $q) {
  var admFactory = {};

  // ------ Category:  random data generation ----------

  // return a valid satellite vehicle identifier
  // remark: this function returns static, pre-defined satellite vehicles for testing purpose.
  //         we will change to a dynamic lookup function when we need to add/change vehicle ids dynamically
  admFactory.getVehicleId = function() {
    var vehicles = ["IBEX", "CST-100 Starliner", "Orion MPCV", "Dream Chaser CRS-2", "ISRO OV",
      "Skylon D1", "XCOR Lynx", "SIRIUS-1", "ISS (ZARYA)"];
    var x = Math.round((Math.random() * vehicles.length) - 1);
    return vehicles[x];
  };

  // return a set of random generated attitude quaterion data points (q1, q2, q3, q4)
  admFactory.generateAttitude = function() {
    const high = 0.999999;
    const low = -0.000001;
    var testData= {};

    var q1 =  Math.random() * (high - low) + low;
    var q2 =  Math.random() * (high - low) + low;
    var q3 =  Math.random() * (high - low) + low;
    var q4 =  Math.random() * (high - low) + low;
    var timestamp = Math.floor(new Date() / 1000);

    var vehicleId1 = admFactory.getVehicleId();

    testData = { "vehicleId": vehicleId1, "q1": Number(q1.toFixed(6)), "q2": Number(q2.toFixed(6)),
      "q3": Number(q3.toFixed(6)), "q4": Number(q4.toFixed(6)), "timestamp": timestamp};
    return testData;
  };

  // return a set of random generated satellite positions (x, y, z, velocity vx, 
  //   velocity vy, velocity vz)
  admFactory.generatePosition = function() {
    const high = 400000.0;
    const low = -400000.0;
    const velocityLow = 20.0;
    const velocityHigh = -20.0;
    var testData = {};

    var x = Math.random() * (high - low) + low;
    var y = Math.random() * (high - low) + low;
    var z = Math.random() * (high - low) + low;
    var vx = Math.random() * (velocityHigh - velocityLow) + velocityLow;
    var vy = Math.random() * (velocityHigh - velocityLow) + velocityLow;
    var vz = Math.random() * (velocityHigh - velocityLow) + velocityLow;
    var timestamp = Math.floor(new Date() / 1000);
    var vehicleId2 = admFactory.getVehicleId();

    testData = { "vehicleId": vehicleId2, "x": Number(x.toFixed(4)), "y": Number(y.toFixed(4)), "z": Number(z.toFixed(4)), "vx": Number(vx.toFixed(6)), "vy": Number(vy.toFixed(6)), "vz": Number(vz.toFixed(6)),
      "timestamp": timestamp };
    return testData;
  };

  // return a set of randomi generated satellite vehicle sensor readings
  //    including sensor id, sensor value, alert high, alert low, warning high, warning low,
  //    and calibration formula 
  admFactory.generateVehicle = function() {
    const high = 500.9999;
    const low = -500.9999;
    var testData = {};
   
    var calibrationHigh = 0.99999;
    var calibrationLow = -0.99999;
    var vehicleId3 = admFactory.getVehicleId();

    var vehicleValue = Math.random() * (high - low) + low;
    var alertHigh = (Math.random() * (high - low) + low) * 1.12;
    var alertLow = (Math.random() * (high - low) + low) * 0.85;
    var warnHigh = (Math.random() * (high - low) + low) * 1.09;
    var warnLow = (Math.random() * (high - low) + low) * 0.92;
    var uom = "Kevin";
    var calibrationFactor = (Math.random() * (calibrationHigh - calibrationLow) + calibrationLow).toString();
    var deviceId = "Battery-" + Math.random().toString(36).substring(3);
    var timestamp = Math.floor(new Date() / 1000);

    testData = { "vehicleId": vehicleId3, "value": vehicleValue, "uom": uom, "alertHigh": alertHigh, "alertLow": alertLow, "warnHigh": warnHigh, "warnLow": warnLow, "calibrationFactor": calibrationFactor,
        "deviceId": deviceId, "timestamp": timestamp };
    return testData;
  };

  // return a set of random generated orbit trajectory. default shows 350 data points in an array
  // remark: this sine wave-like trajectory is for demo or testing only. normally,
  //   orbit trajectory is calculated based on sallite positions
  admFactory.generateOrbit = function() {
    const initX = Math.random() * 0.2;
    const initY = Math.random() * 0.3;
    const nTimes = 350;
    var vehicleId4 = admFactory.getVehicleId();
    var timestamp = Math.floor(new Date() / 1000);
    var testData = {};

    var nData = [];
    var x = initX, y = initY; 

    for (var i=0; i < nTimes; i++) {
      x = x + 7 * Math.random() * 0.3 ;
      y = 45 * Math.sin(2 * x / 180 * Math.PI);
      nData.push([x, y]);
    }
    testData = { "vehicleId": vehicleId4, "orbit": nData, "timestamp": timestamp };
    return testData;
  };

  // ------ Category: Message Queue ----------
  admFactory.writeToMQ = function() {
    return $http.post('http://platform.audacy.space:7902/services/v1/messaging/attitude/audacy.telemetry.attitude',
        { 
          "vehicleId": "IBEX",
          "q1": 2.4,
          "q2": 3.1,
          "q3": 1.7,
          "q4": 8.1
        }
    )
    .success(function(response) {
      // $scope.xxx = response.data;
      console.log("writeToMQ success: " + response.status + "  and response.data=" + response.data);
    })
    .catch(function(response) {
      console.error('writeToMQ System error: ', response.status, response.data);
    })
    .finally(function() {
      //console.log("finally finished writeToMQ()");
    });
  };

  // ------ Category: Database ----------
  // retrieve all attitude data
  admFactory.getAttitudeAll = function() {
    var serviceEndpoint = 'http://platform.audacy.space:7902/services/v1/attitude';
    return $http.get(serviceEndpoint)
    .success(function(response) {
      console.log("admFactory.getAttitudeAll() response.data=" + JSON.stringify(response));
    })
    .error(function(err) {
      console.error('Sorry, Quindar platform cannot serve admFactory.getAttitudeAll() immediately. Please retry later.');
    });
  };

  // retrieve attitude data by vehicleId, limited by nItems rows
  admFactory.getAttitudePartial = function(vehicleId, nItems) {
    var serviceEndpoint = 'http://platform.audacy.space:7902/services/v1/attitude/' + vehicleId
      + '/' + nItems;
    return $http.get(serviceEndpoint)
    .success(function(response) {
      console.log("admFactory.getAttitudePartial() response.data=" + JSON.stringify(response));
    })
    .error(function(err) {
      console.error('Sorry, Quindar platform cannot serve admFactory.getAttitudePartial() immediately. Please retry later.');
    });
  };

  // retrieve attitude data by vehicleId within a time period fromTS to toTS
  admFactory.getAttitudeFromTo = function(vehicleId, fromTS, toTS) {
    var serviceEndpoint = 'http://platform.audacy.space:7902/services/v1/attitude/' + vehicleId
      + '/' + fromTS + '/' + toTS;
    return $http.get(serviceEndpoint)
    .success(function(response) {
      console.log("admFactory.getAttitudePartial() response.data=" + JSON.stringify(response));
    })
    .error(function(err) {
      console.error('Sorry, Quindar platform cannot serve admFactory.getAttitudePartial() immediately. Please retry later.');
    });
  };

  // retrieve all position data
  admFactory.getPositionAll = function() {
    var serviceEndpoint = 'http://platform.audacy.space:7902/services/v1/position';
    return $http.get(serviceEndpoint)
    .success(function(response) {
      console.log("admFactory.getPositionAll() response.data=" + JSON.stringify(response));
    })
    .error(function(err) {
       console.error('Sorry, Quindar platform cannot serve admFactory.getPositionAll() immediately. Please retry later.');
    });
  };

  // retrieve position data by vehicleId, limited by nItems rows
  admFactory.getPositionPartial = function(vehicleId, nItems) {
    var serviceEndpoint = 'http://platform.audacy.space:7902/services/v1/position/' + vehicleId
      + '/' + nItems;
    return $http.get(serviceEndpoint)
    .success(function(response) {
      console.log("admFactory.getPositionPartial() response.data=" + JSON.stringify(response));
    })
    .error(function(err) {
       console.error('Sorry, Quindar platform cannot serve admFactory.getPositionPartial() immediately. Please retry later.');
    });
  };

  // retrieve position data by vehicleId within a time period fromTS to toTS
  admFactory.getPositionFromTo = function(vehicleId, fromTS, toTS) {
    var serviceEndpoint = 'http://platform.audacy.space:7902/services/v1/position/' + vehicleId
      + '/' + fromTS + '/' + toTS;
    return $http.get(serviceEndpoint)
    .success(function(response) {
      console.log("admFactory.getPositionFromTo() response.data=" + JSON.stringify(response));
    })
    .error(function(err) {
       console.error('Sorry, Quindar platform cannot serve admFactory.getPositionFromTo() immediately. Please retry later.');
    });
  };

  // retrieve all vehicle data
  admFactory.getVehicleAll = function() {
    var serviceEndpoint = 'http://platform.audacy.space:7902/services/v1/vehicle';
    return $http.get(serviceEndpoint)
    .success(function(response) {
      console.log("admFactory.getVehicleAll() response.data=" + JSON.stringify(response));
    })
    .error(function(err) {
       console.error('Sorry, Quindar platform cannot serve admFactory.getVehicleAll() immediately. Please retry later.');
    });
  };

  // retrieve vehicle data by vehicleId, limited by nItems rows
  admFactory.getVehiclePartial = function(vehicleId, nItems) {
    var serviceEndpoint = 'http://platform.audacy.space:7902/services/v1/vehicle/' + vehicleId
      + '/' + nItems;
    return $http.get(serviceEndpoint)
    .success(function(response) {
      console.log("admFactory.getVehiclePartial() response.data=" + JSON.stringify(response));
    })
    .error(function(err) {
       console.error('Sorry, Quindar platform cannot serve admFactory.getVehiclePartial() immediately. Please retry later.');
    });
  };

  // retrieve vehicle data by vehicleId within a time period fromTS to toTS
  admFactory.getVehicleFromTo = function(vehicleId, fromTS, toTS) {
    var serviceEndpoint = 'http://platform.audacy.space:7902/services/v1/vehicle/' + vehicleId
      + '/' + fromTS + '/' + toTS;
    return $http.get(serviceEndpoint)
    .success(function(response) {
      console.log("admFactory.getVehicleFromTo() response.data=" + JSON.stringify(response));
    })
    .error(function(err) {
       console.error('Sorry, Quindar platform cannot serve admFactory.getVehicleFromTo() immediately. Please retry later.');
    });
  };

  // retrieve all orbit trajectory data
  admFactory.getOrbitAll = function() {
    var serviceEndpoint = 'http://platform.audacy.space:7902/services/v1/orbit';
    return $http.get(serviceEndpoint)
    .success(function(response) {
      console.log("admFactory.getOrbitAll () response.data=" + JSON.stringify(response));
    })
    .error(function(err) {
       console.error('Sorry, Quindar platform cannot serve admFactory.getOrbitAll() immediately. Please retry later.');
    });
  };

  // retrieve orbit trajectory data by vehicleId, limited by nItems rows
  admFactory.getOrbitPartial = function(vehicleId, nItems) {
    var serviceEndpoint = 'http://platform.audacy.space:7902/services/v1/orbit/' + vehicleId
      + '/' + nItems;
    return $http.get(serviceEndpoint)
    .success(function(response) {
      console.log("admFactory.getOrbitPartial() response.data=" + JSON.stringify(response));
    })
    .error(function(err) {
       console.error('Sorry, Quindar platform cannot serve admFactory.getOrbitPartial() immediately. Please retry later.');
    });
  };

  // retrieve orbit trajectory data by vehicleId within a time period fromTS to toTS
  admFactory.getOrbitFromTo = function(vehicleId, fromTS, toTS) {
    var serviceEndpoint = 'http://platform.audacy.space:7902/services/v1/orbit/' + vehicleId
      + '/' + fromTS + '/' + toTS;
    return $http.get(serviceEndpoint)
    .success(function(response) {
      console.log("admFactory.getOrbitFromTo() response.data=" + JSON.stringify(response));
    })
    .error(function(err) {
       console.error('Sorry, Quindar platform cannot serve admFactory.getOrbitFromTo() immediately. Please retry later.');
    });
  };

  return admFactory;
}]);