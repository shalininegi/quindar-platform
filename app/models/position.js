// Program: position.js
// Purpose: database schema
// Author:  Ray Lai
// Updated: May 24, 2016
//

var mongoose = require('mongoose');
var positionSchema = new mongoose.Schema({
  vehicleId: String,
  timestamp: Number,
  x: Number,
  y: Number,
  z: Number,
  vx: Number,
  vy: Number,
  vz: Number,
  createdAt: Date 
}, { collection: 'position'});

module.exports = mongoose.model('Position', positionSchema);