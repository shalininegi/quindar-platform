// Program: module03.js 
// Previous: upsertapi2.js
// Purpose: Data API to write telemetry data into MongoDB
// Author:  Ray Lai
// Updated: May 26, 2016
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
      dataList.push(positionData);
    };

    var counter = 0;
    async.eachLimit(dataList, 5, function(item, callback) {
      positionData = new Position(item);
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
    for (var i=0; i < nTimes; i++) {
      orbitData = new Orbit(helper.getOrbit(Math.random() * 0.2, Math.random() * 0.3, nTimes));
      dataList.push(orbitData);
    };

    var counter = 0;
    async.eachLimit(dataList, 5, function(item, callback) {
      orbitData = new Orbit(item);
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

// end of module
};
