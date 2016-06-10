// Program: module08.js 
// Purpose: Data API to drop the entire db collection for maintenance, or to reset db
//          used by internal system admin only. no need to expose to outside
// Author:  Ray Lai
// Updated: Jun 7, 2016
// License: MIT license
//
module.exports = function(app, bodyParser, mongoose, fs, syslogger, logger, helper) {
  var LineReader = require('line-by-line');
  var FileStreamRotator = require('file-stream-rotator');
  var randomstring = require('randomstring');
  var async = require('async');

  var systemSettings = require('../../config/systemSettings.js');
  mongoose.connect(systemSettings.dbUrl, systemSettings.dbOptions); 
  var db = mongoose.connection;

  var Attitude = require('../models/attitude.js');
  var Position = require('../models/position.js');
  var Vehicle  = require('../models/vehicle.js');
  var Orbit  = require('../models/orbit.js');

  // common database handlers
  db.on('connected', function (err) {
    console.log('MongoDB connected');
  });

  db.on('error', function (err) {
    console.log('MongoDB connection error', err);
  });

  db.once('open', function (err, res) {
    console.log('MongoDB connected to ' + systemSettings.dbUrl);
  });

  db.on('disconnected', function () {
    console.log('Mongoose default connection disconnected');
  });

  process.on('SIGINT', function() {
    mongoose.connection.close(function () {
      console.log('Mongoose default connection disconnected through app termination');
    process.exit(0);
    });
  });

/**
  * @api {post} /services/v1/admin/cleanup/attitude  attitude
  * @apiVersion 0.1.0
  * @apiName dropAttitude
  * @apiDescription drop Attitude collection
  * @apiGroup Telemetry
  *
  *
  * @apiSuccess {boolean} success
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  *     {"status":200,"message":"collection dropped"}
  *
  * @apiError (Error 500) {json} internal system error       cannot drop collection
  *
  * @apiErrorExample {json} Error-Response:
  *     HTTP/1.1 500 Internal system error encoutered
  * 
  *     {"message":"Internal system error encountered","type":"internal"}
  **/
  app.post('/services/v1/admin/cleanup/attitude', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    Attitude.collection.remove(function(err) {
      if (err) {
          res.status(500).send({"message": "Internal system error encountered", "type":"internal"});
          console.log("Attitude.collection.drop() error=" + err);
          return res.send(500, {error: err});
      };

      res.status(200).send("collection dropped");
      return res.send(200).send({"message": "collection dropped", "type":"client"});
    });
  });

/**
  * @api {post} /services/v1/admin/cleanup/position  position
  * @apiVersion 0.1.0
  * @apiName dropPosition
  * @apiDescription drop Position collection
  * @apiGroup Telemetry
  *
  *
  * @apiSuccess {boolean} success
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  *     {"status":200,"message":"collection dropped"}
  *
  * @apiError (Error 500) {json} internal system error       cannot drop collection
  *
  * @apiErrorExample {json} Error-Response:
  *     HTTP/1.1 500 Internal system error encoutered
  * 
  *     {"message":"Internal system error encountered","type":"internal"}
  **/
  app.post('/services/v1/admin/cleanup/position', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    Position.collection.remove(function(err) {
      if (err) {
          res.status(500).send({"message": "Internal system error encountered", "type":"internal"});
          console.log("Position.collection.drop() error=" + err);
          return res.send(500, {error: err});
      }; 
      res.status(200).send({"status": 200, "message": "collection dropped"});
      return res.send(200).send({"message": "collection dropped", "type":"client"});  
    });
  });

/**
  * @api {post} /services/v1/admin/cleanup/vehicle  vehicle
  * @apiVersion 0.1.0
  * @apiName dropVehicle
  * @apiDescription drop Vehicle collection
  * @apiGroup Telemetry
  *
  *
  * @apiSuccess {boolean} success
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  *     {"status":200,"message":"collection dropped"}
  *
  * @apiError (Error 500) {json} internal system error       cannot drop collection
  *
  * @apiErrorExample {json} Error-Response:
  *     HTTP/1.1 500 Internal system error encoutered
  * 
  *     {"message":"Internal system error encountered","type":"internal"}
  **/
  app.post('/services/v1/admin/cleanup/vehicle', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    Vehicle.collection.remove(function(err) {
      if (err) {
          res.status(500).send({"message": "Internal system error encountered", "type":"internal"});
          console.log("Vehicle.collection.drop() error=" + err);
          return res.send(500, {error: err});
      }; 
      res.status(200).send({"status": 200, "message": "collection dropped"});
      return res.send(200).send({"message": "collection dropped", "type":"client"}); 
    });
  });

/**
  * @api {post} /services/v1/admin/cleanup/orbit  orbit
  * @apiVersion 0.1.0
  * @apiName dropOrbit
  * @apiDescription drop Orbit collection
  * @apiGroup Telemetry
  *
  *
  * @apiSuccess {boolean} success
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  *     {"status":200,"message":"collection dropped"}
  *
  * @apiError (Error 500) {json} internal system error       cannot drop collection
  *
  * @apiErrorExample {json} Error-Response:
  *     HTTP/1.1 500 Internal system error encoutered
  * 
  *     {"message":"Internal system error encountered","type":"internal"}
  **/
  app.post('/services/v1/admin/cleanup/orbit', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    Orbit.collection.remove(function(err) {
      if (err) {
          res.status(500).send({"message": "Internal system error encountered", "type":"internal"});
          console.log("Orbit.collection.drop() error=" + err);
          return res.send(500, {error: err});
      }; 
      res.status(200).send({"status": 200, "message": "collection dropped"});
      return res.send(200).send({"message": "collection dropped", "type":"client"});
    });
  });

// end of module
};
