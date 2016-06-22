// Program: adminConsoleController.js
// Purpose: AngularJS controller for quindar platform admin console
// Author:  Ray Lai
// Updated: Jun 10, 2016
// License: MIT license

var app = angular.module("app", ['ui.bootstrap', 'ui.router', 'nvd3']);

// ui.router definitions
 app.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise("/dataGenerator");

  $stateProvider
  .state("dataGenerator", {
      url: "/dataGenerator",
      views: {
         "dataGenerator" : {
           templateUrl: "app/views/dataGenerator.html"
         }
      },
      controller: 'adminConsoleController'
  })
  .state("dataMetrics", {
      url: "/dataMetrics",
      views: {
        "dataMetrics": {
           templateUrl: "app/views/dataMetrics.html"
         }
      },
      controller: 'adminConsoleController'
  })
  .state("dataBrowser", {
      url: "/dataBrowser",
      views: {
        "dataBrowser": {
           templateUrl: "app/views/dataBrowser.html"
         }
      },
      controller: 'adminConsoleController'
  })  
  .state("dataCleanup", {
      url: "/dataCleanup",
      views: {
        "dataCleanup": {
           templateUrl: "app/views/dataCleanup.html"
         }
      },
      controller: 'adminConsoleController'
  })  
}]);


// controller: adminConsoleController 
app.controller('adminConsoleController', ['$scope', '$timeout', 'adminFactory', '$http',
  function($scope, $timeout, adminFactory, $http) {

  // common $scope variables and data
  $scope.statusStreaming = "";
  $scope.statusMQ = "";
  $scope.statusDatabase = "";
  $scope.statusDbCleanUp = "";
  $scope.generatedDataStreaming = "";
  $scope.generatedDataMQ = "";
  $scope.generatedDataDatabase = "";
  $scope.topicMQ = "audacy.telemetry.attitude";
  $scope.nItemsGenerated = 1;

  $scope.attitudeDataSet = [];
  $scope.positionDataSet = [];
  $scope.vehicleDataSet = [];
  $scope.orbitDataSet = [];
  $scope.yourVehicleId = "IBEX";
  $scope.yourNItems = 1;
  $scope.sortType = "";
  $scope.sortReverse = true;
  $scope.searchCriteria = "";
  // analytics
  $scope.totalNumberMessagesAttitude = 0;
  $scope.totalNumberMessagesPosition = 0;
  $scope.totalNumberMessagesVehicle = 0;
  $scope.totalNumberMessagesOrbit = 0;

  // this section uses angular-nvd3 d3 directive to report # messages for each data type
  $scope.optionX = { 
    chart: {
        type: 'lineChart',
        height: 450,
        margin : {
            top: 20,
            right: 20,
            bottom: 60,
            left: 105 // 55
        },
        x: function(d){ return d.x; },
        y: function(d){ return d.y; },
        showValues: true,
        valueFormat: function(d){
            return d3.format(',.4f')(d);
        },
        transitionDuration: 500,
        xAxis: {
            axisLabel: '# Past Days'
        },
        yAxis: {
            axisLabel: '# Messages',
            axisLabelDistance: 10
        }
    }
  };

  $scope.getAttitudeMetricsTrend = function() {
    adminFactory.getMetricsTrendTotalAll('attitude') 
    .success(function(data, status) {
      var tmpValues = [];
      $scope.attitudeDataSetX = data.trend;
      for (var i = 0; i < $scope.attitudeDataSetX.length; i++) {
         tmpValues.push({ x: i, y: $scope.attitudeDataSetX[i].subtotal });
      };
      $scope.dataAttitudeTrend = [ { key: "Attitude Telemetry", values:  tmpValues }];
      console.log("getAttitudeMetricsTrend() status=" + status + "   $scope.data=" + JSON.stringify($scope.data));
    })
    .error(function(err) {
      console.error('Sorry, Quindar platform cannot serve getAttitudeMetricsTrend() immediately. Please retry later.');
    });
  };

  $scope.getPositionMetricsTrend = function() {
    adminFactory.getMetricsTrendTotalAll('position') 
    .success(function(data, status) {
      var tmpValues = [];
      $scope.positionDataSetX = data.trend;
      for (var i = 0; i < $scope.positionDataSetX.length; i++) {
         tmpValues.push({ x: i, y: $scope.positionDataSetX[i].subtotal });
      };
      $scope.dataPositionTrend = [ { key: "Position Telemetry", values:  tmpValues }];
      console.log("getPositionMetricsTrend() status=" + status + "   $scope.data=" + JSON.stringify($scope.data));
    })
    .error(function(err) {
      console.error('Sorry, Quindar platform cannot serve getPositionMetricsTrend() immediately. Please retry later.');
    });
  };

  $scope.getVehicleMetricsTrend = function() {
    adminFactory.getMetricsTrendTotalAll('vehicle') 
    .success(function(data, status) {
      var tmpValues = [];
      $scope.vehicleDataSetX = data.trend;
      for (var i = 0; i < $scope.vehicleDataSetX.length; i++) {
         tmpValues.push({ x: i, y: $scope.vehicleDataSetX[i].subtotal });
      };
      $scope.dataVehicleTrend = [ { key: "Vehicle Telemetry", values:  tmpValues }];
      console.log("getVehicleMetricsTrend() status=" + status + "   $scope.data=" + JSON.stringify($scope.data));
    })
    .error(function(err) {
      console.error('Sorry, Quindar platform cannot serve getVehicleMetricsTrend() immediately. Please retry later.');
    });
  };

  $scope.getOrbitMetricsTrend = function() {
    adminFactory.getMetricsTrendTotalAll('orbit') 
    .success(function(data, status) {
      var tmpValues = [];
      $scope.orbitDataSetX = data.trend;
      for (var i = 0; i < $scope.orbitDataSetX.length; i++) {
         tmpValues.push({ x: i, y: $scope.orbitDataSetX[i].subtotal });
      };
      $scope.dataOrbitTrend = [ { key: "Orbit Telemetry", values:  tmpValues }];
      console.log("getOrbitMetricsTrend() status=" + status + "   $scope.data=" + JSON.stringify($scope.data));
    })
    .error(function(err) {
      console.error('Sorry, Quindar platform cannot serve getOrbitMetricsTrend() immediately. Please retry later.');
    });
  };

  // generate telemetry data as simulation, and send to webSocket server
  $scope.generateIt = function(payloadType) {
    var payload = {};
    var timestamp = new Date();

    if (payloadType === "attitude") {
      payload = $scope.generateAttitude();
      $scope.generatedDataStreaming = JSON.stringify(payload);
      $scope.statusStreaming = "Sent @" + timestamp;
      socket.emit('attitude', {"type": "attitude", "subtype": payload.vehicleId,
        "data": JSON.stringify(payload) });
    } else if (payloadType === "position") {
      payload = $scope.generatePosition();
      $scope.generatedDataStreaming = JSON.stringify(payload);
      $scope.statusStreaming = "Sent @" + timestamp;
      socket.emit('position', {"type": "position", "subtype": payload.vehicleId,
        "data": JSON.stringify(payload) });
    } else if (payloadType === "vehicle") {
      payload = $scope.generateVehicle();
      $scope.generatedDataStreaming = JSON.stringify(payload);
      $scope.statusStreaming = "Sent @" + timestamp;
      socket.emit('vehicle', {"type": "vehicle", "subtype": payload.vehicleId,
        "data": JSON.stringify(payload) });
    } else if (payloadType === "orbit") {
      payload = $scope.generateOrbit();
      $scope.generatedDataStreaming = JSON.stringify(payload);
      $scope.statusStreaming = "Sent @" + timestamp;
      socket.emit('orbit', {"type": "orbit", "subtype": payload.vehicleId,
        "data": JSON.stringify(payload) });
    }
  };

  // generate telemetry data as simulation, and send to RabbitMQ
  $scope.queueIt = function(payloadType) {
    var payload = {};
    var timestamp = new Date();

    if (payloadType === "attitude") {
      //payload = $scope.generateAttitude();
      //$scope.generatedDataMQ = JSON.stringify(payload);
      
      $scope.generateSimulatedTelemetryMQ("attitude", $scope.topicMQ, $scope.nItemsGenerated);
      $scope.generatedDataMQ = JSON.stringify($scope.attitudeDataSet);
      $scope.statusMQ = "Sent @" + timestamp;
    } else if (payloadType === "position") {
      //payload = $scope.generatePosition();
      //$scope.generatedDataMQ = JSON.stringify(payload);
      
      $scope.generateSimulatedTelemetryMQ("position", $scope.topicMQ, $scope.nItemsGenerated);
      $scope.generatedDataMQ = JSON.stringify($scope.positionDataSet);
      $scope.statusMQ = "Sent @" + timestamp;
    } else if (payloadType === "vehicle") {
      //payload = $scope.generateVehicle();
      //$scope.generatedDataMQ = JSON.stringify(payload);
      
      $scope.generateSimulatedTelemetryMQ("vehicle", $scope.topicMQ, $scope.nItemsGenerated);
      $scope.generatedDataMQ = JSON.stringify($scope.vehicleDataSet);
      $scope.statusMQ = "Sent @" + timestamp;
    } else if (payloadType === "orbit") {
      //payload = $scope.generateOrbit();
      //$scope.generatedDataMQ = JSON.stringify(payload);

      $scope.generateSimulatedTelemetryMQ("orbit", $scope.topicMQ, $scope.nItemsGenerated);
      $scope.generatedDataMQ = JSON.stringify($scope.orbitDataSet);
      $scope.statusMQ = "Sent @" + timestamp;
    }
  };

   // generate telemetry data as simulation, and upsert into database
  $scope.dbIt = function(payloadType) {
    var payload = {};
    var timestamp = new Date();

    if (payloadType === "attitude") {
      //payload = $scope.generateAttitude();
      //$scope.generatedDataDatabase = JSON.stringify(payload);
      
      $scope.generateSimulatedTelemetry("attitude", $scope.nItemsGenerated);
      $scope.generatedDataDatabase = JSON.stringify($scope.attitudeDataSet);
      $scope.statusDatabase = "Sent @" + timestamp;
    } else if (payloadType === "position") {
      //payload = $scope.generatePosition();
      //$scope.generatedDataDatabase = JSON.stringify(payload);
      
      $scope.generateSimulatedTelemetry("position", $scope.nItemsGenerated);
      $scope.generatedDataDatabase = JSON.stringify($scope.positionDataSet);
      $scope.statusDatabase = "Sent @" + timestamp;
    } else if (payloadType === "vehicle") {
      //payload = $scope.generateVehicle();
      //$scope.generatedDataDatabase = JSON.stringify(payload);
      
      $scope.generateSimulatedTelemetry("vehicle", $scope.nItemsGenerated);
      $scope.generatedDataDatabase = JSON.stringify($scope.vehicleDataSet);
      $scope.statusDatabase = "Sent @" + timestamp;
    } else if (payloadType === "orbit") {
      //payload = $scope.generateOrbit();
      //$scope.generatedDataDatabase = JSON.stringify(payload);

      $scope.generateSimulatedTelemetry("orbit", $scope.nItemsGenerated);
      $scope.generatedDataDatabase = JSON.stringify($scope.orbitDataSet);
      $scope.statusDatabase = "Sent @" + timestamp;
    }
  };

  // generate telemetry data as simulation, and upsert into database
  $scope.dbCleanUp = function(payloadType) {
    var payload = {};
    var timestamp = new Date();

    if (payloadType === "attitude") {
      $scope.cleanupDBCollection("attitude");
      $scope.statusDbCleanUp = "Done @" + timestamp;
    } else if (payloadType === "position") {
      $scope.cleanupDBCollection("position");
      $scope.generatedDataDatabase = JSON.stringify($scope.positionDataSet);
      $scope.statusDbCleanUp = "Done @" + timestamp;
    } else if (payloadType === "vehicle") {
      $scope.cleanupDBCollection("vehicle");
      $scope.generatedDataDatabase = JSON.stringify($scope.vehicleDataSet);
      $scope.statusDbCleanUp = "Done @" + timestamp;
    } else if (payloadType === "orbit") {
      $scope.cleanupDBCollection("orbit");
      $scope.generatedDataDatabase = JSON.stringify($scope.orbitDataSet);
      $scope.statusDbCleanUp = "Done @" + timestamp;
    }
  };


  // clear screen and variables
  $scope.clearIt = function(deliveryMode) {
    if (deliveryMode === 'streaming') {
      $scope.generatedDataStreaming = "";
      $scope.statusStreaming = "";
    } else if (deliveryMode === 'messagequeue') {
      $scope.generatedDataMQ = "";
      $scope.statusMQ = "";
    } else if (deliveryMode === 'database') {
      $scope.generatedDataDatabase = "";
      $scope.statusDatabase = "";
    } else if (deliveryMode === 'dbCleanup') {
      $scope.statusDbCleanUp = "";
    }
  };

  $scope.getVehicleId = function() {
    return adminFactory.getVehicleId();
  };

  $scope.generateAttitude = function() {
    return adminFactory.generateAttitude();
  };
    
  $scope.generatePosition = function() {
    return adminFactory.generatePosition();
  };  

  $scope.generateVehicle = function() {
     return adminFactory.generateVehicle();
  }; 

  $scope.generateOrbit = function() {
      return adminFactory.generateOrbit();
  }; 

  // ------ Category: Database ----------
  // ------ read 
  // retrieve all attitude data
  $scope.getAttitudeAll = function() {
    adminFactory.getAttitudeAll()
    .success(function(data, status) {
      console.log("getAttitudeAll() status=" + status);
      $scope.attitudeDataSet = data.data;
    })
    .error(function(err) {
      console.error('Sorry, Quindar platform cannot serve getAttitudeAll() immediately. Please retry later.');
    });
  };

  // retrieve attitude data by vehicleId, limited by nItems rows
  $scope.getAttitudePartial = function(vehicleId, nItems) {
    adminFactory.getAttitudePartial(vehicleId, nItems)
    .success(function(data, status) {
      console.log("getAttitudePartial() status=" + status);
      $scope.attitudeDataSet = data.data;
    })
    .error(function(err) {
      console.error('Sorry, Quindar platform cannot serve getAttitudePartial() immediately. Please retry later.');
    });
  };

  // retrieve attitude data by vehicleId within a time period fromTS to toTS
  $scope.getAttitudeFromTo = function(vehicleId, fromTS, toTS) {
    adminFactory.getAttitudeFromTo(vehicleId, fromTS, toTS)
    .success(function(data, status) {
      console.log("getAttitudeFromTo() status=" + status);
      $scope.attitudeDataSet = data.data;
    })
    .error(function(err) {
      console.error('Sorry, Quindar platform cannot serve getAttitudeFromTo() immediately. Please retry later.');
    });
  };

  // retrieve all position data
  $scope.getPositionAll = function() {   
    adminFactory.getPositionAll()
    .success(function(data, status) {
      console.log("getPositionAll() status=" + status);
      $scope.positionDataSet = data.data;
    })
    .error(function(err) {
      console.error('Sorry, Quindar platform cannot serve getPositionAll() immediately. Please retry later.');
    });
  };

  // retrieve position data by vehicleId, limited by nItems rows
  $scope.getPositionPartial = function(vehicleId, nItems) {
    adminFactory.getPositionPartial(vehicleId, nItems)
    .success(function(data, status) {
      console.log("getPositionPartial() status=" + status);
      $scope.positionDataSet = data.data;
    })
    .error(function(err) {
      console.error('Sorry, Quindar platform cannot serve getPositionPartial() immediately. Please retry later.');
    });
  };

  // retrieve position data by vehicleId within a time period fromTS to toTS
  $scope.getPositionFromTo = function(vehicleId, fromTS, toTS) {
    adminFactory.getPositionFromTo(vehicleId, fromTS, toTS)
    .success(function(data, status) {
      console.log("getPositionFromTo() status=" + status);
      $scope.positionDataSet = data.data;
    })
    .error(function(err) {
      console.error('Sorry, Quindar platform cannot serve getPositionFromTo() immediately. Please retry later.');
    });
  };

  // retrieve all vehicle data
  $scope.getVehicleAll = function() {
    adminFactory.getVehicleAll()
    .success(function(data, status) {
      console.log("getVehicleAll() status=" + status);
      $scope.vehicleDataSet = data.data;
    })
    .error(function(err) {
      console.error('Sorry, Quindar platform cannot serve getVehicleAll() immediately. Please retry later.');
    });
  };

  // retrieve vehicle data by vehicleId, limited by nItems rows
  $scope.getVehiclePartial = function(vehicleId, nItems) {
    adminFactory.getVehiclePartial(vehicleId, nItems)
    .success(function(data, status) {
      console.log("getVehiclePartial() status=" + status);
      $scope.vehicleDataSet = data.data;
    })
    .error(function(err) {
      console.error('Sorry, Quindar platform cannot serve getVehiclePartial() immediately. Please retry later.');
    });
  };

  // retrieve vehicle data by vehicleId within a time period fromTS to toTS
  $scope.getVehicleFromTo = function(vehicleId, fromTS, toTS) {
    adminFactory.getVehicleFromTo(vehicleId, fromTS, toTS)
    .success(function(data, status) {
      console.log("getVehicleFromTo() status=" + status);
      $scope.vehicleDataSet = data.data;
    })
    .error(function(err) {
      console.error('Sorry, Quindar platform cannot serve getVehicleFromTo() immediately. Please retry later.');
    });
  };

  // retrieve all orbit trajectory data
  $scope.getOrbitAll = function() {
    adminFactory.getOrbitAll()
    .success(function(data, status) {
      console.log("getOrbitAll() status=" + status);
      $scope.orbitDataSet = data.data;
    })
    .error(function(err) {
      console.error('Sorry, Quindar platform cannot serve getOrbitAll() immediately. Please retry later.');
    });
  };

  // retrieve orbit trajectory data by vehicleId, limited by nItems rows
  $scope.getOrbitPartial = function(vehicleId, nItems) {
    adminFactory.getOrbitPartial(vehicleId, nItems)
    .success(function(data, status) {
      console.log("getOrbitPartial() status=" + status);
      $scope.orbitDataSet = data.data;
    })
    .error(function(err) {
      console.error('Sorry, Quindar platform cannot serve getOrbitPartial() immediately. Please retry later.');
    });
  };

  // retrieve orbit trajectory data by vehicleId within a time period fromTS to toTS
  $scope.getOrbitFromTo = function(vehicleId, fromTS, toTS) {
    adminFactory.getOrbitFromTo(vehicleId, fromTS, toTS)
    .success(function(data, status) {
      console.log("getOrbitFromTo() status=" + status);
      $scope.orbitDataSet = data.data;
    })
    .error(function(err) {
      console.error('Sorry, Quindar platform cannot serve getOrbitFromTo() immediately. Please retry later.');
    });
  };

  // ------- update
  // upsert attitude data 
  $scope.postAttitude = function(vehicleId, q1, q2, q3, q4) {
    adminFactory.postAttitude(vehicleId, q1, q2, q3, q4)
    .success(function(data, status) {
      console.log("postAttitude() status=" + status);
      $scope.attitudeDataSet = data.data;
    })
    .error(function(err) {
      console.error('Sorry, Quindar platform cannot serve postAttitude() immediately. Please retry later.');
    });
  };

  // upsert position data 
  $scope.postPosition = function(vehicleId, x, y, z, vx, vy, vz) {
    adminFactory.postPosition(vehicleId, x, y, z, vx, vy, vz)
    .success(function(data, status) {
      console.log("postPosition() status=" + status);
      $scope.positionDataSet = data.data;
    })
    .error(function(err) {
      console.error('Sorry, Quindar platform cannot serve postPosition() immediately. Please retry later.');
    });
  };

  // upsert vehicle data 
  $scope.postVehicle = function(vehicleId, deviceId, value, uom, alertHigh, warnHigh, 
    alertLow, warnLow, calibrationFactor) {
    adminFactory.postVehicle(vehicleId, deviceId, value, uom, alertHigh, warnHigh, 
      alertLow, warnLow, calibrationFactor)
    .success(function(data, status) {
      console.log("postVehicle() status=" + status);
      $scope.vehicleDataSet = data.data;
    })
    .error(function(err) {
      console.error('Sorry, Quindar platform cannot serve postVehicle() immediately. Please retry later.');
    });
  };
  
  // upsert orbit data 
  $scope.postOrbit = function(vehicleId, trajectory) {
    adminFactory.postOrbit(vehicleId, trajectory)
    .success(function(data, status) {
      console.log("postOrbit() status=" + status);
      $scope.orbitDataSet = data.data;
    })
    .error(function(err) {
      console.error('Sorry, Quindar platform cannot serve postOrbit() immediately. Please retry later.');
    });
  };

  // ------ simulation: random generator
  // generate simulated data point @ nItems
  $scope.generateSimulatedTelemetry = function(telemetryDataType, nTimes) {
    if (telemetryDataType === 'attitude') {
      adminFactory.generateAttitudeSimulated(nTimes)
      .success(function(data, status) {
        console.log("generateAttitudeSimulated() status=" + status);
        $scope.attitudeDataSet = data.data;
      })
      .error(function(err) {
        console.error('Sorry, Quindar platform cannot serve generateAttitudeSimulated() immediately. Please retry later.');
      });
    } else if (telemetryDataType === 'position') {
      adminFactory.generatePositionSimulated(nTimes)
      .success(function(data, status) {
        console.log("generatePositionSimulated() status=" + status);
        $scope.positionDataSet = data.data;
      })
      .error(function(err) {
        console.error('Sorry, Quindar platform cannot serve generatePositionSimulated() immediately. Please retry later.');
      });
    } else if (telemetryDataType === 'vehicle') {
      adminFactory.generateVehicleSimulated(nTimes)
      .success(function(data, status) {
        console.log("generateVehicleSimulated() status=" + status);
        $scope.vehicleDataSet = data.data;
      })
      .error(function(err) {
        console.error('Sorry, Quindar platform cannot serve generateVehicleSimulated() immediately. Please retry later.');
      });
    } else if (telemetryDataType === 'orbit') {
      adminFactory.generateOrbitSimulated(nTimes)
      .success(function(data, status) {
        console.log("generateOrbitSimulated() status=" + status);
        $scope.orbitDataSet = data.data;
      })
      .error(function(err) {
        console.error('Sorry, Quindar platform cannot serve generateOrbitSimulated() immediately. Please retry later.');
      });
    } else {
      console.error('Sorry, Quindar platform cannot serve generateSimulatedTelemetry() immediately. Please retry later.');
    };
  };

  // ----- RabbitMQ (simulation)
  // generate simulated data point @ nItems via RabbitMQ
  $scope.generateSimulatedTelemetryMQ = function(telemetryDataType, topic, nTimes) {
    if (telemetryDataType === 'attitude') {
      adminFactory.generateAttitudeSimulatedMQ(topic, nTimes)
      .success(function(data, status) {
        console.log("generateAttitudeSimulatedMQ() status=" + status);
        $scope.attitudeDataSet = data.data;
      })
      .error(function(err) {
        console.error('Sorry, Quindar platform cannot serve generateAttitudeSimulatedMQ() immediately. Please retry later.');
      });
    } else if (telemetryDataType === 'position') {
      adminFactory.generatePositionSimulatedMQ(topic, nTimes)
      .success(function(data, status) {
        console.log("generatePositionSimulatedMQ() status=" + status);
        $scope.positionDataSet = data.data;
      })
      .error(function(err) {
        console.error('Sorry, Quindar platform cannot serve generatePositionSimulatedMQ() immediately. Please retry later.');
      });
    } else if (telemetryDataType === 'vehicle') {
      adminFactory.generateVehicleSimulatedMQ(topic, nTimes)
      .success(function(data, status) {
        console.log("generateVehicleSimulatedMQ() status=" + status);
        $scope.vehicleDataSet = data.data;
      })
      .error(function(err) {
        console.error('Sorry, Quindar platform cannot serve generateVehicleSimulatedMQ() immediately. Please retry later.');
      });
    } else if (telemetryDataType === 'orbit') {
      adminFactory.generateOrbitSimulatedMQ(topic, nTimes)
      .success(function(data, status) {
        console.log("generateOrbitSimulatedMQ() status=" + status);
        $scope.orbitDataSet = data.data;
      })
      .error(function(err) {
        console.error('Sorry, Quindar platform cannot serve generateOrbitSimulatedMQ() immediately. Please retry later.');
      });
    } else {
      console.error('Sorry, Quindar platform cannot serve generateSimulatedTelemetry() immediately. Please retry later.');
    };
  };

  // upsert attitude data to RabbitMQ
  $scope.postAttitudeMQ = function(topic, vehicleId, q1, q2, q3, q4) {
    adminFactory.postAttitudeMQ(topic, vehicleId, q1, q2, q3, q4)
    .success(function(data, status) {
      console.log("postAttitudeMQ() status=" + status);
      $scope.attitudeDataSet = data.data;
    })
    .error(function(err) {
      console.error('Sorry, Quindar platform cannot serve postAttitudeMQ() immediately. Please retry later.');
    });
  };

  // upsert position data to RabbitMQ
  $scope.postPositionMQ = function(topic, vehicleId, x, y, z, vx, vy, vz) {
    adminFactory.postPositionMQ(topic, vehicleId, x, y, z, vx, vy, vz)
    .success(function(data, status) {
      console.log("postPositionMQ() status=" + status);
      $scope.positionDataSet = data.data;
    })
    .error(function(err) {
      console.error('Sorry, Quindar platform cannot serve postPositionMQ() immediately. Please retry later.');
    });
  };

  // upsert vehicle data to RabbitMQ
  $scope.postVehicleMQ = function(topic, vehicleId, deviceId, value, uom, alertHigh, warnHigh, 
    alertLow, warnLow, calibrationFactor) {
    adminFactory.postVehicleMQ(topic, vehicleId, deviceId, value, uom, alertHigh, warnHigh, 
      alertLow, warnLow, calibrationFactor)
    .success(function(data, status) {
      console.log("postVehicleMQ() status=" + status);
      $scope.vehicleDataSet = data.data;
    })
    .error(function(err) {
      console.error('Sorry, Quindar platform cannot serve postVehicleMQ() immediately. Please retry later.');
    });
  };
  
  // upsert orbit data to RabbitMQ
  $scope.postOrbitMQ = function(topic, vehicleId, trajectory) {
    adminFactory.postOrbitMQ(topic, vehicleId, trajectory)
    .success(function(data, status) {
      console.log("postOrbitMQ() status=" + status);
      $scope.orbitDataSet = data.data;
    })
    .error(function(err) {
      console.error('Sorry, Quindar platform cannot serve postOrbitMQ() immediately. Please retry later.');
    });
  };

  // --- database admin and maintenance
  // clean up database collections
  // collectionName values allowed:  attitude, position, vehicle, orbit
  $scope.cleanupDBCollection = function(collectionName) {
    adminFactory.cleanupDBCollection(collectionName)
    .success(function(data, status) {
      console.log("cleanupDBCollection() is completed. status=" + status);
    })
    .error(function(err) {
      console.error('Sorry, Quindar platform cannot serve cleanupDBCollection() immediately. Please retry later.');
    });
  };

  // --- data analytics
  // get metrics total by telemetry data types (e.g. attitude, position, vehicle)
  // valid telemetryDataType value: attitude, position, vehicle, orbit
  $scope.getMetricsTotalAll = function(telemetryDataType) {
    adminFactory.getMetricsTotalAll(telemetryDataType)
    .success(function(data, status) {
      console.log("getMetricsTotalAll() status=" + status);
      $scope.totalNumberMessagesAttitude = data.data;
    })
    .error(function(err) {
      console.error('Sorry, Quindar platform cannot serve getMetricsTotalAll() immediately. Please retry later.');
    });
  };

  // get metrics total by telemetry data types (e.g. attitude, position, vehicle) by vehicleId
  // valid telemetryDataType value: attitude, position, vehicle, orbit
  $scope.getMetricsAttitudeTotalByVehicle = function(telemetryDataType, vehicleId) {
    adminFactory.getMetricsAttitudeTotalByVehicle(telemetryDataType, vehicleId)
    .success(function(data, status) {
      console.log("getMetricsAttitudeTotalByVehicle() status=" + status);
    })
    .error(function(err) {
      console.error('Sorry, Quindar platform cannot serve getMetricsAttitudeTotalByVehicle() immediately. Please retry later.');
    });
  };

  // get metrics total by telemetry data types (e.g. attitude, position, vehicle) by vehicleId from/to timestamp
  // valid telemetryDataType value: attitude, position, vehicle, orbit
  $scope.getMetricsAttitudeTotalByVehicleTimestamp = function(telemetryDataType, vehicleId,
      fromTS, toTS) {
    adminFactory.getMetricsAttitudeTotalByVehicleTimestamp(telemetryDataType, vehicleId,
      fromTS, toTS)
    .success(function(data, status) {
      console.log("getMetricsAttitudeTotalByVehicleTimestamp() status=" + status);
    })
    .error(function(err) {
      console.error('Sorry, Quindar platform cannot serve getMetricsAttitudeTotalByVehicleTimestamp() immediately. Please retry later.');
    });
  };

  // get metrics trend by telemetry data types (e.g. attitude, position, vehicle)
  // valid telemetryDataType value: attitude, position, vehicle, orbit
  $scope.getMetricsTrendTotalAll = function(telemetryDataType) {
    adminFactory.getMetricsTrendTotalAll(telemetryDataType)
    .success(function(data, status) {
      console.log("getMetricsTrendTotalAll() status=" + status);
    })
    .error(function(err) {
      console.error('Sorry, Quindar platform cannot serve getMetricsTrendTotalAll() immediately. Please retry later.');
    });
  };

  // get metrics trend by telemetry data types (e.g. attitude, position, vehicle) by vehicleId
  // valid telemetryDataType value: attitude, position, vehicle, orbit
  $scope.getMetricsTrendTotalByVehicle = function(telemetryDataType, vehicleId) {
    adminFactory.getMetricsTrendTotalByVehicle(telemetryDataType, vehicleId)
    .success(function(data, status) {
      console.log("getMetricsTrendTotalByVehicle() status=" + status);
    })
    .error(function(err) {
      console.error('Sorry, Quindar platform cannot serve getMetricsTrendTotalByVehicle() immediately. Please retry later.');
    });
  };

// end adminConsoleController
}]);
