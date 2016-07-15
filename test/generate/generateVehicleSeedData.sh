#!/bin/bash
# Program: generateVehicleSeedData.sh
# Purpose: create seed data
# Author:  Ray Lai
# Updated: Jul 6, 2016
#
MONGOADMINDB=admin
DBHOST=data01.audacy.space
DBPORT=11001
MONGODB=telemetry

if [ $# -eq 0 ]; then
  echo "Syntax: generateVehicleSeedData.sh <MongoDB username> <MongoDB password>"
  echo
  echo "- this tool intends to generate seed data for testing"
else
  echo "MongoDB Housekeeping - generate seed data: vehicle"
  echo "Start: " `date`

  mongo -u $1 -p $2 --authenticationDatabase $MONGOADMINDB --host $DBHOST --port $DBPORT << leftcurlybracket
  use telemetry
  print("current #: " + db.vehicle.find().count());
  function randomString() { 
        var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz"; 
        var randomstring = ''; 
        var string_length = 6;
        for (var i=0; i<string_length; i++) { 
                var rnum = Math.floor(Math.random() * chars.length); 
                randomstring += chars.substring(rnum,rnum+1); 
        } 
        return randomstring; 
  }
  nTimes=5000  
  for (var i=1; i < nTimes; i++) {   db.vehicle.insert({ "timestamp": 1467869306 + i, "vehicleId": "Skylon-" + randomString(), "calibrationFactor": _rand(), "warnLow": _rand()*100, "warnHigh": _rand()*100, "alertLow": _rand()*100, "alertHigh": _rand()*100, "uom":"Kevin", "value":_rand()*700, "createdAt": new Date()}) }
  print("after add, current #: " + db.vehicle.find().count());
  exit
leftcurlybracket

  echo "End:  " `date`

fi
