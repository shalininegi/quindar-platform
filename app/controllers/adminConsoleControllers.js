// Program: adminConsoleController.js
// Purpose: AngularJS controller for quindar platform admin console
// Author:  Ray Lai
// Updated: Jun 10, 2016
// License: MIT license

var app = angular.module("app", ['ui.bootstrap', 'ui.router']);

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
  .state("dataInspector", {
      url: "/dataInspector",
      views: {
        "dataInspector": {
           templateUrl: "app/views/dataInspector.html"
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
}]);


// controller: adminConsoleController 
app.controller('adminConsoleController', ['$scope', '$timeout', 'adminFactory', '$http',
  function($scope, $timeout, adminFactory, $http) {

  $scope.statusStreaming = "";
  $scope.statusMQ = "";
  $scope.statusDatabase = "";
  $scope.generatedDataStreaming = "";
  $scope.generatedDataMQ = "";
  $scope.generatedDataDatabase = "";
  $scope.attitudeDataSet = [];
  $scope.positionDataSet = [];
  $scope.vehicleDataSet = [];
  $scope.orbitDataSet = [];
  $scope.yourVehicleId = "IBEX";
  $scope.yourNItems = 1;
  $scope.sortType = "";
  $scope.sortReverse = true;
  $scope.searchCriteria = "";

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
    };
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

  $scope.writeToMQ = function() {
    return adminFactory.writeToMQ();
  };

  // ------ Category: Database ----------
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

}]);
