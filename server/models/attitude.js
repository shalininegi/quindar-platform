// Program: attitude.js
// Purpose: database schema
// Author:  Shalini Negi
// Updated: July 12, 2016

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var attitudeSchema = new Schema({
  vehicleId: String,
  timestamp: Number,
  q1: Number,
  q2: Number,
  q3: Number,
  q4: Number,
  nLimit: Number,
  createdAt: Date
});


module.exports = mongoose.model('Attitude', attitudeSchema);
