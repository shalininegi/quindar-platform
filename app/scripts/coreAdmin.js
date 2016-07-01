// Program: module03.js 
// Previous: upsertapi2.js
// Purpose: Data API to write telemetry data into MongoDB
// Author:  Ray Lai
// Updated: Jul 1, 2016
// License: MIT license
//
module.exports = function(app, bodyParser, mongoose, fs, syslogger, logger, helper) {
  var LineReader = require('line-by-line');
  var FileStreamRotator = require('file-stream-rotator');
  var randomstring = require('randomstring');
  var async = require('async');

  var systemSettings = require('../../config/.systemSettings.js');
  mongoose.connect(systemSettings.dbUrl, systemSettings.dbOptions); 
  var db = mongoose.connection;

  var Attitude = require('../models/attitude.js');
  var Position = require('../models/position.js');
  var Vehicle  = require('../models/vehicle.js');
  var Orbit  = require('../models/orbit.js');

  // common database handlers
  db.on('connected', function (err) {
    console.log('MongoDB connected - coreAdmin.js (Write, DB admin and Trending REST APIs)');
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
  * @api {post} /services/v1/attitude  attitude
  * @apiVersion 0.1.0
  * @apiName postAttitude
  * @apiDescription upsert attitude data points
  * @apiGroup Telemetry
  *
  * @apiParam {String} vehicleId   spacecraft vehicle id
  * @apiParam {Number} q1 quaternion
  * @apiParam {Number} q2 quaternion
  * @apiParam {Number} q3 quaternion
  * @apiParam {Number} q4 quaternion
  *
  * @apiSuccess {array} data array of attitude quaternion q1/q2/q3/q4 data points
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  *     {"status":200,"message":"upsert attitude data points",
  *        "data":[{"_id":"56f312e98caf28f687482b5f","vehicleId":"IBEX",
  *        "timestamp":1457726400,"q1":0.651781,"q2":-0.29526,"q3":-0.268266,"q4":0.645009}]}
  *
  * @apiError (Error 500) {json} internal system error       The database is not ready to serve yet, e.g. after restart
  *
  * @apiErrorExample {json} Error-Response:
  *     HTTP/1.1 500 Internal system error encoutered
  * 
  *     {"message":"Internal system error encountered","type":"internal"}
  **/
  app.post('/services/v1/attitude', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    var attitudeData = new Attitude(req.body);
    attitudeData.timestamp = Math.floor(new Date() / 1000);
    attitudeData.createdAt = new Date();

    attitudeData.save(function(err) {
      if (err) {
        res.status(500).send({"message": "Internal system error encountered", "type":"internal"});
        console.log("attitude.save() error=" + err);
        return res.send(500, {error: err});
      };   
      res.status(200);
      res.json( {"status": 200, "message": "insert attitude data points", "data": req.body} );
    });
  })

  /**
  * @api {post} /services/v1/attitude/:vehicleId/:numberOfItems  attitude by vehicleId/numberOfItems
  * @apiVersion 0.1.0
  * @apiName postAttitude(vehicleId, numberOfItems)
  * @apiDescription upsert attitude data points by vehicleId limited by numberOfItems
  * @apiGroup Telemetry
  *
  * @apiParam {String} vehicleId   spacecraft vehicle id
  * @apiParam {Number} q1 quaternion
  * @apiParam {Number} q2 quaternion
  * @apiParam {Number} q3 quaternion
  * @apiParam {Number} q4 quaternion
  * @apiParam {Number} numberOfItems  number of data elements to return
  *
  * @apiSuccess {array} data array of attitude quaternion q1/q2/q3/q4 data points
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  * {"status":200,"message":"upsert attitude data points",
  *    "data":[{"_id":"56f312e98caf28f687482b5f","vehicleId":"IBEX","timestamp":1457726400,
  *    "q1":0.651781,"q2":-0.29526,"q3":-0.268266,"q4":0.645009}]}
  *
  * @apiError (Error 500) {json} internal system error       The database is not ready to serve yet, e.g. after restart
  *
  * @apiErrorExample {json} Error-Response:
  *     HTTP/1.1 500 Internal system error encoutered
  * 
  *     {"message":"Internal system error encountered","type":"internal"}
  **/
  app.post('/services/v1/simulation/attitude/:nTimes', function(req, res) { 
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    var nTimes = parseInt(req.params.nTimes);  
    var attitudeData = {};
    var dataList = [];
    for (var i=0; i < nTimes; i++) {
      attitudeData = new Attitude(helper.getAttitudeData(0.999999, -0.000001));
      attitudeData.timestamp = Math.floor(new Date() / 1000);
      attitudeData.createdAt = new Date();
      dataList.push(attitudeData);
    };

    var counter = 0;
    async.eachLimit(dataList, 5, function(item, callback) {
      attitudeData = new Attitude(item);
      attitudeData.save(function(err, item) {
        if (err) {
          res.status(500).send({"message": "Internal system error encountered", "type":"internal"});
          console.log("attitude.nTimes.save() error=" + err);
          return res.send(500, {error: err});
        };   

        // if no error
        counter++;
        if (counter  === dataList.length) {
          res.status(200);
          res.json( {"status": 200, "message": "retrieve all attitude data points", "data": JSON.stringify(dataList)} );    
        };
        callback(err);
      });  
    });
  });

  /**
  * @api {post} /services/v1/position position
  * @apiVersion 0.1.0
  * @apiName postPosition
  * @apiDescription upsert position data points
  * @apiGroup Telemetry
  *
  * @apiSuccess {array} data array of position data points (x,y,z,vx,vy,vz)
  *
  * @apiParam {String} vehicleId   spacecraft vehicle id
  * @apiParam {Number} x
  * @apiParam {Number} y
  * @apiParam {Number} z
  * @apiParam {Number} vx velocity for x
  * @apiParam {Number} vy velocity for y
  * @apiParam {Number} vz velocity for z

  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  *     {"status":200,"message":"upsert position data points",
  * "data":[{"_id":"56f3123e8caf28f687480f42","vehicleId":"IBEX","timestamp":1457640420,"x":236294.1956,
  * "y":116196.8879,"z":-34379.67682,"vx":-0.675287,"vy":0.508343,"vz":0.434496}]}
  *
  * @apiError (Error 500) {json} internal system error       The database is not ready to serve yet, e.g. after restart
  *
  * @apiErrorExample {json} Error-Response:
  *     HTTP/1.1 500 Internal system error encoutered
  * 
  *     {"message":"Internal system error encountered","type":"internal"}
  **/
  app.post('/services/v1/position', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    var positionData = new Position(req.body);
    positionData.timestamp = Math.floor(new Date() / 1000);
    positionData.createdAt = new Date();
    positionData.save(function(err) {
      if (err) {
        res.status(500).send({"message": "Internal system error encountered", "type":"internal"});
        console.log("position.save() error=" + err);
        return res.send(500, {error: err});
      };

      // if no error
      res.status(200);
      res.json( {"status": 200, "message": "retrieve all position data points", "data": req.body} );
    });
  })

  /**
  * @api {post} /services/v1/position/:vehicleId/:numberOfItems  position by vehicleId/numberOfItems
  * @apiVersion 0.1.0
  * @apiName postPosition(vehicleId, numberOfItems)
  * @apiDescription upsert position data points by vehicleId limited by numberOfItems
  * @apiGroup Telemetry
  *
  * @apiParam {String} vehicleId   spacecraft vehicle id
  * @apiParam {Number} x
  * @apiParam {Number} y
  * @apiParam {Number} z
  * @apiParam {Number} vx velocity for x
  * @apiParam {Number} vy velocity for y
  * @apiParam {Number} vz velocity for z
  * @apiParam {Number} numberOfItems  number of data elements to return
  *
  * @apiSuccess {array} data array of position data points (x,y,z,vx,vy,vz)
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  *     {"status":200,"message":"upsert position data points",
  * "data":[{"_id":"56f3123e8caf28f687480f42","vehicleId":"IBEX","timestamp":1457640420,"x":236294.1956,
  * "y":116196.8879,"z":-34379.67682,"vx":-0.675287,"vy":0.508343,"vz":0.434496}]}
  *
  * @apiError (Error 500) {json} internal system error       The database is not ready to serve yet, e.g. after restart
  *
  * @apiErrorExample {json} Error-Response:
  *     HTTP/1.1 500 Internal system error encoutered
  * 
  *     {"message":"Internal system error encountered","type":"internal"}
  **/
  app.post('/services/v1/simulation/position/:nTimes', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    var nTimes = parseInt(req.params.nTimes);  
    var positionData = {};
    var dataList = [];
    for (var i=0; i < nTimes; i++) {
      positionData = new Position(helper.getPositionData(400000.0, -400000.0, 20.0, -20.0));
      positionData.timestamp = Math.floor(new Date() / 1000);
      positionData.createdAt = new Date();
      dataList.push(positionData);
    };

    var counter = 0;
    async.eachLimit(dataList, 5, function(item, callback) {
      positionData = new Position(item);
      positionData.timestamp = Math.floor(new Date() / 1000);
      positionData.createdAt = new Date();
      positionData.save(function(err, item) {
        if (err) {
          res.status(500).send({"message": "Internal system error encountered", "type":"internal"});
          console.log("position.nTimes.save() error=" + err);
          return res.send(500, {error: err});
        };   

        // if no error
        counter++;
        if (counter  === dataList.length) {
          res.status(200);
          res.json( {"status": 200, "message": "retrieve all position data points", "data": JSON.stringify(dataList)} );
        };
        callback(err);
      });  
    });  
  })

  /**
  * @api {post} /services/v1/vehicle  vehicle
  * @apiVersion 0.1.0
  * @apiName postVehicle
  * @apiDescription upsert vehicle data points
  * @apiGroup Telemetry
  *
  * @apiParam {String} vehicleId   spacecraft vehicle id
  * @apiParam {Number} value, e.g. temperature value, battery level value
  * @apiParam {Number} calbiratin factor, e.g. T = 3*x - 4*x^2 + 2
  * @apiParam {Number} uom unit of measure
  * @apiParam {Number} alertHigh  threshold for high alert 
  * @apiParam {Number} warnHigh threshold for high warning
  * @apiParam {Number} alertLow  threshold for low alert 
  * @apiParam {Number} warnLow threshold for low warning
  * @apiParam {Number} deviceId device identifier
  *
  * @apiSuccess {array} data array of vehicle data points from sensors in the satellite , e.g. temperature value, warnHigh, alertHigh
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  *     {"status":200,"message":"retrieve all vehicle data points",
  * "data":[{"_id":"56f315e98caf28f687483228","vehicleId":"IBEX","timestamp":1457726400,
  * "value":315,"calibrationFactor":"T = 3*x - 4*x^2 + 2","uom":"Kelvin","alertHigh":330,
  * "warnHigh":321,"alertLow":280,"warnLow":274,"deviceId":"Battery01Temp"}]}
  *
  * @apiError (Error 500) {json} internal system error       The database is not ready to serve yet, e.g. after restart
  *
  * @apiErrorExample {json} Error-Response:
  *     HTTP/1.1 500 Internal system error encoutered
  * 
  *     {"message":"Internal system error encountered","type":"internal"}
  **/
  app.post('/services/v1/vehicle', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    var vehicleData = new Vehicle(req.body);
    vehicleData.timestamp = Math.floor(new Date() / 1000);
    vehicleData.createdAt = new Date();
    vehicleData.save(function(err) {
      if (err) {
        res.status(500).send({"message": "Internal system error encountered", "type":"internal"});
        console.log("vehicle.save() error=" + err);
        return res.send(500, {error: err});
      };

      // if no error
      res.status(200);
      res.json( {"status": 200, "message": "retrieve all attitude data points", "data": req.body} );
    });
  })

  /**
  * @api {post} /services/v1/vehicle/:vehicleId/:numberOfItems  vehicle by vehicleId/numberOfItems
  * @apiVersion 0.1.0
  * @apiName postVehicle(vehicleId, numberOfItems)
  * @apiDescription upsert vehicle data points by vehicleId limited by numberOfItems
  * @apiGroup Telemetry
  *
  * @apiParam {String} vehicleId   spacecraft vehicle id
  * @apiParam {Number} numberOfItems  number of data elements to return
  *
  * @apiParam {String} vehicleId   spacecraft vehicle id
  * @apiParam {Number} value, e.g. temperature value, battery level value
  * @apiParam {Number} calbiratin factor, e.g. T = 3*x - 4*x^2 + 2
  * @apiParam {Number} uom unit of measure
  * @apiParam {Number} alertHigh  threshold for high alert 
  * @apiParam {Number} warnHigh threshold for high warning
  * @apiParam {Number} alertLow  threshold for low alert 
  * @apiParam {Number} warnLow threshold for low warning
  * @apiParam {Number} deviceId device identifier
  *
  * @apiSuccess {array} data array of vehicle data points from sensors in the satellite , e.g. temperature value, warnHigh, alertHigh
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  *     {"status":200,"message":"retrieve all vehicle data points",
  * "data":[{"_id":"56f315e98caf28f687483228","vehicleId":"IBEX","timestamp":1457726400,
  * "value":315,"calibrationFactor":"T = 3*x - 4*x^2 + 2","uom":"Kelvin","alertHigh":330,
  * "warnHigh":321,"alertLow":280,"warnLow":274,"deviceId":"Battery01Temp"}]}
  *
  * @apiError (Error 500) {json} internal system error       The database is not ready to serve yet, e.g. after restart
  *
  * @apiErrorExample {json} Error-Response:
  *     HTTP/1.1 500 Internal system error encoutered
  * 
  *     {"message":"Internal system error encountered","type":"internal"}
  **/
  app.post('/services/v1/simulation/vehicle/:nTimes', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    var nTimes = parseInt(req.params.nTimes);  
    var vehicleData = {};
    var dataList = [];
    for (var i=0; i < nTimes; i++) {
      vehicleData = new Vehicle(helper.getVehiclesData(500.9999, -500.9999));
      dataList.push(vehicleData);
    };

    var counter = 0;
    async.eachLimit(dataList, 5, function(item, callback) {
      vehicleData = new Position(item);
      vehicleData.timestamp = Math.floor(new Date() / 1000);
      vehicleData.createdAt = new Date();
      vehicleData.save(function(err, item) {
        if (err) {
          res.status(500).send({"message": "Internal system error encountered", "type":"internal"});
          console.log("vehicle.nTimes.save() error=" + err);
          return res.send(500, {error: err});
        };   

        // if no error
        counter++;
        if (counter  === dataList.length) {
          res.status(200);
          res.json( {"status": 200, "message": "retrieve all position data points", "data": JSON.stringify(dataList)} );
        };
        callback(err);
      });  
    }); 
  })

  /**
  * @api {post} /services/v1/orbit  orbit
  * @apiVersion 0.1.0
  * @apiName postOrbit
  * @apiDescription upsert orbit data points
  * @apiGroup Telemetry
  *
  * @apiParam {String} vehicleId   spacecraft vehicle id
  * @apiParam {Array}  orbit trajectory array (array of longitutde, latitude)
  *
  * @apiSuccess {array} data array of vehicle data points from sensors in the satellite , e.g. temperature value, warnHigh, alertHigh
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  *     {"status":200,"message":"retrieve all vehicle data points",
  * "data":[{"_id":"56f315e98caf28f687483228","vehicleId":"IBEX","timestamp":1457726400,
  * "value": [ 10,20...]}]}
  *
  * @apiError (Error 500) {json} internal system error       The database is not ready to serve yet, e.g. after restart
  *
  * @apiErrorExample {json} Error-Response:
  *     HTTP/1.1 500 Internal system error encoutered
  * 
  *     {"message":"Internal system error encountered","type":"internal"}
  **/
  app.post('/services/v1/orbit', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    var orbitData = new Orbit(req.body);
    orbitData.timestamp = Math.floor(new Date() / 1000);
    orbitData.createdAt = new Date();
    orbitData.save(function(err) {
      if (err) { 
        res.status(500).send({"message": "Internal system error encountered", "type":"internal"});
        console.log("orbit.save() error=" + err);
        return res.send(500, {error: err});
      }

      // if no error
      res.status(200);
      res.json( {"status": 200, "message": "retrieve all position data points", "data": req.body} );
    });
  })


  /**
  * @api {post} /services/v1/orbit/:vehicleId/:numberOfItems  orbit by vehicleId/numberOfItems
  * @apiVersion 0.1.0
  * @apiName postOrbit
  * @apiDescription upserts orbit trajectory data points by vehicleId, limited by numberOfItems
  * @apiGroup Telemetry
  *
  * @apiParam {String} vehicleId   spacecraft vehicle id
  * @apiParam {Number} numberOfItems  number of data elements to return
  * @apiParam {Array}  orbit trajectory array (array of longitutde, latitude)
  *
  * @apiSuccess {array} data array of orbit data points (which are a series of longitude and latitude data points, sometimes like a sine wave)
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  *     {"status":200,"message":"retrieve all orbit data points",
  * "data":[{"_id":"56f315e98caf28f687483230","vehicleId":"IBEX","timestamp":1457726400,
  * "value": [ 10,20...]}]}
  *
  * @apiError (Error 500) {json} internal system error       The database is not ready to serve yet, e.g. after restart
  *
  * @apiErrorExample {json} Error-Response:
  *     HTTP/1.1 500 Internal system error encoutered
  * 
  *     {"message":"Internal system error encountered","type":"internal"}
  **/
  app.post('/services/v1/simulation/orbit/:nTimes', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    var nTimes = parseInt(req.params.nTimes);  
    var orbitData = {};
    var dataList = [];
    var nDataPoints = 200;
    for (var i=0; i < nTimes; i++) {
      orbitData = new Orbit(helper.getOrbit(Math.random() * 0.2, Math.random() * 0.3, nDataPoints));
      orbitData.timestamp = Math.floor(new Date() / 1000);
      orbitData.createdAt = new Date();
      dataList.push(orbitData);
    };
    
    var counter = 0;
    async.eachLimit(dataList, 5, function(item, callback) {
      orbitData = new Orbit(item);
      orbitData.timestamp = Math.floor(new Date() / 1000);
      orbitData.createdAt = new Date();
      orbitData.save(function(err, item) {
        if (err) {
          res.status(500).send({"message": "Internal system error encountered", "type":"internal"});
          console.log("orbit.nTimes.save() error=" + err);
          return res.send(500, {error: err});
        };   

        // if no error
        counter++;
        if (counter  === dataList.length) {
          res.status(200);
          res.json( {"status": 200, "message": "retrieve all orbit data points", "data": JSON.stringify(dataList)} );
        };
        callback(err);
      });  
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

      //res.status(200).send("collection dropped");
      return res.status(200).send({"message": "collection dropped", "type":"client"});
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
      //res.status(200).send({"status": 200, "message": "collection dropped"});
      return res.status(200).send({"message": "collection dropped", "type":"client"});  
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
      //res.status(200).send({"status": 200, "message": "collection dropped"});
      return res.status(200).send({"message": "collection dropped", "type":"client"}); 
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
      //res.status(200).send({"status": 200, "message": "collection dropped"});
      return res.status(200).send({"message": "collection dropped", "type":"client"});
    });
  });

  /**
  * @api {get} /services/v1/admin/metrics/attitude/total/all attitude metrics
  * @apiVersion 0.1.0
  * @apiName getMetricsAttitudeTotalAll
  * @apiDescription get Attitude collection metrics total count
  * @apiGroup Analytics
  *
  *
  * @apiSuccess {boolean} success
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  *     {"status":200,"message":"Quindar attitude metrics updated successfully."}
  *
  * @apiError (Error 500) {json} internal system error     no metrics collected
  *
  * @apiErrorExample {json} Error-Response:
  *     HTTP/1.1 500 Internal system error encoutered
  * 
  *     {"message":"Internal system error encountered","type":"internal"}
  **/
  // --- attitude

  app.get('/services/v1/admin/metrics/attitude/total/all', function(req, res) {  
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    var vehicleId = req.params.vehicleId;
    Attitude.count(function(err, cnt) {
      if (err) {
          res.status(500).send({"message": "Internal system error encountered", "type":"internal"});
          console.log("Quindar attitude metrics update error=" + err);
          res.status(500).send({error: err});
      };
      console.log("Quindar attitude metrics updated. count=" + cnt);
      //res.status(200).send("Quindar metrics updated successfully.");
      return res.status(200).send({"message": "Quindar attitude metrics updated successfully.", 
        "collection": "attitude",
        "count": cnt });
    });
  });

  /**
  * @api {get} /services/v1/admin/metrics/attitude/total/:vehicleId attitude metrics by vehicleId
  * @apiVersion 0.1.0
  * @apiName getMetricsAttitudeTotalByVehicleId
  * @apiDescription get Attitude collection metrics total count by vehicleId
  * @apiGroup Analytics
  *
  *
  * @apiSuccess {boolean} success
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  *     {"status":200,"message":"Quindar attitude metrics updated successfully."}
  *
  * @apiError (Error 500) {json} internal system error     no metrics collected
  *
  * @apiErrorExample {json} Error-Response:
  *     HTTP/1.1 500 Internal system error encoutered
  * 
  *     {"message":"Internal system error encountered","type":"internal"}
  **/
  app.get('/services/v1/admin/metrics/attitude/total/:vehicleId', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    var vehicleId = req.params.vehicleId;
    Attitude.count({ "vehicleId": vehicleId}  , function(err, cnt) {
      if (err) {
          res.status(500).send({"message": "Internal system error encountered", "type":"internal"});
          console.log("Quindar attitude metrics update error=" + err);
          return res.status(500).send({error: err});
      };
      console.log("Quindar attitude metrics updated. count=" + cnt);
      return res.status(200).send({"message": "Quindar attitude metrics updated successfully.", 
        "collection": "attitude",
        "vehicldId":  vehicleId, "count": cnt});
    });
  });

  /**
  * @api {get} /services/v1/admin/metrics/attitude/total/:vehicleId/:fromTS/:toTS attitude metrics by time period
  * @apiVersion 0.1.0
  * @apiName getMetricsAttitudeTotalByTime
  * @apiDescription get Attitude collection metrics total count by vehicleId from/to time period
  * @apiGroup Analytics
  *
  *
  * @apiSuccess {boolean} success
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  *     {"status":200,"message":"Quindar attitude metrics updated successfully."}
  *
  * @apiError (Error 500) {json} internal system error     no metrics collected
  *
  * @apiErrorExample {json} Error-Response:
  *     HTTP/1.1 500 Internal system error encoutered
  * 
  *     {"message":"Internal system error encountered","type":"internal"}
  **/
  app.get('/services/v1/admin/metrics/attitude/total/:vehicleId/:fromTS/:toTS', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    var vehicleId = req.params.vehicleId;
    var fromTS = req.params.fromTS;
    var toTS = req.params.toTS;

    Attitude.count({ "vehicleId": vehicleId,
       "timestamp": { $gte: fromTS, $lte: toTS}}, function(err, cnt) {
      if (err) {
          res.status(500).send({"message": "Internal system error encountered", "type":"internal"});
          console.log("Quindar attitude metrics update error=" + err);
          return res.status(500).send({error: err});
      };
      console.log("Quindar attitude metrics updated. count=" + cnt);
      return res.status(200).send({"message": "Quindar attitude metrics updated successfully.",  
        "collection": "attitude",
        "vehicldId":  vehicleId, "fromTS": fromTS, "toTS": toTS, "count": cnt});
    });
  });

  // ---position
  /**
  * @api {get} /services/v1/admin/metrics/position/total/all position metrics
  * @apiVersion 0.1.0
  * @apiName getMetricsPositionTotalAll
  * @apiDescription get Position collection metrics total count
  * @apiGroup Analytics
  *
  *
  * @apiSuccess {boolean} success
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  *     {"status":200,"message":"Quindar position metrics updated successfully."}
  *
  * @apiError (Error 500) {json} internal system error     no metrics collected
  *
  * @apiErrorExample {json} Error-Response:
  *     HTTP/1.1 500 Internal system error encoutered
  * 
  *     {"message":"Internal system error encountered","type":"internal"}
  **/
  app.get('/services/v1/admin/metrics/position/total/all', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    var vehicleId = req.params.vehicleId;
    Position.count(function(err, cnt) {
      if (err) {
          res.status(500).send({"message": "Internal system error encountered", "type":"internal"});
          console.log("Quindar position metrics update error=" + err);
          res.status(500).send({error: err});
      };
      console.log("Quindar position metrics updated. count=" + cnt);
      return res.status(200).send({"message": "Quindar position metrics updated successfully.", 
        "collection": "position",
        "count": cnt });
    });
  });

  /**
  * @api {get} /services/v1/admin/metrics/position/total/:vehicleId position by vehicleId
  * @apiVersion 0.1.0
  * @apiName getMetricsPositionTotalByVehicleId
  * @apiDescription get Position collection metrics total count by vehicleId
  * @apiGroup Analytics
  *
  *
  * @apiSuccess {boolean} success
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  *     {"status":200,"message":"Quindar position metrics updated successfully."}
  *
  * @apiError (Error 500) {json} internal system error     no metrics collected
  *
  * @apiErrorExample {json} Error-Response:
  *     HTTP/1.1 500 Internal system error encoutered
  * 
  *     {"message":"Internal system error encountered","type":"internal"}
  **/
  app.get('/services/v1/admin/metrics/position/total/:vehicleId', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    var vehicleId = req.params.vehicleId;
    Position.count({ "vehicleId": vehicleId}  , function(err, cnt) {
      if (err) {
          res.status(500).send({"message": "Internal system error encountered", "type":"internal"});
          console.log("Quindar position metrics update error=" + err);
          return res.status(500).send({error: err});
      };
      console.log("Quindar position metrics updated. count=" + cnt);
      return res.status(200).send({"message": "Quindar position metrics updated successfully.", 
        "collection": "position",
        "vehicldId":  vehicleId, "count": cnt});
    });
  });

  /**
  * @api {get} /services/v1/admin/metrics/position/total/:vehicleId/:fromTS/:toTS position metrics by time period
  * @apiVersion 0.1.0
  * @apiName getMetricsPositionTotalByTime
  * @apiDescription get Position collection metrics total count by vehicleId from/to time period
  * @apiGroup Analytics
  *
  *
  * @apiSuccess {boolean} success
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  *     {"status":200,"message":"Quindar position metrics updated successfully."}
  *
  * @apiError (Error 500) {json} internal system error     no metrics collected
  *
  * @apiErrorExample {json} Error-Response:
  *     HTTP/1.1 500 Internal system error encoutered
  * 
  *     {"message":"Internal system error encountered","type":"internal"}
  **/
  app.get('/services/v1/admin/metrics/position/total/:vehicleId/:fromTS/:toTS', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    var vehicleId = req.params.vehicleId;
    var fromTS = req.params.fromTS;
    var toTS = req.params.toTS;

    Position.count({ "vehicleId": vehicleId,
       "timestamp": { $gte: fromTS, $lte: toTS}}, function(err, cnt) {
      if (err) {
          res.status(500).send({"message": "Internal system error encountered", "type":"internal"});
          console.log("Quindar position metrics update error=" + err);
          return res.status(500).send({error: err});
      };
      console.log("Quindar position metrics updated. count=" + cnt);
      return res.status(200).send({"message": "Quindar position metrics updated successfully.",  
        "collection": "position",
        "vehicldId":  vehicleId, "fromTS": fromTS, "toTS": toTS, "count": cnt});
    });
  });

  // vehicle
  /**
  * @api {get} /services/v1/admin/metrics/vehicle/total/all vehicle metrics
  * @apiVersion 0.1.0
  * @apiName getMetricsVehicleTotalAll
  * @apiDescription get Vehicle collection metrics total count
  * @apiGroup Analytics
  *
  *
  * @apiSuccess {boolean} success
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  *     {"status":200,"message":"Quindar vehicle metrics updated successfully."}
  *
  * @apiError (Error 500) {json} internal system error     no metrics collected
  *
  * @apiErrorExample {json} Error-Response:
  *     HTTP/1.1 500 Internal system error encoutered
  * 
  *     {"message":"Internal system error encountered","type":"internal"}
  **/
  app.get('/services/v1/admin/metrics/vehicle/total/all', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    var vehicleId = req.params.vehicleId;
    Vehicle.count(function(err, cnt) {
      if (err) {
          res.status(500).send({"message": "Internal system error encountered", "type":"internal"});
          console.log("Quindar vehicle metrics update error=" + err);
          res.status(500).send({error: err});
      };
      console.log("Quindar vehicle metrics updated. count=" + cnt);
      return res.status(200).send({"message": "Quindar vehicle metrics updated successfully.", 
        "collection": "vehicle",
        "count": cnt });
    });
  });

  /**
  * @api {get} /services/v1/admin/metrics/vehicle/total/:vehicleId vehicle metrics by vehicleId
  * @apiVersion 0.1.0
  * @apiName getMetricsVehicleTotalByVehicleId
  * @apiDescription get Vehicle collection metrics total count by vehicleId
  * @apiGroup Analytics
  *
  *
  * @apiSuccess {boolean} success
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  *     {"status":200,"message":"Quindar vehicle metrics updated successfully."}
  *
  * @apiError (Error 500) {json} internal system error     no metrics collected
  *
  * @apiErrorExample {json} Error-Response:
  *     HTTP/1.1 500 Internal system error encoutered
  * 
  *     {"message":"Internal system error encountered","type":"internal"}
  **/
  app.get('/services/v1/admin/metrics/vehicle/total/:vehicleId', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    var vehicleId = req.params.vehicleId;
    Vehicle.count({ "vehicleId": vehicleId}  , function(err, cnt) {
      if (err) {
          res.status(500).send({"message": "Internal system error encountered", "type":"internal"});
          console.log("Quindar vehicle metrics update error=" + err);
          return res.status(500).send({error: err});
      };
      console.log("Quindar vehicle metrics updated. count=" + cnt);
      return res.status(200).send({"message": "Quindar vehicle metrics updated successfully.", 
        "collection": "vehicle",
        "vehicldId":  vehicleId, "count": cnt});
    });
  });

  /**
  * @api {get} /services/v1/admin/metrics/vehicle/total/:vehicleId/:fromTS/:toTS vehicle metrics by time period
  * @apiVersion 0.1.0
  * @apiName getMetricsVehicleTotalByTime
  * @apiDescription get Vehicle collection metrics total count by vehicleId from/to time period
  * @apiGroup Analytics
  *
  *
  * @apiSuccess {boolean} success
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  *     {"status":200,"message":"Quindar vehicle metrics updated successfully."}
  *
  * @apiError (Error 500) {json} internal system error     no metrics collected
  *
  * @apiErrorExample {json} Error-Response:
  *     HTTP/1.1 500 Internal system error encoutered
  * 
  *     {"message":"Internal system error encountered","type":"internal"}
  **/
  app.get('/services/v1/admin/metrics/vehicle/total/:vehicleId/:fromTS/:toTS', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    var vehicleId = req.params.vehicleId;
    var fromTS = req.params.fromTS;
    var toTS = req.params.toTS;

    Vehicle.count({ "vehicleId": vehicleId,
       "timestamp": { $gte: fromTS, $lte: toTS}}, function(err, cnt) {
      if (err) {
          res.status(500).send({"message": "Internal system error encountered", "type":"internal"});
          console.log("Quindar vehicle metrics update error=" + err);
          return res.status(500).send({error: err});
      };
      console.log("Quindar vehicle metrics updated. count=" + cnt);
      return res.status(200).send({"message": "Quindar vehicle metrics updated successfully.",  
        "collection": "vehicle",
        "vehicldId":  vehicleId, "fromTS": fromTS, "toTS": toTS, "count": cnt});
    });
  });

  // ---orbit
  /**
  * @api {get} /services/v1/admin/metrics/orbit/total/all orbit metrics
  * @apiVersion 0.1.0
  * @apiName getMetricsOrbitTotalAll
  * @apiDescription get Orbit collection metrics total count
  * @apiGroup Analytics
  *
  *
  * @apiSuccess {boolean} success
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  *     {"status":200,"message":"Quindar orbit metrics updated successfully."}
  *
  * @apiError (Error 500) {json} internal system error     no metrics collected
  *
  * @apiErrorExample {json} Error-Response:
  *     HTTP/1.1 500 Internal system error encoutered
  * 
  *     {"message":"Internal system error encountered","type":"internal"}
  **/
  app.get('/services/v1/admin/metrics/orbit/total/all', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    var vehicleId = req.params.vehicleId;
    Orbit.count(function(err, cnt) {
      if (err) {
          res.status(500).send({"message": "Internal system error encountered", "type":"internal"});
          console.log("Quindar orbit metrics update error=" + err);
          res.status(500).send({error: err});
      };
      console.log("Quindar orbit metrics updated. count=" + cnt);
      return res.status(200).send({"message": "Quindar orbit metrics updated successfully.", 
        "collection": "orbit",
        "count": cnt });
    });
  });

  /**
  * @api {get} /services/v1/admin/metrics/orbit/total/:vehicleId orbit metrics by vehicleId
  * @apiVersion 0.1.0
  * @apiName getMetricsOrbitTotalByVehicleId
  * @apiDescription get Orbit collection metrics total count by vehicleId
  * @apiGroup Analytics
  *
  *
  * @apiSuccess {boolean} success
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  *     {"status":200,"message":"Quindar orbit metrics updated successfully."}
  *
  * @apiError (Error 500) {json} internal system error     no metrics collected
  *
  * @apiErrorExample {json} Error-Response:
  *     HTTP/1.1 500 Internal system error encoutered
  * 
  *     {"message":"Internal system error encountered","type":"internal"}
  **/
  app.get('/services/v1/admin/metrics/orbit/total/:vehicleId', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    var vehicleId = req.params.vehicleId;
    Orbit.count({ "vehicleId": vehicleId}  , function(err, cnt) {
      if (err) {
          res.status(500).send({"message": "Internal system error encountered", "type":"internal"});
          console.log("Quindar orbit metrics update error=" + err);
          return res.status(500).send({error: err});
      };
      console.log("Quindar orbit metrics updated. count=" + cnt);
      return res.status(200).send({"message": "Quindar orbit metrics updated successfully.", 
        "collection": "orbit",
        "vehicldId":  vehicleId, "count": cnt});
    });
  });

  /**
  * @api {get} /services/v1/admin/metrics/orbit/total/:vehicleId/:fromTS/:toTS orbit metrics by time period
  * @apiVersion 0.1.0
  * @apiName getMetricsOrbitTotalByTime
  * @apiDescription get Vehicle collection metrics total count by vehicleId from/to time period
  * @apiGroup Analytics
  *
  *
  * @apiSuccess {boolean} success
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  *     {"status":200,"message":"Quindar orbit metrics updated successfully."}
  *
  * @apiError (Error 500) {json} internal system error     no metrics collected
  *
  * @apiErrorExample {json} Error-Response:
  *     HTTP/1.1 500 Internal system error encoutered
  * 
  *     {"message":"Internal system error encountered","type":"internal"}
  **/
  app.get('/services/v1/admin/metrics/orbit/total/:vehicleId/:fromTS/:toTS', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    var vehicleId = req.params.vehicleId;
    var fromTS = req.params.fromTS;
    var toTS = req.params.toTS;

    Orbit.count({ "vehicleId": vehicleId,
       "timestamp": { $gte: fromTS, $lte: toTS}}, function(err, cnt) {
      if (err) {
          res.status(500).send({"message": "Internal system error encountered", "type":"internal"});
          console.log("Quindar orbit metrics update error=" + err);
          return res.status(500).send({error: err});
      };
      console.log("Quindar orbit metrics updated. count=" + cnt);
      return res.status(200).send({"message": "Quindar orbit metrics updated successfully.",  
        "collection": "orbit",
        "vehicldId":  vehicleId, "fromTS": fromTS, "toTS": toTS, "count": cnt});
    });
  });

  // --- Data Aggregation framework example
  /**
  * @api {get} /services/v1/admin/metrics/trend/attitude/all attitude usage trend
  * @apiVersion 0.1.0
  * @apiName getMetricsAttitudeTrendAll
  * @apiDescription get attitude collection metrics trend in ascending order
  * @apiGroup Analytics
  *
  *
  * @apiSuccess {boolean} success
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  *     {"status":200,"message":"Quindar attitude trending metrics updated successfully."}
  *
  * @apiError (Error 500) {json} internal system error     no metrics collected
  *
  * @apiErrorExample {json} Error-Response:
  *     HTTP/1.1 500 Internal system error encoutered
  * 
  *     {"message":"Internal system error encountered","type":"internal"}
  **/
  app.get('/services/v1/admin/metrics/trend/attitude/all', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    Attitude.aggregate([
      {$group : {
        _id : { eventDate : "$timestamp" },
        subtotal: { $sum: 1}
      }},
      {$sort: { "timestamp": 1}}
      ],
      function(err,data) {
        if (err) {
          res.status(500).send({"message": "Internal system error encountered", "type":"internal"});
          console.log("Quindar attitude metrics trending error=" + err);
          return res.status(500).send({error: err});
        } else {
          console.log("Quindar attitude metrics trending updated. count=" + JSON.stringify(data));
          return res.status(200).send({"message": "Quindar attitude metrics trending updated successfully.",  
            "collection": "attitude",
            "trend": data});
        }
      }
    ) 
  });

   // --- Data Aggregation framework example
  /**
  * @api {get} /services/v1/admin/metrics/trend/attitude/nLimit attitude usage trend nLimit
  * @apiVersion 0.1.0
  * @apiName getMetricsAttitudeTrendAll
  * @apiDescription get attitude collection metrics trend in ascending order
  * @apiGroup Analytics
  *
  *
  * @apiSuccess {boolean} success
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  *     {"status":200,"message":"Quindar attitude trending metrics updated successfully."}
  *
  * @apiError (Error 500) {json} internal system error     no metrics collected
  *
  * @apiErrorExample {json} Error-Response:
  *     HTTP/1.1 500 Internal system error encoutered
  * 
  *     {"message":"Internal system error encountered","type":"internal"}
  **/
  app.get('/services/v1/admin/metrics/trend/attitude/:nLimit', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    var limitResultset = parseInt(req.params.nLimit);
    if (limitResultset > 9999) {
      limitResultset = 9999;
    } else if (limitResultset < 1) {
      limitResultset = 1;
    }

    Attitude.aggregate([
      {$group : {
        _id : { eventDate : "$timestamp" },
        subtotal: { $sum: 1}
      }},
      {$sort: { "timestamp": -1}},
      {$limit: limitResultset },
      {$sort: { "timestamp": -1}}
      ],
      function(err,data) {
        if (err) {
          res.status(500).send({"message": "Internal system error encountered", "type":"internal"});
          console.log("Quindar attitude metrics trending error=" + err);
          return res.status(500).send({error: err});
        } else {
          console.log("Quindar attitude metrics trending updated. count=" + JSON.stringify(data));
          return res.status(200).send({"message": "Quindar attitude metrics trending updated successfully.",  
            "collection": "attitude",
            "trend": data});
        }
      }
    ) 
  });

  /**
  * @api {get} /services/v1/admin/metrics/trend/attitude/:vehicleId attitude usage trend
  * @apiVersion 0.1.0
  * @apiName getMetricsAttitudeTrendByVehicleId
  * @apiDescription get attitude collection metrics trend by vehicleId  in ascending order
  * @apiGroup Analytics
  *
  *
  * @apiSuccess {boolean} success
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  *     {"status":200,"message":"Quindar attitude trending metrics by vehicleId updated successfully."}
  *
  * @apiError (Error 500) {json} internal system error     no metrics collected
  *
  * @apiErrorExample {json} Error-Response:
  *     HTTP/1.1 500 Internal system error encoutered
  * 
  *     {"message":"Internal system error encountered","type":"internal"}
  **/
  app.get('/services/v1/admin/metrics/trend/attitude/:vehicleId', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    var vehicleId = req.params.vehicleId;
    Attitude.aggregate([
      {$match: { "vehicleId": vehicleId}},
      {$group : {
        _id : { eventDate : "$timestamp" },
        subtotal: { $sum: 1}
      }},
      {$sort: { "timestamp": 1}}
      ],
      function(err,data) {
        if (err) {
          res.status(500).send({"message": "Internal system error encountered", "type":"internal"});
          console.log("Quindar attitude metrics trending error=" + err);
          return res.status(500).send({error: err});
        } else {
          console.log("Quindar attitude metrics trending updated. count=" + JSON.stringify(data));
          return res.status(200).send({"message": "Quindar attitude metrics trending updated successfully.",  
            "collection": "attitude",
            "trend": data});
        }
      }
    )
  });

  /**
  * @api {get} /services/v1/admin/metrics/trend/attitude/:vehicleId/:nLimit attitude usage trend nLimit
  * @apiVersion 0.1.0
  * @apiName getMetricsAttitudeTrendByVehicleId
  * @apiDescription get attitude collection metrics trend by vehicleId  in ascending order
  * @apiGroup Analytics
  *
  *
  * @apiSuccess {boolean} success
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  *     {"status":200,"message":"Quindar attitude trending metrics by vehicleId updated successfully."}
  *
  * @apiError (Error 500) {json} internal system error     no metrics collected
  *
  * @apiErrorExample {json} Error-Response:
  *     HTTP/1.1 500 Internal system error encoutered
  * 
  *     {"message":"Internal system error encountered","type":"internal"}
  **/
  app.get('/services/v1/admin/metrics/trend/attitude/:vehicleId/:nLimit', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    var limitResultset = parseInt(req.params.nLimit);
    if (limitResultset > 9999) {
      limitResultset = 9999;
    } else if (limitResultset < 1) {
      limitResultset = 1;
    }

    var vehicleId = req.params.vehicleId;
    Attitude.aggregate([
      {$match: { "vehicleId": vehicleId}},
      {$group : {
        _id : { eventDate : "$timestamp" },
        subtotal: { $sum: 1}
      }},
      {$sort: { "timestamp": -1}},
      {$limit: limitResultset },
      {$sort: { "timestamp": -1}}
      ],
      function(err,data) {
        if (err) {
          res.status(500).send({"message": "Internal system error encountered", "type":"internal"});
          console.log("Quindar attitude metrics trending error=" + err);
          return res.status(500).send({error: err});
        } else {
          console.log("Quindar attitude metrics trending updated. count=" + JSON.stringify(data));
          return res.status(200).send({"message": "Quindar attitude metrics trending updated successfully.",  
            "collection": "attitude",
            "trend": data});
        }
      }
    )
  });

  /**
  * @api {get} /services/v1/admin/metrics/trend/position/all position usage trend
  * @apiVersion 0.1.0
  * @apiName getMetricsPositionTrendAll
  * @apiDescription get position collection metrics trend in ascending order
  * @apiGroup Analytics
  *
  *
  * @apiSuccess {boolean} success
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  *     {"status":200,"message":"Quindar attitude trending metrics updated successfully."}
  *
  * @apiError (Error 500) {json} internal system error     no metrics collected
  *
  * @apiErrorExample {json} Error-Response:
  *     HTTP/1.1 500 Internal system error encoutered
  * 
  *     {"message":"Internal system error encountered","type":"internal"}
  **/
  app.get('/services/v1/admin/metrics/trend/position/all', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    Position.aggregate([
      {$group : {
        _id : { eventDate : "$timestamp" },
        subtotal: { $sum: 1}
      }},
      {$sort: { "timestamp": 1}}
      ],
      function(err,data) {
        if (err) {
          res.status(500).send({"message": "Internal system error encountered", "type":"internal"});
          console.log("Quindar position metrics trending error=" + err);
          return res.status(500).send({error: err});
        } else {
          console.log("Quindar position metrics trending updated. count=" + JSON.stringify(data));
          return res.status(200).send({"message": "Quindar position metrics trending updated successfully.",  
            "collection": "position",
            "trend": data});
        }
      }
    )
  });

  /**
  * @api {get} /services/v1/admin/metrics/trend/position/:nLimit position usage trend nLimit
  * @apiVersion 0.1.0
  * @apiName getMetricsPositionTrendAll
  * @apiDescription get position collection metrics trend in ascending order
  * @apiGroup Analytics
  *
  *
  * @apiSuccess {boolean} success
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  *     {"status":200,"message":"Quindar attitude trending metrics updated successfully."}
  *
  * @apiError (Error 500) {json} internal system error     no metrics collected
  *
  * @apiErrorExample {json} Error-Response:
  *     HTTP/1.1 500 Internal system error encoutered
  * 
  *     {"message":"Internal system error encountered","type":"internal"}
  **/
  app.get('/services/v1/admin/metrics/trend/position/:nLimit', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    var limitResultset = parseInt(req.params.nLimit);
    if (limitResultset > 9999) {
      limitResultset = 9999;
    } else if (limitResultset < 1) {
      limitResultset = 1;
    }

    Position.aggregate([
      {$group : {
        _id : { eventDate : "$timestamp" },
        subtotal: { $sum: 1}
      }},
      {$sort: { "timestamp": -1}},
      {$limit: limitResultset },
      {$sort: { "timestamp": -1}}
      ],
      function(err,data) {
        if (err) {
          res.status(500).send({"message": "Internal system error encountered", "type":"internal"});
          console.log("Quindar position metrics trending error=" + err);
          return res.status(500).send({error: err});
        } else {
          console.log("Quindar position metrics trending updated. count=" + JSON.stringify(data));
          return res.status(200).send({"message": "Quindar position metrics trending updated successfully.",  
            "collection": "position",
            "trend": data});
        }
      }
    )
  });

  /**
  * @api {get} /services/v1/admin/metrics/trend/position/:vehicleId positionusage trend by vehicleId
  * @apiVersion 0.1.0
  * @apiName getMetricsPositionTrendByVehicleId
  * @apiDescription get position collection metrics trend by vehicleId  in ascending order
  * @apiGroup Analytics
  *
  *
  * @apiSuccess {boolean} success
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  *     {"status":200,"message":"Quindar position trending metrics by vehicleId updated successfully."}
  *
  * @apiError (Error 500) {json} internal system error     no metrics collected
  *
  * @apiErrorExample {json} Error-Response:
  *     HTTP/1.1 500 Internal system error encoutered
  * 
  *     {"message":"Internal system error encountered","type":"internal"}
  **/
  app.get('/services/v1/admin/metrics/trend/position/:vehicleId', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    var vehicleId = req.params.vehicleId;
    Position.aggregate([
      {$match: { "vehicleId": vehicleId}},
      {$group : {
        _id : { eventDate : "$timestamp" },
        subtotal: { $sum: 1}
      }},
      {$sort: { "timestamp": 1}}
      ],
      function(err,data) {
        if (err) {
          res.status(500).send({"message": "Internal system error encountered", "type":"internal"});
          console.log("Quindar position metrics trending error=" + err);
          return res.status(500).send({error: err});
        } else {
          console.log("Quindar position metrics trending updated. count=" + JSON.stringify(data));
          return res.status(200).send({"message": "Quindar position metrics trending updated successfully.",  
            "collection": "position",
            "trend": data});
        }
      }
    )
  });

    /**
  * @api {get} /services/v1/admin/metrics/trend/position/:vehicleId/:nLimit position usage trend by vehicleId nLimit
  * @apiVersion 0.1.0
  * @apiName getMetricsPositionTrendByVehicleId
  * @apiDescription get position collection metrics trend by vehicleId  in ascending order
  * @apiGroup Analytics
  *
  *
  * @apiSuccess {boolean} success
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  *     {"status":200,"message":"Quindar position trending metrics by vehicleId updated successfully."}
  *
  * @apiError (Error 500) {json} internal system error     no metrics collected
  *
  * @apiErrorExample {json} Error-Response:
  *     HTTP/1.1 500 Internal system error encoutered
  * 
  *     {"message":"Internal system error encountered","type":"internal"}
  **/
  app.get('/services/v1/admin/metrics/trend/position/:vehicleId/:nLimit', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    var limitResultset = parseInt(req.params.nLimit);
    if (limitResultset > 9999) {
      limitResultset = 9999;
    } else if (limitResultset < 1) {
      limitResultset = 1;
    }

    var vehicleId = req.params.vehicleId;
    Position.aggregate([
      {$match: { "vehicleId": vehicleId}},
      {$group : {
        _id : { eventDate : "$timestamp" },
        subtotal: { $sum: 1}
      }},
      {$sort: { "timestamp": -1}},
      {$limit: limitResultset },
      {$sort: { "timestamp": -1}}
      ],
      function(err,data) {
        if (err) {
          res.status(500).send({"message": "Internal system error encountered", "type":"internal"});
          console.log("Quindar position metrics trending error=" + err);
          return res.status(500).send({error: err});
        } else {
          console.log("Quindar position metrics trending updated. count=" + JSON.stringify(data));
          return res.status(200).send({"message": "Quindar position metrics trending updated successfully.",  
            "collection": "position",
            "trend": data});
        }
      }
    )
  });

  /**
  * @api {get} /services/v1/admin/metrics/trend/vehicle/all vehicle usage trend
  * @apiVersion 0.1.0
  * @apiName getMetricsVehicleTrendAll
  * @apiDescription get vehicle collection metrics trend in ascending order
  * @apiGroup Analytics
  *
  *
  * @apiSuccess {boolean} success
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  *     {"status":200,"message":"Quindar vehicle trending metrics updated successfully."}
  *
  * @apiError (Error 500) {json} internal system error     no metrics collected
  *
  * @apiErrorExample {json} Error-Response:
  *     HTTP/1.1 500 Internal system error encoutered
  * 
  *     {"message":"Internal system error encountered","type":"internal"}
  **/
  app.get('/services/v1/admin/metrics/trend/vehicle/all', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    Vehicle.aggregate([
      {$group : {
        _id : { eventDate : "$timestamp" },
        subtotal: { $sum: 1}
      }},
      {$sort: { "timestamp": 1}}
      ],
      function(err,data) {
        if (err) {
          res.status(500).send({"message": "Internal system error encountered", "type":"internal"});
          console.log("Quindar vehicle metrics trending error=" + err);
          return res.status(500).send({error: err});
        } else {
          console.log("Quindar vehicle metrics trending updated. count=" + JSON.stringify(data));
          return res.status(200).send({"message": "Quindar vehicle metrics trending updated successfully.",  
            "collection": "vehicle",
            "trend": data});
        }
      }
    ) 
  });

   /**
  * @api {get} /services/v1/admin/metrics/trend/vehicle/:nLimit vehicle usage trend nLimit
  * @apiVersion 0.1.0
  * @apiName getMetricsVehicleTrendAll
  * @apiDescription get vehicle collection metrics trend in ascending order
  * @apiGroup Analytics
  *
  *
  * @apiSuccess {boolean} success
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  *     {"status":200,"message":"Quindar vehicle trending metrics updated successfully."}
  *
  * @apiError (Error 500) {json} internal system error     no metrics collected
  *
  * @apiErrorExample {json} Error-Response:
  *     HTTP/1.1 500 Internal system error encoutered
  * 
  *     {"message":"Internal system error encountered","type":"internal"}
  **/
  app.get('/services/v1/admin/metrics/trend/vehicle/:nLimit', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    var limitResultset = parseInt(req.params.nLimit);
    if (limitResultset > 9999) {
      limitResultset = 9999;
    } else if (limitResultset < 1) {
      limitResultset = 1;
    }

    Vehicle.aggregate([
      {$group : {
        _id : { eventDate : "$timestamp" },
        subtotal: { $sum: 1}
      }},
      {$sort: { "timestamp": -1}},
      {$limit: limitResultset },
      {$sort: { "timestamp": -1}}
      ],
      function(err,data) {
        if (err) {
          res.status(500).send({"message": "Internal system error encountered", "type":"internal"});
          console.log("Quindar vehicle metrics trending error=" + err);
          return res.status(500).send({error: err});
        } else {
          console.log("Quindar vehicle metrics trending updated. count=" + JSON.stringify(data));
          return res.status(200).send({"message": "Quindar vehicle metrics trending updated successfully.",  
            "collection": "vehicle",
            "trend": data});
        }
      }
    ) 
  });

  /**
  * @api {get} /services/v1/admin/metrics/trend/vehicle/:vehicleId vehicle usage trend by vehicleId
  * @apiVersion 0.1.0
  * @apiName getMetricsVehicleTrendByVehicleId
  * @apiDescription get vehicle collection metrics trend by vehicleId  in ascending order
  * @apiGroup Analytics
  *
  *
  * @apiSuccess {boolean} success
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  *     {"status":200,"message":"Quindar vehicle trending metrics by vehicleId updated successfully."}
  *
  * @apiError (Error 500) {json} internal system error     no metrics collected
  *
  * @apiErrorExample {json} Error-Response:
  *     HTTP/1.1 500 Internal system error encoutered
  * 
  *     {"message":"Internal system error encountered","type":"internal"}
  **/
  app.get('/services/v1/admin/metrics/trend/vehicle/:vehicleId', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    var vehicleId = req.params.vehicleId;
    Vehicle.aggregate([
      {$match: { "vehicleId": vehicleId}},
      {$group : {
        _id : { eventDate : "$timestamp" },
        subtotal: { $sum: 1}
      }},
      {$sort: { "timestamp": 1}}
      ],
      function(err,data) {
        if (err) {
          res.status(500).send({"message": "Internal system error encountered", "type":"internal"});
          console.log("Quindar vehicle metrics trending error=" + err);
          return res.status(500).send({error: err});
        } else {
          console.log("Quindar vehicle metrics trending updated. count=" + JSON.stringify(data));
          return res.status(200).send({"message": "Quindar vehicle metrics trending updated successfully.",  
            "collection": "vehicle",
            "trend": data});
        }
      }
    )
  });


  /**
  * @api {get} /services/v1/admin/metrics/trend/vehicle/:vehicleId/:nLimit vehicle usage trend by vehicleId nLimit
  * @apiVersion 0.1.0
  * @apiName getMetricsVehicleTrendByVehicleId
  * @apiDescription get vehicle collection metrics trend by vehicleId  in ascending order
  * @apiGroup Analytics
  *
  *
  * @apiSuccess {boolean} success
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  *     {"status":200,"message":"Quindar vehicle trending metrics by vehicleId updated successfully."}
  *
  * @apiError (Error 500) {json} internal system error     no metrics collected
  *
  * @apiErrorExample {json} Error-Response:
  *     HTTP/1.1 500 Internal system error encoutered
  * 
  *     {"message":"Internal system error encountered","type":"internal"}
  **/
  app.get('/services/v1/admin/metrics/trend/vehicle/:vehicleId/:nLimit', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    var limitResultset = parseInt(req.params.nLimit);
    if (limitResultset > 9999) {
      limitResultset = 9999;
    } else if (limitResultset < 1) {
      limitResultset = 1;
    }

    var vehicleId = req.params.vehicleId;
    Vehicle.aggregate([
      {$match: { "vehicleId": vehicleId}},
      {$group : {
        _id : { eventDate : "$timestamp" },
        subtotal: { $sum: 1}
      }},
      {$sort: { "timestamp": -1}},
      {$limit: limitResultset },
      {$sort: { "timestamp": -1}}
      ],
      function(err,data) {
        if (err) {
          res.status(500).send({"message": "Internal system error encountered", "type":"internal"});
          console.log("Quindar vehicle metrics trending error=" + err);
          return res.status(500).send({error: err});
        } else {
          console.log("Quindar vehicle metrics trending updated. count=" + JSON.stringify(data));
          return res.status(200).send({"message": "Quindar vehicle metrics trending updated successfully.",  
            "collection": "vehicle",
            "trend": data});
        }
      }
    )
  });


  /**
  * @api {get} /services/v1/admin/metrics/trend/orbit/all orbit usage trend
  * @apiVersion 0.1.0
  * @apiName getMetricsOrbitTrendAll
  * @apiDescription get orbit collection metrics trend in ascending order
  * @apiGroup Analytics
  *
  *
  * @apiSuccess {boolean} success
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  *     {"status":200,"message":"Quindar orbit trending metrics updated successfully."}
  *
  * @apiError (Error 500) {json} internal system error     no metrics collected
  *
  * @apiErrorExample {json} Error-Response:
  *     HTTP/1.1 500 Internal system error encoutered
  * 
  *     {"message":"Internal system error encountered","type":"internal"}
  **/
  app.get('/services/v1/admin/metrics/trend/orbit/all', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    Orbit.aggregate([
      {$group : {
        _id : { eventDate : "$timestamp" },
        subtotal: { $sum: 1}
      }},
      {$sort: { "timestamp": 1}}
      ],
      function(err,data) {
        if (err) {
          res.status(500).send({"message": "Internal system error encountered", "type":"internal"});
          console.log("Quindar orbit metrics trending error=" + err);
          return res.status(500).send({error: err});
        } else {
          console.log("Quindar orbit metrics trending updated. count=" + JSON.stringify(data));
          return res.status(200).send({"message": "Quindar orbit metrics trending updated successfully.",  
            "collection": "orbit",
            "trend": data});
        }
      }
    ) 
  });

   /**
  * @api {get} /services/v1/admin/metrics/trend/orbit/:nLimit orbit usage trend nLimit
  * @apiVersion 0.1.0
  * @apiName getMetricsOrbitTrendAll
  * @apiDescription get orbit collection metrics trend in ascending order
  * @apiGroup Analytics
  *
  *
  * @apiSuccess {boolean} success
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  *     {"status":200,"message":"Quindar orbit trending metrics updated successfully."}
  *
  * @apiError (Error 500) {json} internal system error     no metrics collected
  *
  * @apiErrorExample {json} Error-Response:
  *     HTTP/1.1 500 Internal system error encoutered
  * 
  *     {"message":"Internal system error encountered","type":"internal"}
  **/
  app.get('/services/v1/admin/metrics/trend/orbit/:nLimit', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    var limitResultset = parseInt(req.params.nLimit);
    if (limitResultset > 9999) {
      limitResultset = 9999;
    } else if (limitResultset < 1) {
      limitResultset = 1;
    }

    Orbit.aggregate([
      {$group : {
        _id : { eventDate : "$timestamp" },
        subtotal: { $sum: 1}
      }},
      {$sort: { "timestamp": -1}},
      {$limit: limitResultset },
      {$sort: { "timestamp": -1}}
      ],
      function(err,data) {
        if (err) {
          res.status(500).send({"message": "Internal system error encountered", "type":"internal"});
          console.log("Quindar orbit metrics trending error=" + err);
          return res.status(500).send({error: err});
        } else {
          console.log("Quindar orbit metrics trending updated. count=" + JSON.stringify(data));
          return res.status(200).send({"message": "Quindar orbit metrics trending updated successfully.",  
            "collection": "orbit",
            "trend": data});
        }
      }
    ) 
  });

  /**
  * @api {get} /services/v1/admin/metrics/trend/orbit/:vehicleId orbit usage trend by vehicleId
  * @apiVersion 0.1.0
  * @apiName getMetricsOrbitTrendByVehicleId
  * @apiDescription get orbit collection metrics trend by vehicleId  in ascending order
  * @apiGroup Analytics
  *
  *
  * @apiSuccess {boolean} success
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  *     {"status":200,"message":"Quindar orbit trending metrics by vehicleId updated successfully."}
  *
  * @apiError (Error 500) {json} internal system error     no metrics collected
  *
  * @apiErrorExample {json} Error-Response:
  *     HTTP/1.1 500 Internal system error encoutered
  * 
  *     {"message":"Internal system error encountered","type":"internal"}
  **/
  app.get('/services/v1/admin/metrics/trend/orbit/:vehicleId', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    var vehicleId = req.params.vehicleId;
    Orbit.aggregate([
      {$match: { "vehicleId": vehicleId}},
      {$group : {
        _id : { eventDate : "$timestamp" },
        subtotal: { $sum: 1}
      }},
      {$sort: { "timestamp": 1}}
      ],
      function(err,data) {
        if (err) {
          res.status(500).send({"message": "Internal system error encountered", "type":"internal"});
          console.log("Quindar orbit metrics trending error=" + err);
          return res.status(500).send({error: err});
        } else {
          console.log("Quindar orbit metrics trending updated. count=" + JSON.stringify(data));
          return res.status(200).send({"message": "Quindar orbit metrics trending updated successfully.",  
            "collection": "orbit",
            "trend": data});
        }
      }
    )
  });

    /**
  * @api {get} /services/v1/admin/metrics/trend/orbit/:vehicleId/:nLimit orbit usage trend by vehicleId nLimit
  * @apiVersion 0.1.0
  * @apiName getMetricsOrbitTrendByVehicleId
  * @apiDescription get orbit collection metrics trend by vehicleId  in ascending order
  * @apiGroup Analytics
  *
  *
  * @apiSuccess {boolean} success
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  *     {"status":200,"message":"Quindar orbit trending metrics by vehicleId updated successfully."}
  *
  * @apiError (Error 500) {json} internal system error     no metrics collected
  *
  * @apiErrorExample {json} Error-Response:
  *     HTTP/1.1 500 Internal system error encoutered
  * 
  *     {"message":"Internal system error encountered","type":"internal"}
  **/
  app.get('/services/v1/admin/metrics/trend/orbit/:vehicleId/:nLimit', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    var limitResultset = parseInt(req.params.nLimit);
    if (limitResultset > 9999) {
      limitResultset = 9999;
    } else if (limitResultset < 1) {
      limitResultset = 1;
    }

    var vehicleId = req.params.vehicleId;
    Orbit.aggregate([
      {$match: { "vehicleId": vehicleId}},
      {$group : {
        _id : { eventDate : "$timestamp" },
        subtotal: { $sum: 1}
      }},
      {$sort: { "timestamp": -1}},
      {$limit: limitResultset },
      {$sort: { "timestamp": -1}}
      ],
      function(err,data) {
        if (err) {
          res.status(500).send({"message": "Internal system error encountered", "type":"internal"});
          console.log("Quindar orbit metrics trending error=" + err);
          return res.status(500).send({error: err});
        } else {
          console.log("Quindar orbit metrics trending updated. count=" + JSON.stringify(data));
          return res.status(200).send({"message": "Quindar orbit metrics trending updated successfully.",  
            "collection": "orbit",
            "trend": data});
        }
      }
    )
  });


// end of module
};
