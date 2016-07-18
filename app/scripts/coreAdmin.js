// Program: coreAdmin.js 
// Purpose: Data API to write telemetry data into MongoDB
// Author:  Ray Lai
// Updated: Jul 11, 2016
// License: MIT license
//
module.exports = function(app, bodyParser, mongoose, fs, syslogger, logger, helper) {
  var LineReader = require('line-by-line');
  var FileStreamRotator = require('file-stream-rotator');
  var randomstring = require('randomstring');
  var async = require('async');

  var systemSettings = require('../../config/systemSettings.js');
  var nTimesMax = systemSettings.maxRecords;

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
  * @apiExample {curl} Example usage:
  * curl -X POST -H "Content-type: application/json" -d '{"vehicleId":"IBEX",
  *        "timestamp":1457726400,"q1":0.651781,"q2":-0.29526,"q3":-0.268266,"q4":0.645009}' 
  *        http://localhost:3000/services/v1/attitude
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  *     {"status":200,"message":"insert attitude data points",
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
        return res.status(500).send({"status": 500, "message": "Cannot insert attitude data points due to internal system error", 
          "type":"internal",
          "error": err});
      };   
      return res.status(200).send( {"status": 200, "message": "insert attitude data points", "data": attitudeData} );
    });
  });

  /**
  * @api {post} /services/v1/simulation/attitude/:nTimes  attitude by vehicleId/numberOfItems
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
  * @apiExample {curl} Example usage:
  * curl -X POST -H "Content-type: application/json" -d '{"vehicleId":"IBEX",
  *        "timestamp":1457726400,"q1":0.651781,"q2":-0.29526,"q3":-0.268266,"q4":0.645009}'
  *        http://localhost:3000/services/v1/simulation/attitude/3
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
    if (isNaN(nTimes) || (nTimes < 0)) {
      return res.status(300).send({"status": 300, "message": "User-related error encountered", "type":"user",
            "nTimes": nTimes,
            "error": "Please enter a valid number (nTimes)"});
    };
    
    if (nTimes > nTimesMax) {
      nTimes = nTimesMax;
    }

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
          res.status(500).send({"status": 500, "message": "Cannot insert attitude data points due to internal system error", 
            "type":"internal",
            "nTimes": nTimes, "counter": counter,
            "error": err});
        };   

        // if no error
        counter++;
        if (counter  === dataList.length) {
          res.status(200).send( {"status": 200, "message": "insert all attitude data points", 
            "nTimes": nTimes, "data": JSON.stringify(dataList)} );    
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
  * @apiExample {curl} Example usage:
  * curl -X POST -H "Content-type: application/json" -d '{"vehicleId":"IBEX","timestamp":1457640420,"x":236294.1956,
  * "y":116196.8879,"z":-34379.67682,"vx":-0.675287,"vy":0.508343,"vz":0.434496}' 
  *        http://localhost:3000/services/v1/position
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
        return res.status(500).send({"status": 500, "message": "Cannot insert position data points due to internal system error", 
          "type":"internal", "error": err});
      };

      // if no error
      return res.status(200).send( {"status": 200, "message": "insert all position data points", "data": positionData} );
    });
  })

  /**
  * @api {post} /services/v1/simulation/position/:nTimes  position by vehicleId/numberOfItems
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
  * @apiExample {curl} Example usage:
  * curl -X POST -H "Content-type: application/json" -d '{"vehicleId":"IBEX","timestamp":1457640420,"x":236294.1956,
  * "y":116196.8879,"z":-34379.67682,"vx":-0.675287,"vy":0.508343,"vz":0.434496}'
  *        http://localhost:3000/services/v1/simulation/position/2
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
    if (isNaN(nTimes) || (nTimes < 0)) {
      return res.status(300).send({"status": 300, "message": "User-related error encountered", "type":"user",
            "nTimes": nTimes,
            "error": "Please enter a valid number (nTimes)"});
    };
    
    if (nTimes > nTimesMax) {
      nTimes = nTimesMax;
    }

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
          res.status(500).send({"status":500, "message": "Cannot insert position data points due to internal system error", 
            "nTimes": nTimes, "counter": counter,
            "type":"internal", "error": err});
        };   

        // if no error
        counter++;
        if (counter  === dataList.length) {
          res.status(200).send( {"status": 200, "message": "create all position data points", "data": JSON.stringify(dataList)} );
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
  * @apiExample {curl} Example usage:
  * curl -X POST -H "Content-type: application/json" -d '{"vehicleId":"IBEX","timestamp":1457726400,
  * "value":315,"calibrationFactor":"T = 3*x - 4*x^2 + 2","uom":"Kelvin","alertHigh":330,
  * "warnHigh":321,"alertLow":280,"warnLow":274,"deviceId":"Battery01Temp"}' 
  *        http://localhost:3000/services/v1/vehicle
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
        return res.status(500).send({"status": 500, "message": "Cannot insert vehicle data points due to internal system error", "type":"internal",
          "error": err});
      };

      // if no error
      return res.status(200).send( {"status": 200, "message": "insert vehicle data points", "data": vehicleData} );
    });
  })

  /**
  * @api {post} /services/v1/simulation/vehicle/:nTimes  vehicle by vehicleId/numberOfItems
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
  * @apiExample {curl} Example usage:
  * curl -X POST -H "Content-type: application/json" -d '{"_id":"56f315e98caf28f687483228","vehicleId":"IBEX","timestamp":1457726400,
  * "value":315,"calibrationFactor":"T = 3*x - 4*x^2 + 2","uom":"Kelvin","alertHigh":330,
  * "warnHigh":321,"alertLow":280,"warnLow":274,"deviceId":"Battery01Temp"}]}'
  *        http://localhost:3000/services/v1/simulation/vehicle/3
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
    
    if (isNaN(nTimes) || (nTimes < 0)) {
      return res.status(300).send({"status": 300, "message": "User-related error encountered", "type":"user",
            "nTimes": nTimes,
            "error": "Please enter a valid number (nTimes)"});
    };
    
    if (nTimes > nTimesMax) {
      nTimes = nTimesMax;
    }

    var vehicleData = {};
    var dataList = [];
    for (var i=0; i < nTimes; i++) {
      vehicleData = new Vehicle(helper.getVehiclesData(500.9999, -500.9999));
      vehicleData.timestamp = Math.floor(new Date() / 1000);
      vehicleData.createdAt = new Date();
      dataList.push(vehicleData);
    };

    var counter = 0;
    async.eachLimit(dataList, 5, function(item, callback) {
      vehicleData = new Vehicle(item);
      vehicleData.timestamp = Math.floor(new Date() / 1000);
      vehicleData.createdAt = new Date();
      vehicleData.save(function(err, item) {
        if (err) {
          res.status(500).send({"message": "Cannot insert vehicle data points due to internal system error", 
            "nTimes": nTimes, "counter": counter,
            "type":"internal",
            "error": err});
        };   

        // if no error
        counter++;
        if (counter  === dataList.length) {
          res.status(200).send( {"status": 200, "message": "create all vehicle data points", "data": JSON.stringify(dataList)} );
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
  * @apiExample {curl} Example usage:
  * curl -X POST -H "Content-type: application/json" -d '{"data":[{"_id":"56f315e98caf28f687483228","vehicleId":"IBEX","timestamp":1457726400,
  * "value": [ 10,20...]}' 
  *        http://localhost:3000/services/v1/orbit
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
        return res.status(500).send({"status": 500, "message": "Cannot insert orbit data points due to internal system error", 
          "type":"internal", "error": err});
      }

      // if no error
      return res.status(200).send( {"status": 200, "message": "retrieve all orbit data points", "data": orbitData} );
    });
  });


  /**
  * @api {post} /services/v1/simulation/orbit/:nTimes  orbit by vehicleId/numberOfItems
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
  * @apiExample {curl} Example usage:
  * curl -X POST -H "Content-type: application/json" -d '{"data":[{"_id":"56f315e98caf28f687483230","vehicleId":"IBEX","timestamp":1457726400,
  * "value": [ 10,20...]}'
  *        http://localhost:3000/services/v1/simulation/orbit/6
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
    if (isNaN(nTimes) || (nTimes < 0)) {
      return res.status(300).send({"status": 300, "message": "User-related error encountered", "type":"user",
            "nTimes": nTimes,
            "error": "Please enter a valid number (nTimes)"});
    };
  
    if (nTimes > nTimesMax) {
      nTimes = nTimesMax;
    }

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
          res.status(500).send({"status": 500, "message": "Cannot insert orbit data points due to internal system error", 
            "type":"internal",
            "nTimes": nTimes, "counter": counter,
            "error": err});
        };   

        // if no error
        counter++;
        if (counter  === dataList.length) {
          res.status(200).send( {"status": 200, "message": "create all orbit data points", "data": JSON.stringify(dataList)} );
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
  * @apiExample {curl} Example usage:
  * curl -X POST -H "Content-type: application/json" http://localhost:3000/services/v1/admin/cleanup/attitude
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
          return res.status(500).send({"status":500, "message": "Cannot drop attitude collection due to system errors.", 
            "type":"internal", "error": err});
      };

      return res.status(200).send({"status":200, "message": "attitude collection dropped", "type":"client"});
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
  * @apiExample {curl} Example usage:
  * curl -X POST -H "Content-type: application/json" http://localhost:3000/services/v1/admin/cleanup/position
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
          return res.status(500).send({"status":500, "message": "Cannot drop position collection due to system errors.", 
            "type":"internal", "error": err});
      };

      return res.status(200).send({"status":200, "message": "position collection dropped", "type":"client"});
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
  * @apiExample {curl} Example usage:
  * curl -X POST -H "Content-type: application/json" http://localhost:3000/services/v1/admin/cleanup/vehicle
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
          return res.status(500).send({"status":500, "message": "Cannot drop vehicle collection due to system errors.", 
            "type":"internal", "error": err});
      };

      return res.status(200).send({"status":200, "message": "vehicle collection dropped", "type":"client"});
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
  * @apiExample {curl} Example usage:
  * curl -X POST -H "Content-type: application/json" http://localhost:3000/services/v1/admin/cleanup/orbit
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
          return res.status(500).send({"status":500, "message": "Cannot drop orbit collection due to system errors.", 
            "type":"internal", "error": err});
      };

      return res.status(200).send({"status":200, "message": "orbit collection dropped", "type":"client"});
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
  * @apiExample {curl} Example usage:
  * curl -X GET http://localhost:3000/services/v1/admin/metrics/attitude/total/all
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
          return res.status(500).send({"status": 500, "message": "Quindar attitude metrics update due to internal system error", 
            "type":"internal", "error": err});
      };
      console.log("Quindar attitude metrics updated. count=" + cnt);
      if (cnt > 0) {
        return res.status(200).send({"status": 200, "message": "Quindar attitude metrics updated successfully.", 
        "collection": "attitude",
        "count": cnt });
      } else {
        return res.status(300).send({"status": 300, "message": "Cannot find attitude data. The database is empty.", 
        "collection": "attitude" });
      };
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
  * @apiExample {curl} Example usage:
  * curl -X GET http://localhost:3000/services/v1/admin/metrics/attitude/total/IBEX
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
    Attitude.count({ "vehicleId": vehicleId}, function(err, cnt) {
      if (err) {
          return res.status(500).send({"status": 500,
            "message": "Quindar attitude metrics update due to internal system error", "type":"internal",
            "error": err});
      };
      
      if (cnt > 0) {
        return res.status(200).send({"status": 200, "message": "Quindar attitude metrics updated successfully.", 
        "collection": "attitude", "vehicleId": vehicleId,
        "count": cnt });
      } else {
        return res.status(300).send({"status": 300, "message": "Cannot find attitude data for vehicle id " + vehicleId, 
        "collection": "attitude" });
      };
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
  * @apiExample {curl} Example usage:
  * curl -X GET http://localhost:3000/services/v1/admin/metrics/attitude/total/IBEX/14258020640/1425600632
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

    if (isNaN(fromTS) || (fromTS < 0)) {
      return res.status(300).send({"status": 300, "message": "User-related error encountered", "type":"user",
            "error": "Please enter a valid number (fromTS)"});
    };
    if (isNaN(toTS) || (toTS < 0)) {
      return res.status(300).send({"status": 300, "message": "User-related error encountered", "type":"user",
            "error": "Please enter a valid number (toTS)"});
    };

    Attitude.count({ "vehicleId": vehicleId,
       "timestamp": { $gte: fromTS, $lte: toTS}}, function(err, cnt) {
      if (err) {
          return res.status(500).send({"status": 500, 
            "message": "Quindar attitude metrics update due to internal system error", "type":"internal", 
            "error": err});
      };
    
      if (cnt > 0) {
        return res.status(200).send({"status": 200, "message": "Quindar attitude metrics updated successfully.", 
        "collection": "attitude", "vehicleId": vehicleId,
        "fromTS": fromTS, "toTS": toTS, 
        "count": cnt });
      } else {
        return res.status(300).send({"status": 300, "message": "Cannot find attitude data for vehicle id " + vehicleId, 
        "collection": "attitude",
        "fromTS": fromTS, "toTS": toTS, 
        "count": cnt });
      };
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
  * @apiExample {curl} Example usage:
  * curl -X GET http://localhost:3000/services/v1/admin/metrics/position/total/all
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
          return res.status(500).send({"status": 500, 
            "message": "Quindar position metrics update due to internal system error", "type":"internal",
            "error": err});
      };
      
      if (cnt > 0) {
        return res.status(200).send({"status": 200, "message": "Quindar position metrics updated successfully.", 
        "collection": "position",
        "count": cnt });
      } else {
        return res.status(300).send({"status": 300, "message": "Cannot find position data. The database is empty.", 
        "collection": "position" });
      };
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
  *
  * @apiExample {curl} Example usage:
  * curl -X GET http://localhost:3000/services/v1/admin/metrics/position/total/IBEX
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
          return res.status(500).send({"status": 500,
            "message": "Quindar position metrics update due to internal system error", "type":"internal",
            "error": err});
      };
      
      if (cnt > 0) {
        return res.status(200).send({"status": 200, "message": "Quindar position metrics updated successfully.", 
        "collection": "position", "vehicleId": vehicleId,
        "count": cnt });
      } else {
        return res.status(300).send({"status": 300, "message": "Cannot find position data for vehicle id " + vehicleId, 
        "collection": "position" });
      };
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
  * @apiExample {curl} Example usage:
  * curl -X GET http://localhost:3000/services/v1/admin/metrics/position/total/IBEX/1425806200/142580678
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

    if (isNaN(fromTS) || (fromTS < 0)) {
      return res.status(300).send({"status": 300, "message": "User-related error encountered", "type":"user",
            "error": "Please enter a valid number (fromTS)"});
    };
    if (isNaN(toTS) || (toTS < 0)) {
      return res.status(300).send({"status": 300, "message": "User-related error encountered", "type":"user",
            "error": "Please enter a valid number (toTS)"});
    };

    Position.count({ "vehicleId": vehicleId,
       "timestamp": { $gte: fromTS, $lte: toTS}}, function(err, cnt) {
      if (err) {
          return res.status(500).send({"status": 500,
            "message": "Quindar position metrics update due to internal system error", "type":"internal",
            "error": err});
      };
      console.log("Quindar position metrics updated. count=" + cnt);
      if (cnt > 0) {
        return res.status(200).send({"status": 200, "message": "Quindar position metrics updated successfully.", 
        "collection": "position", "vehicleId": vehicleId,
        "fromTS": fromTS, "toTS": toTS, 
        "count": cnt });
      } else {
        return res.status(300).send({"status": 300, "message": "Cannot find position data for vehicle id " + vehicleId, 
        "collection": "position",
        "fromTS": fromTS, "toTS": toTS, 
        "count": cnt });
      };
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
  * @apiExample {curl} Example usage:
  * curl -X GET http://localhost:3000/services/v1/admin/metrics/vehicle/total/all
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
          return res.status(500).send({"status": 500, 
            "message": "Quindar vehicle metrics update error due to internal system error", "type":"internal",
            "error": err});
      };
      
      if (cnt > 0) {
        return res.status(200).send({"status": 200, "message": "Quindar vehicle metrics updated successfully.", 
        "collection": "vehicle",
        "count": cnt });
      } else {
        return res.status(300).send({"status": 300, "message": "Cannot find vehicle data. The database is empty.", 
        "collection": "vehicle" });
      };
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
  *
  * @apiExample {curl} Example usage:
  * curl -X GET http://localhost:3000/services/v1/admin/metrics/vehicle/total/IBEX
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
          return res.status(500).send({"status": 500,
            "message": "Quindar vehicle metrics update error due to internal system error", "type":"internal",
            "error": err});
      };
      
      if (cnt > 0) {
        return res.status(200).send({"status": 200, "message": "Quindar vehicle metrics updated successfully.", 
        "collection": "vehicle", "vehicleId": vehicleId,
        "count": cnt });
      } else {
        return res.status(300).send({"status": 300, "message": "Cannot find vehicle data for vehicle id " + vehicleId, 
        "collection": "vehicle" });
      };
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
  * @apiExample {curl} Example usage:
  * curl -X GET http://localhost:3000/services/v1/admin/metrics/vehicle/total/IBEX/1425806245/1425802076
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

    if (isNaN(fromTS) || (fromTS < 0)) {
      return res.status(300).send({"status": 300, "message": "User-related error encountered", "type":"user",
            "error": "Please enter a valid number (fromTS)"});
    };
    if (isNaN(toTS) || (toTS < 0)) {
      return res.status(300).send({"status": 300, "message": "User-related error encountered", "type":"user",
            "error": "Please enter a valid number (toTS)"});
    };

    Vehicle.count({ "vehicleId": vehicleId,
       "timestamp": { $gte: fromTS, $lte: toTS}}, function(err, cnt) {
      if (err) {
          return res.status(500).send({"status": 500,
            "message": "Quindar vehicle metrics update error due to internal system error", "type":"internal",
            "error": err});
      };
      
      if (cnt > 0) {
        return res.status(200).send({"status": 200, "message": "Quindar vehicle metrics updated successfully.", 
        "collection": "vehicle", "vehicleId": vehicleId,
        "fromTS": fromTS, "toTS": toTS, 
        "count": cnt });
      } else {
        return res.status(300).send({"status": 300, "message": "Cannot find vehicle data for vehicle id " + vehicleId, 
        "collection": "vehicle",
        "fromTS": fromTS, "toTS": toTS, 
        "count": cnt });
      };
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
  * @apiExample {curl} Example usage:
  * curl -X GET http://localhost:3000/services/v1/admin/metrics/orbit/total/all
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
          return res.status(500).send({"status": 500, 
            "message": "Quindar orbit metrics update error due to internal system error", "type":"internal",
            "error": err});
      };
      
      if (cnt > 0) {
        return res.status(200).send({"status": 200, "message": "Quindar orbit metrics updated successfully.", 
        "collection": "orbit",
        "count": cnt });
      } else {
        return res.status(300).send({"status": 300, "message": "Cannot find orbit data. The database is empty.", 
        "collection": "orbit" });
      };
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
  * @apiExample {curl} Example usage:
  * curl -X GET http://localhost:3000/services/v1/admin/metrics/orbit/total/IBEX
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
          return res.status(500).send({"status": 500,
            "message": "Quindar orbit metrics update error due to internal system error", "type":"internal",
            "error": err});
      };
      
      if (cnt > 0) {
        return res.status(200).send({"status": 200, "message": "Quindar orbit metrics updated successfully.", 
        "collection": "orbit", "vehicleId": vehicleId,
        "count": cnt });
      } else {
        return res.status(300).send({"status": 300, "message": "Cannot find orbit data for vehicle id " + vehicleId, 
        "collection": "orbit" });
      };
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
  * @apiExample {curl} Example usage:
  * curl -X GET http://localhost:3000/services/v1/admin/metrics/orbit/total/IBEX/1425802002/14256064289
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

    if (isNaN(fromTS) || (fromTS < 0)) {
      return res.status(300).send({"status": 300, "message": "User-related error encountered", "type":"user",
            "error": "Please enter a valid number (fromTS)"});
    };
    if (isNaN(toTS) || (toTS < 0)) {
      return res.status(300).send({"status": 300, "message": "User-related error encountered", "type":"user",
            "error": "Please enter a valid number (toTS)"});
    };

    Orbit.count({ "vehicleId": vehicleId,
       "timestamp": { $gte: fromTS, $lte: toTS}}, function(err, cnt) {
      if (err) {
          return res.status(500).send({"status": 500,
            "message": "Quindar orbit metrics update error due to internal system error", "type":"internal",
            "error": err});
      };
      
      if (cnt > 0) {
        return res.status(200).send({"status": 200, "message": "Quindar orbit metrics updated successfully.", 
        "collection": "orbit", "vehicleId": vehicleId,
        "count": cnt });
      } else {
        return res.status(300).send({"status": 300, "message": "Cannot find orbit data for vehicle id " + vehicleId, 
        "collection": "orbit" });
      };
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
  * @apiExample {curl} Example usage:
  * curl -X GET http://localhost:3000/services/v1/admin/metrics/trend/attitude/all
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
          return res.status(500).send({"status": 500,
            "message": "Cannot extract attitude metrics trending due to internal system error", "type":"internal",
            "error": err});
        } else {
          return res.status(200).send({"status": 200, "message": "Quindar attitude metrics trending updated successfully.",  
            "collection": "attitude",
            "trend": data});
        }
      }
    ) 
  });

   // --- Data Aggregation framework example
  /**
  * @api {get} /services/v1/admin/metrics/trend/attitude/:nLimit attitude usage trend nLimit
  * @apiVersion 0.1.0
  * @apiName getMetricsAttitudeTrendAll
  * @apiDescription get attitude collection metrics trend in ascending order
  * @apiGroup Analytics
  *
  *
  * @apiSuccess {boolean} success
  *
  * @apiExample {curl} Example usage:
  * curl -X GET http://localhost:3000/services/v1/admin/metrics/trend/attitude/4
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
          return res.status(500).send({"status": 500,
            "message": "Cannot extract attitude metrics trending due to internal system error", "type":"internal",
            "error": err});
        } else {
          return res.status(200).send({"status": 200,"message": "Quindar attitude metrics trending updated successfully.",  
            "collection": "attitude",
            "trend": data});
        }
      }
    ) 
  });

  /**
  * @api {get} /services/v1/admin/metrics/trend/attitude/by/:vehicleId attitude usage trend
  * @apiVersion 0.1.0
  * @apiName getMetricsAttitudeTrendByVehicleId
  * @apiDescription get attitude collection metrics trend by vehicleId  in ascending order
  * @apiGroup Analytics
  *
  *
  * @apiSuccess {boolean} success
  *
  * @apiExample {curl} Example usage:
  * curl -X GET http://localhost:3000/services/v1/admin/metrics/trend/attitude/by/IBEX
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
  app.get('/services/v1/admin/metrics/trend/attitude/by/:vehicleId', function(req, res) {
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
          return res.status(500).send({"status": 500,
            "message": "Cannot extract attitude metrics trending due to internal system error", "type":"internal",
            "vehicleId": vehicleId,
            "error": err});
        } else {
          return res.status(200).send({"status": 200,"message": "Quindar attitude metrics trending updated successfully.",  
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
  * @apiExample {curl} Example usage:
  * curl -X GET http://localhost:3000/services/v1/admin/metrics/trend/attitude/IBEX/2
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
          return res.status(500).send({"status": 500, "message": "Internal system error encountered", "type":"internal"});
        } else {
          return res.status(200).send({"status": 200, "message": "Quindar attitude metrics trending updated successfully.",  
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
  * @apiExample {curl} Example usage:
  * curl -X GET http://localhost:3000/services/v1/admin/metrics/trend/position/all
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
          return res.status(500).send({"status": 500, "message": "Internal system error encountered", "type":"internal"});
        } else {
          return res.status(200).send({"status": 200, "message": "Quindar position metrics trending updated successfully.",  
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
  * @apiExample {curl} Example usage:
  * curl -X GET http://localhost:3000/services/v1/admin/metrics/trend/position/5
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
          return res.status(500).send({"status": 500, "message": "Internal system error encountered", "type":"internal"});
        } else {
          return res.status(200).send({"status": 200, "message": "Quindar position metrics trending updated successfully.",  
            "collection": "position",
            "trend": data});
        }
      }
    )
  });

  /**
  * @api {get} /services/v1/admin/metrics/trend/position/by/:vehicleId position usage trend by vehicleId
  * @apiVersion 0.1.0
  * @apiName getMetricsPositionTrendByVehicleId
  * @apiDescription get position collection metrics trend by vehicleId  in ascending order
  * @apiGroup Analytics
  *
  *
  * @apiSuccess {boolean} success
  *
  * @apiExample {curl} Example usage:
  * curl -X GET http://localhost:3000/services/v1/admin/metrics/trend/position/by/IBEX
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
  app.get('/services/v1/admin/metrics/trend/position/by/:vehicleId', function(req, res) {
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
          return res.status(500).send({"status": 500, "message": "Internal system error encountered", "type":"internal"});
        } else {
          return res.status(200).send({"status": 200, "message": "Quindar position metrics trending updated successfully.",  
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
  * @apiExample {curl} Example usage:
  * curl -X GET http://localhost:3000/services/v1/admin/metrics/trend/position/IBEX/2
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
          return res.status(500).send({"status": 500, "message": "Internal system error encountered", "type":"internal"});
        } else {
          return res.status(200).send({"status": 200, "message": "Quindar position metrics trending updated successfully.",  
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
  * @apiExample {curl} Example usage:
  * curl -X GET http://localhost:3000/services/v1/admin/metrics/trend/vehicle/all
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
          return res.status(500).send({"status": 500, "message": "Internal system error encountered", "type":"internal"});
        } else {
          return res.status(200).send({"status": 200, "message": "Quindar vehicle metrics trending updated successfully.",  
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
  * @apiExample {curl} Example usage:
  * curl -X GET http://localhost:3000/services/v1/admin/metrics/trend/vehicle/5
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
          return res.status(500).send({"status": 500, "message": "Internal system error encountered", "type":"internal"});
        } else {
          return res.status(200).send({"status": 200,  "message": "Quindar vehicle metrics trending updated successfully.",  
            "collection": "vehicle",
            "trend": data});
        }
      }
    ) 
  });

  /**
  * @api {get} /services/v1/admin/metrics/trend/vehicle/by/:vehicleId vehicle usage trend by vehicleId
  * @apiVersion 0.1.0
  * @apiName getMetricsVehicleTrendByVehicleId
  * @apiDescription get vehicle collection metrics trend by vehicleId  in ascending order
  * @apiGroup Analytics
  *
  *
  * @apiSuccess {boolean} success
  *
  * @apiExample {curl} Example usage:
  * curl -X GET http://localhost:3000/services/v1/admin/metrics/trend/vehicle/by/IBEX
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
  app.get('/services/v1/admin/metrics/trend/vehicle/by/:vehicleId', function(req, res) {
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
          return res.status(500).send({"status": 500, "message": "Internal system error encountered", "type":"internal"});
        } else {
          return res.status(200).send({"status": 200, "message": "Quindar vehicle metrics trending updated successfully.",  
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
  * @apiExample {curl} Example usage:
  * curl -X GET http://localhost:3000/services/v1/admin/metrics/trend/vehicle/IBEX/2
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
          return res.status(500).send({"status": 500, "message": "Internal system error encountered", "type":"internal"});
        } else {
          return res.status(200).send({"status": 200, "message": "Quindar vehicle metrics trending updated successfully.",  
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
  * @apiExample {curl} Example usage:
  * curl -X GET http://localhost:3000/services/v1/admin/metrics/trend/orbit/all
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
          return res.status(500).send({"status": 500, "message": "Internal system error encountered", "type":"internal"});
        } else {
          return res.status(200).send({"status": 200, "message": "Quindar orbit metrics trending updated successfully.",  
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
  * @apiExample {curl} Example usage:
  * curl -X GET http://localhost:3000/services/v1/admin/metrics/trend/orbit/6
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
          return res.status(500).send({"status": 500, "message": "Internal system error encountered", "type":"internal"});
        } else {
          return res.status(200).send({"status": 200, "message": "Quindar orbit metrics trending updated successfully.",  
            "collection": "orbit",
            "trend": data});
        }
      }
    ) 
  });

  /**
  * @api {get} /services/v1/admin/metrics/trend/orbit/by/:vehicleId orbit usage trend by vehicleId
  * @apiVersion 0.1.0
  * @apiName getMetricsOrbitTrendByVehicleId
  * @apiDescription get orbit collection metrics trend by vehicleId  in ascending order
  * @apiGroup Analytics
  *
  *
  * @apiSuccess {boolean} success
  *
  * @apiExample {curl} Example usage:
  * curl -X GET http://localhost:3000/services/v1/admin/metrics/trend/orbit/by/IBEX
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
  app.get('/services/v1/admin/metrics/trend/orbit/by/:vehicleId', function(req, res) {
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
          return res.status(500).send({"status": 500, "message": "Internal system error encountered", "type":"internal"});
        } else {
          return res.status(200).send({"status": 200, "message": "Quindar orbit metrics trending updated successfully.",  
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
  * @apiExample {curl} Example usage:
  * curl -X GET http://localhost:3000/services/v1/admin/metrics/trend/orbit/IBEX/6
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
          return res.status(500).send({"status": 500, "message": "Internal system error encountered", "type":"internal"});
        } else {
          return res.status(200).send({"status": 200, "message": "Quindar orbit metrics trending updated successfully.",  
            "collection": "orbit",
            "trend": data});
        }
      }
    )
  });

// 7/11/2016 RayL:
// ---- merged from telemetryRead.js

/**
  * @api {get} /services/v1/attitude  attitude
  * @apiVersion 0.1.0
  * @apiName getAttitude
  * @apiDescription return all attitude data points
  * @apiGroup Telemetry
  *
  * @apiSuccess {array} data array of attitude quaternion q1/q2/q3/q4 data points
  *
  * @apiExample {curl} Example usage:
  * curl -X GET http://localhost:3000/services/v1/attitude
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  *     {"status":200,"message":"retrieve all attitude data points",
  *        "data":[{"_id":"56f312e98caf28f687482b5f","vehicleId":"IBEX",
  *        "timestamp":1457726400,"q1":0.651781,"q2":-0.29526,"q3":-0.268266,"q4":0.645009}]}
  *
  * @apiError (Error 500) {json} message internal system error       The database is not ready to serve yet, e.g. after restart
  *
  * @apiErrorExample {json} Error-Response:
  *     HTTP/1.1 message Internal system error encoutered
  * 
  *     {"message":"Internal system error encountered","type":"internal"}
  **/
  app.get('/services/v1/attitude', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    Attitude.find({}, function(err, data) {
      if (err) {
        return res.status(500).send({"status": 500, "message": "Cannot read attitude data points due to internal system error", "type":"internal"});
      } else {
        return res.status(200).send( {"status": 200, "message": "retrieve all attitude data points", "data": data} );
      }
    }).limit(nTimesMax);
  });

  /**
  * @api {get} /services/v1/attitude/:vId/:nLimit  attitude by vehicleId/numberOfItems
  * @apiVersion 0.1.0
  * @apiName getAttitude(vehicleId, numberOfItems)
  * @apiDescription return attitude data points by vehicleId limited by numberOfItems
  * @apiGroup Telemetry
  *
  * @apiParam {String} vehicleId   spacecraft vehicle id
  * @apiParam {Number} numberOfItems  number of data elements to return
  *
  * @apiExample {curl} Example usage:
  * curl -X GET http://localhost:3000/services/v1/attitude/IBEX/5
  *
  * @apiSuccess {array} data array of attitude quaternion q1/q2/q3/q4 data points
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  * {"status":200,"message":"retrieve all attitude data points",
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
  app.get('/services/v1/attitude/:vId/:nLimit', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    var vehicleId = req.params.vId;
    var limitResultset = parseInt(req.params.nLimit);
    if (limitResultset > 9999) {
      limitResultset = 9999;
    } else if (limitResultset < 1) {
      limitResultset = 1;
    }

    Attitude.aggregate([{$match: { "vehicleId": vehicleId}}, {$sort: { "timestamp": -1}}, 
      {$limit: limitResultset }, {$sort: { "timestamp": -1} } ], 
      function(err,data) {
        if (err) {
          return res.status(400).send({"status": 400, "message": "Invalid input parameter or option", "type":"client",
            "vehicleId": vehicleId,
            "nLimit": limitResultset
          });
        } else {
            res.status(200).send( {"status": 200, "message": "retrieve all attitude data points", 
              "vehicleId": vehicleId,
              "nLimit": limitResultset,
              "data": data} );
        }
      });
    });

 /**
  * @api {get} /services/v1/attitude/:vId/:fromTS/:toTS attitude by vehicleId/from/to
  * @apiVersion 0.1.0
  * @apiName getAttitude(vehicleId, fromTime, toTime)
  * @apiDescription return attitude data points from time/to time by vehicleId
  * @apiGroup Telemetry
  *
  * @apiParam {String} vehicleId   spacecraft vehicle id
  * @apiParam {Number} fromTime    from time period (Unix time in number, e.g. 1457726400)
  * @apiParam {Number} toTime      to time period (Unix time in number)
  *
  * @apiExample {curl} Example usage:
  * curl -X GET http://localhost:3000/services/v1/attitude/IBEX/10000/1457725800
  *
  * @apiSuccess {array} data array of attitude quaternion q1/q2/q3/q4 data points
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  * {"status":200,"message":"retrieve all attitude data points",
  * "data":[{"_id":"56f312e98caf28f687482b5f","vehicleId":"IBEX","timestamp":1457726400,"q1":0.651781,
  * "q2":-0.29526,"q3":-0.268266,"q4":0.645009},
  * {"_id":"56f312e98caf28f687482b5e","vehicleId":"IBEX","timestamp":1457726340,"q1":0.651703,
  * "q2":-0.295319,"q3":-0.268371,"q4":0.645017},{"_id":"56f312e98caf28f687482b5d","vehicleId":"IBEX",
  * "timestamp":1457726280,"q1":0.651624,"q2":-0.295378,"q3":-0.268475,"q4":0.645026}]}
  *
  * @apiError (Error 500) {json} internal system error       The database is not ready to serve yet, e.g. after restart
  *
  * @apiErrorExample {json} Error-Response:
  *     HTTP/1.1 500 Internal system error encoutered
  * 
  *     {"message":"Internal system error encountered","type":"internal"}
  **/
  app.get('/services/v1/attitude/:vId/:fromTS/:toTS', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    // process input parameters
    var vehicleId = req.params.vId;
    var fromTS = parseInt(req.params.fromTS);
    if (fromTS < 1) {
      fromTS = 0;
    }

    if (toTS < 1) {
      toTS = 0;
    }
    var toTS = parseInt(req.params.toTS);

    Attitude.aggregate([{$match: {$and: [{ "vehicleId": vehicleId}, 
      { "timestamp": { $gte: fromTS, $lte: toTS}} ]}}, 
      {$sort: { "timestamp": -1}},         
      {$limit: 10 }, {$sort: { "timestamp": -1} } 
      ],
      function(err,data) {
        if (err) {
          return res.status(400).send({"status": 400, "message": "Invalid input parameter or option", "type":"client",
            "vehicleId": vehicleId, "fromTS": fromTS, "toTS": toTS
          });
        } else {
          return res.status(200).send({"status": 200, "message": "retrieve all attitude data points", 
            "vehicleId": vehicleId, "fromTS": fromTS, "toTS": toTS,
            "data": data} );
        }
      }
    );
  });

  /**
  * @api {get} /services/v1/position  position
  * @apiVersion 0.1.0
  * @apiName getPosition
  * @apiDescription return all position data points
  * @apiGroup Telemetry
  *
  * @apiSuccess {array} data array of position data points (x,y,z,vx,vy,vz)
  *
  * @apiExample {curl} Example usage:
  * curl -X GET http://localhost:3000/services/v1/position
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  *     {"status":200,"message":"retrieve all position data points",
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
  app.get('/services/v1/position', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    Position.find({}, function(err, data) {
      if (err) {
        return res.status(500).send({"status": 500,  "message": "Cannot read position data points due to internal system error", "type":"internal"});
      } else {
        return res.status(200).send( {"status": 200, "message": "retrieve all position data points", "data": data} );
      
      }
    }).limit(nTimesMax);
  });

/**
  * @api {get} /services/v1/position/:vId/:nLimit  position by vehicleId/numberOfItems
  * @apiVersion 0.1.0
  * @apiName getPosition(vehicleId, numberOfItems)
  * @apiDescription return position data points by vehicleId limited by numberOfItems
  * @apiGroup Telemetry
  *
  * @apiParam {String} vehicleId   spacecraft vehicle id
  * @apiParam {Number} numberOfItems  number of data elements to return
  *
  * @apiExample {curl} Example usage:
  * curl -X GET http://localhost:3000/services/v1/position/IBEX/3
  *
  * @apiSuccess {array} data array of position data points (x,y,z,vx,vy,vz)
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  * {"status":200,"message":"retrieve all position data points",
  * "data":[{"_id":"56f3123e8caf28f6874814e2","vehicleId":"IBEX","timestamp":1457726400,
  * "x":158565.2009,"y":148104.098,"z":5207.584894,"vx":-1.151578,"vy":0.17722,"vz":0.46557}]}
  *
  * @apiError (Error 500) {json} internal system error       The database is not ready to serve yet, e.g. after restart
  *
  * @apiErrorExample {json} Error-Response:
  *     HTTP/1.1 500 Internal system error encoutered
  * 
  *     {"message":"Internal system error encountered","type":"internal"}
  **/
  app.get('/services/v1/position/:vId/:nLimit', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    // process input parameters
    var vehicleId = req.params.vId;
    var limitResultset = parseInt(req.params.nLimit);
    if (limitResultset > 9999) {
      limitResultset = 9999;
    } else if (limitResultset < 1) {
      limitResultset = 1;
    }

    Position.aggregate([{$match: { "vehicleId": vehicleId}}, {$sort: { "timestamp": -1}},
      {$limit: limitResultset }, {$sort: { "timestamp": -1} } ],
      function(err,data) {
        if (err) {
          return res.status(400).send({"status": 400, "message": "Invalid input parameter or option", "type":"client",
            "vehicleId": vehicleId,
            "nLimit": limitResultset
          });
        } else {
          return res.status(200).send( {"status": 200, "message": "retrieve all position data points", 
            "vehicleId": vehicleId,
            "nLimit": limitResultset,
            "data": data} );
        }
      }
    );
  });

/**
  * @api {get} /services/v1/position/:vId/:fromTS/:toTS  position by vehicleId/from/to
  * @apiVersion 0.1.0
  * @apiName getPosition(vehicleId, fromTime, toTime)
  * @apiDescription return position data points from time/to time by vehicleId
  * @apiGroup Telemetry
  *
  * @apiParam {String} vehicleId   spacecraft vehicle id
  * @apiParam {Number} fromTime    from time period (Unix time in number, e.g. 1457726400)
  * @apiParam {Number} toTime      to time period (Unix time in number)
  *
  * @apiExample {curl} Example usage:
  * curl -X GET http://localhost:3000/services/v1/position/IBEX/1457726339/1457726340
  *
  * @apiSuccess {array} data array of position data points (x,y,z,vx,vy,vz)
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  * {"status":200,"message":"retrieve all position data points",
  * "data":[{"_id":"56f3123e8caf28f6874814e1","vehicleId":"IBEX","timestamp":1457726340,
  * "x":158634.2476,"y":148093.1597,"z":5179.409783,"vx":-1.151208,"vy":0.177567,"vz":0.465583}]}
  *
  * @apiError (Error 500) {json} internal system error       The database is not ready to serve yet, e.g. after restart
  *
  * @apiErrorExample {json} Error-Response:
  *     HTTP/1.1 500 Internal system error encoutered
  * 
  *     {"message":"Internal system error encountered","type":"internal"}
  **/
  app.get('/services/v1/position/:vId/:fromTS/:toTS', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    // process input parameters
    var vehicleId = req.params.vId;
    var fromTS = parseInt(req.params.fromTS);
    if (fromTS < 1) {
      fromTS = 0;
    }

    if (toTS < 1) {
      toTS = 0;
    }
    var toTS = parseInt(req.params.toTS);

    Position.aggregate([{$match: {$and: [{ "vehicleId": vehicleId}, 
      { "timestamp": { $gte: fromTS, $lte: toTS}} ]}}, 
      {$sort: { "timestamp": -1}},         
      {$limit: 10 }, {$sort: { "timestamp": -1} } 
      ],
      function(err,data) {
        if (err) {
          return res.status(400).send({"status": 400, "message": "Invalid input parameter or option", "type":"client",
            "vehicleId": vehicleId, "fromTS": fromTS, "toTS": toTS
          });
        } else {
          return res.status(200).send( {"status": 200, "message": "retrieve all position data points", 
            "vehicleId": vehicleId, "fromTS": fromTS, "toTS": toTS,
            "data": data} );
        }
      }
    );
  });

 /**
  * @api {get} /services/v1/vehicle  vehicle
  * @apiVersion 0.1.0
  * @apiName getVehicle
  * @apiDescription return all vehicle data points
  * @apiGroup Telemetry
  *
  * @apiSuccess {array} data array of vehicle data points from sensors in the satellite , e.g. temperature value, warnHigh, alertHigh
  *
  * @apiExample {curl} Example usage:
  * curl -X GET http://localhost:3000/services/v1/vehicle
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
  app.get('/services/v1/vehicle', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    Vehicle.find({}, function(err, data) {
      if (err) {
        return res.status(500).send({"status": 500, "message": "Cannot read vehicle data points due to internal system error", "type":"internal"});
      } else {
        return res.status(200).send({"status": 200, "message": "retrieve all vehicle data points", "data": data} );
      }
    }).limit(nTimesMax);
  });

/**
  * @api {get} /services/v1/vehicle/:vId/:nLimit vehicle by vehicleId/numberOfItems
  * @apiVersion 0.1.0
  * @apiName getVehicle(vehicleId, numberOfItems)
  * @apiDescription return vehicle data points by vehicleId limited by numberOfItems
  * @apiGroup Telemetry
  *
  * @apiParam {String} vehicleId   spacecraft vehicle id
  * @apiParam {Number} numberOfItems  number of data elements to return
  *
  * @apiSuccess {array} data array of vehicle data points from sensors in the satellite , e.g. temperature value, warnHigh, alertHigh
  *
  * @apiExample {curl} Example usage:
  * curl -X GET http://localhost:3000/services/v1/vehicle/IBEX/3
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
  app.get('/services/v1/vehicle/:vId/:nLimit', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    // process input parameters
    var vehicleId = req.params.vId;
    var limitResultset = parseInt(req.params.nLimit);
    if (limitResultset > 9999) {
      limitResultset = 9999;
    } else if (limitResultset < 1) {
      limitResultset = 1;
    }

    Vehicle.aggregate([{$match: { "vehicleId": vehicleId}}, {$sort: { "timestamp": -1}},
      {$limit: limitResultset }, {$sort: { "timestamp": -1} } ],
      function(err,data) {
        if (err) {
          return res.status(400).send({"status": 400, "message": "Invalid input parameter or option", "type":"client",
            "vehicleId": vehicleId,
            "nLimit": limitResultset
          });
        } else {
          return res.status(200).send({"status": 200, "message": "retrieve all vehicle data points", 
            "vehicleId": vehicleId,
            "nLimit": limitResultset,
            "data": data} );
        }
      }
    );
  })

/**
  * @api {get} /services/v1/vehicle/:vId/:fromTS/:toTS  vehicle by vehicleId/from/to
  * @apiVersion 0.1.0
  * @apiName getVegucke(vehicleId, fromTime, toTime)
  * @apiDescription return vehicle data points from time/to time by vehicleId
  * @apiGroup Telemetry
  *
  * @apiParam {String} vehicleId   spacecraft vehicle id
  * @apiParam {Number} fromTime    from time period (Unix time in number, e.g. 1457726400)
  * @apiParam {Number} toTime      to time period (Unix time in number)
  *
  * @apiSuccess {array} data array of vehicle data points from sensors in the satellite , e.g. temperature value, warnHigh, alertHigh
  *
  * @apiExample {curl} Example usage:
  * curl -X GET http://localhost:3000/services/v1/vehicle/IBEX/1457726300/1457726400
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
  app.get('/services/v1/vehicle/:vId/:fromTS/:toTS', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    // process input parameters
    var vehicleId = req.params.vId;
    var fromTS = parseInt(req.params.fromTS);
    if (fromTS < 1) {
      fromTS = 0;
    }

    if (toTS < 1) {
      toTS = 0;
    }
    var toTS = parseInt(req.params.toTS);

    Vehicle.aggregate([{$match: {$and: [{ "vehicleId": vehicleId}, 
      { "timestamp": { $gte: fromTS, $lte: toTS}} ]}}, 
      {$sort: { "timestamp": -1}},         
      {$limit: 10 }, {$sort: { "timestamp": -1} } 
      ],
      function(err,data) {
        if (err) {
          return res.send(400).send({"status": 400, "message": "Invalid input parameter or option", "type":"client",
            "vehicleId": vehicleId, "fromTS": fromTS, "toTS": toTS
          });
        } else {
          return res.status(200),send({"status": 200, "message": "retrieve all vehicle data points", 
            "vehicleId": vehicleId, "fromTS": fromTS, "toTS": toTS,
            "data": data} );
        }
      }
    );
  });

/**
  * @api {get} /services/v1/orbit  orbit
  * @apiVersion 0.1.0
  * @apiName getOrbit
  * @apiDescription return all orbit trajectory data points
  * @apiGroup Telemetry
  *
  * @apiSuccess {array} data array of orbit data points (which are a series of longitude and latitude data points, sometimes like a sine wave)
  *
  * @apiExample {curl} Example usage:
  * curl -X GET http://localhost:3000/services/v1/orbit
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
app.get('/services/v1/orbit', function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");

  Orbit.find({}, function(err, data) {
    if (err) {
      return res.status(500).send({"status": 500, "message": "Cannot read orbit data points due to internal system error", "type":"internal"});
    } else {
      return res.status(200).send({"status": 200, "message": "retrieve all orbit data points", "data": data} );
    }
  }).sort({'timestamp': -1}).limit(nTimesMax);
});

/**
  * @api {get} /services/v1/orbit/:vId/:nLimit  orbit by vehicleId/numberOfItems
  * @apiVersion 0.1.0
  * @apiName getOrbit
  * @apiDescription return all orbit trajectory data points by vehicleId, limited by numberOfItems
  * @apiGroup Telemetry
  *
  * @apiParam {String} vehicleId   spacecraft vehicle id
  * @apiParam {Number} numberOfItems  number of data elements to return
  *
  * @apiSuccess {array} data array of orbit data points (which are a series of longitude and latitude data points, sometimes like a sine wave)
  *
  * @apiExample {curl} Example usage:
  * curl -X GET http://localhost:3000/services/v1/orbit/IBEX/2
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
app.get('/services/v1/orbit/:vId/:nLimit', function(req, res) {
   res.setHeader('Content-Type', 'application/json');
   res.header("Access-Control-Allow-Origin", "*");
   res.header("Access-Control-Allow-Headers", "X-Requested-With");

   // process input parameters
   var vehicleId = req.params.vId;
   var limitResultset = parseInt(req.params.nLimit);
   if (limitResultset > 9999) {
      limitResultset = 9999;
   } else if (limitResultset < 1) {
      limitResultset = 1;
   }

    Orbit.aggregate([{$match: { "vehicleId": vehicleId}}, {$sort: { "timestamp": -1}},
      {$limit: limitResultset }, {$sort: { "timestamp": -1} } ],
      function(err,data) {
        if (err) {
          return res.status(400).send({"status": 400, "message": "Invalid input parameter or option", "type":"client",
            "vehicleId": vehicleId,
            "nLimit": limitResultset
          });
        } else {
          return res.status(200).send({"status": 200, "message": "retrieve all position data points", 
            "vehicleId": vehicleId,
            "nLimit": limitResultset,
            "data": data} );
        }
      }
    );
  })

/**
  * @api {get} /services/v1/orbit/:vId/:fromTS/:toTS  orbit by vehicleId/numberOfItems
  * @apiVersion 0.1.0
  * @apiName getOrbit(vehicleId, numberOfItems)
  * @apiDescription return orbit data points by vehicleId limited by numberOfItems
  * @apiGroup Telemetry
  *
  * @apiParam {String} vehicleId   spacecraft vehicle id
  * @apiParam {Number} numberOfItems  number of data elements to return
  *
  * @apiSuccess {array} data array of orbit data points (which are a series of longitude and latitude data points, sometimes like a sine wave)
  *
  * @apiExample {curl} Example usage:
  * curl -X GET http://localhost:3000/services/v1/orbit/IBEX/1457726300/1457726400
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
  app.get('/services/v1/orbit/:vId/:fromTS/:toTS', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    // process input parameters
    var vehicleId = req.params.vId;
    var fromTS = parseInt(req.params.fromTS);
    if (fromTS < 1) {
      fromTS = 0;
    }

    if (toTS < 1) {
      toTS = 0;
    }
    var toTS = parseInt(req.params.toTS);

    Orbit.aggregate([{$match: {$and: [{ "vehicleId": vehicleId}, 
      { "timestamp": { $gte: fromTS, $lte: toTS}} ]}}, 
      {$sort: { "timestamp": -1}},         
      {$limit: 10 }, {$sort: { "timestamp": -1} } 
      ],
      function(err,data) {
        if (err) {
          return res.status(400).send({"status": 400, "message": "Invalid input parameter or option", "type":"client",
            "vehicleId": vehicleId, "fromTS": fromTS, "toTS": toTS
          });
        } else {
          return res.status(200).send({"status": 200, "message": "retrieve all orbit data points", 
            "vehicleId": vehicleId, "fromTS": fromTS, "toTS": toTS,
            "data": data} );
        }
      }
    );
  });


// end of module
};
