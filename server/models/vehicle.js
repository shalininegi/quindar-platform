// Program: attitude.js
// Purpose: database schema
// Author:  Shalini Negi
// Updated: July 12, 2016

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var vehicleSchema = new Schema({
    vehicleId: String,
    deviceId: String,
    timestamp: Number,
    value: Number,
    calibrationFactor: String,
    uom: String,
    alertHigh: Number,
    warnHigh: Number,
    alertLow: Number,
    warnLow: Number,
    nLimit: Number,
    createdAt: Date
});


module.exports = mongoose.model('Vehicle', vehicleSchema);
