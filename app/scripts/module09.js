// Program: module09.js 
// Purpose: Data analytics API to calculate usage metrics by vehicleId or by customers
// Author:  Ray Lai
// Updated: Jun 14, 2016
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


// end of module
};
