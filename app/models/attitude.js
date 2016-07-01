// Program: attitude.js
// Purpose: database schema
// Author:  Ray Lai
// Updated: May 24, 2016
//
var mongoose = require('mongoose');
var attitudeSchema = new mongoose.Schema({
  vehicleId: String,
  timestamp: Number,
  q1: Number,
  q2: Number,
  q3: Number,
  q4: Number,
  createdAt: Date 
}, { collection: 'attitude'});

module.exports = mongoose.model('Attitude', attitudeSchema);