// Program: orbit.js
// Purpose: database schema
// Author:  Ray Lai
// Updated: May 24, 2016
//

var mongoose = require('mongoose');
var orbitSchema = new mongoose.Schema({
  vehicleId: String,
  timestamp: Number,
  trajectory: []
}, { collection: 'orbit'});

module.exports = mongoose.model('Orbit', orbitSchema);