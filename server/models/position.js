// Program: attitude.js
// Purpose: database schema
// Author:  Shalini Negi
// Updated: July 12, 2016

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var positionSchema = new Schema({
    vehicleId: String,
    timestamp: Number,
    x: Number,
    y: Number,
    z: Number,
    vx: Number,
    vy: Number,
    vz: Number,
    nLimit: Number,
    createdAt: Date
});


module.exports = mongoose.model('Position', positionSchema);


