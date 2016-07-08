// Program: module02.js 
// Previous: dataApi3.js
// Purpose: Data API to read telemetry data
// Author:  Ray Lai
// Updated: May 24, 2016
// License: MIT license
//
// Developer notes:
// - apidoc is for API doc auto-generation
// - all database schemas are stored under /app/models
// - common database handlers (e.g. db.on() on top), no need to connect or disconnect in each app.get/app.post
// - add http headers for CORS (cross-domain origin)
//
// Gaps
// - logging - morgan will take all console.log
// - error handling - need to customize error page, e.g. if (err) res.render('error', ...)
//
module.exports = function(app, mongoose, syslogger, logger) {
  var systemSettings = require('../../config/systemSettings.js');
  mongoose.connect(systemSettings.dbUrl, systemSettings.dbOptions); 
  var db = mongoose.connection;

  var maxRecords = systemSettings.maxRecords;
  var Attitude = require('../models/attitude.js');
  var Position = require('../models/position.js');
  var Vehicle  = require('../models/vehicle.js');
  var Orbit  = require('../models/orbit.js');
  
  // common database handlers
  db.on('connected', function (err) {
    console.log('MongoDB connected - telemetryRead.js (read-only REST API)');
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
        res.status(500).send({"message": "Internal system error encountered", "type":"internal"});
        console.log(err);
      } else {
        res.status(200);
        res.json( {"status": 200, "message": "retrieve all attitude data points", "data": data} );
      }
    }).limit(maxRecords);
  });

  /**
  * @api {get} /services/v1/attitude/:vehicleId/:numberOfItems  attitude by vehicleId/numberOfItems
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
          res.status(400).send({"message": "Invalid input parameter or option", "type":"client"});
          console.log(err);
        } else {
            res.status(200);
            res.json( {"status": 200, "message": "retrieve all attitude data points", "data": data} );
        }
      });
    });

 /**
  * @api {get} /services/v1/attitude/:vehicleId/:fromTime/:toTime attitude by vehicleId/from/to
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
          res.status(400).send({"message": "Invalid input parameter or option", "type":"client"});
          console.log(err);
        } else {
          res.status(200);
          res.json( {"status": 200, "message": "retrieve all attitude data points", "data": data} );
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
        res.status(500).send({"message": "Internal system error encountered", "type":"internal"});
        console.log(err);
      } else {
         res.status(200);
         res.json( {"status": 200, "message": "retrieve all position data points", "data": data} );
      
      }
    });
  })

/**
  * @api {get} /services/v1/position/:vehicleId/:numberOfItems  position by vehicleId/numberOfItems
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
          res.status(400).send({"message": "Invalid input parameter or option", "type":"client"});
          console.log(err);
        } else {
          res.status(200);
          res.json( {"status": 200, "message": "retrieve all position data points", "data": data} );
        }
      }
    );
  })

/**
  * @api {get} /services/v1/position/:vehicleId/:fromTime/:toTime  position by vehicleId/from/to
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
          res.status(400).send({"message": "Invalid input parameter or option", "type":"client"});
          console.log(err);
        } else {
          res.status(200);
          res.json( {"status": 200, "message": "retrieve all position data points", "data": data} );
        }
      }
    );
  })

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
        res.status(500).send({"message": "Internal system error encountered", "type":"internal"});
        console.log(err);
      } else {
        res.status(200);
        res.json( {"status": 200, "message": "retrieve all vehicle data points", "data": data} );
      }
    });
  })

/**
  * @api {get} /services/v1/vehicle/:vehicleId/:numberOfItems  vehicle by vehicleId/numberOfItems
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
          res.status(400).send({"message": "Invalid input parameter or option", "type":"client"});
          console.log(err);
        } else {
          res.status(200);
          res.json( {"status": 200, "message": "retrieve all vehicle data points", "data": data} );
        }
      }
    );
  })

/**
  * @api {get} /services/v1/vehicle/:vehicleId/:fromTime/:toTime  vehicle by vehicleId/from/to
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
          res.send(400).send({"message": "Invalid input parameter or option", "type":"client"});
          console.log(err);
        } else {
          res.status(200);
          res.json( {"status": 200, "message": "retrieve all vehicle data points", "data": data} );
        }
      }
    );
  })

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
      res.status(500).send({"message": "Internal system error encountered", "type":"internal"});
      console.log(err);
    } else {
      res.status(200);
      res.json( {"status": 200, "message": "retrieve all orbit data points", "data": data} );
    }
  }).sort({'timestamp': -1});
});

/**
  * @api {get} /services/v1/orbit/:vehicleId/:numberOfItems  orbit by vehicleId/numberOfItems
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
          res.status(400).send({"message": "Invalid input parameter or option", "type":"client"});
          console.log(err);
        } else {
          res.status(200);
          res.json( {"status": 200, "message": "retrieve all position data points", "data": data} );
        }
      }
    );
  })

/**
  * @api {get} /services/v1/orbit/:vehicleId/:numberOfItems  orbit by vehicleId/numberOfItems
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
          res.status(400).send({"message": "Invalid input parameter or option", "type":"client"});
          console.log(err);
        } else {
          res.status(200);
          res.json( {"status": 200, "message": "retrieve all orbit data points", "data": data} );
        }
      }
    );
  })

// end of module
};
