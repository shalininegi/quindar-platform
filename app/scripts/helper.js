// Program: module05.js
// Purpose: data generator helper class
// Author:  Ray Lai
// Updated: Apr 25, 2016
// License: MIT license
//

var systemSettings = require('../../config/.systemSettings.js');
var randomstring = require('randomstring');

console.log("/helper.js - helper classes loaded.");
/**
 * @api {javascript} getAttitudeData randomize attitude
 * @apiVersion 0.1.0
 * @apiName getAttitudeData
 * @apiDescription generate random attitude data (mock or testing)
 * @apiGroup Helper
 *
 **/
exports.getAttitudeData = function(high, low) {
  var testData= {};

  var q1 =  Math.random() * (high - low) + low;
  var q2 =  Math.random() * (high - low) + low;
  var q3 =  Math.random() * (high - low) + low;
  var q4 =  Math.random() * (high - low) + low;
  var timestamp = Math.floor(new Date() / 1000);
  var vehicleId = exports.getVehicleId();

  testData = { "vehicleId": vehicleId, "q1": Number(q1.toFixed(6)), "q2": Number(q2.toFixed(6)),
	   "q3": Number(q3.toFixed(6)), "q4": Number(q4.toFixed(6)), "timestamp": timestamp};
  return testData;
};

/**
 * @api {javascript} getPositionData randomize position
 * @apiVersion 0.1.0
 * @apiName getPositionData
 * @apiDescription generate random position data (mock or testing)
 * @apiGroup Helper
 *
 **/
exports.getPositionData = function(high, low, velocityHigh, velocityLow) {
  var testData = {};
  var vehicleId = exports.getVehicleId();
  var x = Math.random() * (high - low) + low;
  var y = Math.random() * (high - low) + low;
  var z = Math.random() * (high - low) + low;
  var vx = Math.random() * (velocityHigh - velocityLow) + velocityLow;
  var vy = Math.random() * (velocityHigh - velocityLow) + velocityLow;
  var vz = Math.random() * (velocityHigh - velocityLow) + velocityLow;
  var timestamp = Math.floor(new Date() / 1000);

  testData = { "vehicleId": vehicleId, "x": Number(x.toFixed(4)), "y": Number(y.toFixed(4)), "z": Number(z.toFixed(4)),
    "vx": Number(vx.toFixed(6)), "vy": Number(vy.toFixed(6)), "vz": Number(vz.toFixed(6)),
    "timestamp": timestamp };
  return testData;
};

/**
 * @api  {javascript} getVehicleData randomize vehicle
 * @apiVersion 0.1.0
 * @apiName getVehicleData
 * @apiDescription generate random vehicle data (mock or testing)
 * @apiGroup Helper
 *
 **/
exports.getVehiclesData = function(high, low) {
  var testData = {};
  var vehicleId = exports.getVehicleId();
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
    "timestamp": timestamp };
  return testData;
}

/**
 * @api  {javascript} getOrbitData randomize orbit trajectory
 * @apiVersion 0.1.0
 * @apiName getOrbitData
 * @apiDescription generate random orbit trajectory data (mock or testing)
 * @apiGroup Helper
 *
 **/
exports.getOrbit = function(initX, initY, nTimes) {
  var testData = {};
  var nData = [];
  var x = initX, y = initY; 
  var topic = "audacy.orbit";
  var vehicleId = exports.getVehicleId();
  var timestamp = Math.floor(new Date() / 1000);

  for (var i=0; i < nTimes; i++) {
    x = x + 7 * Math.random() * 0.3 ;
    y = 45 * Math.sin(2 * x / 180 * Math.PI);
    nData.push([x, y]);
  }

  testData = { "vehicleId": vehicleId, "trajectory": nData,
    "timestamp": timestamp };
  return testData;
}

/**
 * @api  {javascript} getVehicleId randomize satellite vehicleId
 * @apiVersion 0.1.0
 * @apiName getVehicleId
 * @apiDescription generate random satellite vehicle id based on historic names (mock or testing)
 * @apiGroup Helper
 *
 **/
exports.getVehicleId = function() {
  var vehicles = systemSettings.vehicles;
  var x = Math.round((Math.random() * vehicles.length) - 1);
  return vehicles[x];
}

