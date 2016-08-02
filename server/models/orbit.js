// Program: attitude.js
// Purpose: database schema
// Author:  Shalini Negi
// Updated: July 12, 2016

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var orbitSchema = new Schema({
    vehicleId: String,
    timestamp: Number,
    trajectory: [],
    createdAt: Date
});


module.exports = mongoose.model('Orbit', orbitSchema);

