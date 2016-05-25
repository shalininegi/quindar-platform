// Program: vehicle.js
// Purpose: database schema
// Author:  Ray Lai
// Updated: May 24, 2016
//

var mongoose = require('mongoose');
var vehicleSchema = new mongoose.Schema({
  deviceId: String,
  timestamp: Number,
  value: Number,
  calibrationFactor: String,
  uom: String,
  alertHigh: Number,
  warnHigh: Number,
  alertLow: Number,
  warnLow: Number
}, { collection: 'vehicles'});

module.exports = mongoose.model('Vehicle', vehicleSchema);