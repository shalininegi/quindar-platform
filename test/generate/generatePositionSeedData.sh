#!/bin/bash
# Program: generatePositionSeedData.sh
# Purpose: create seed data
# Author:  Ray Lai
# Updated: Jul 6, 2016
#
MONGOADMINDB=admin
DBHOST=data01.audacy.space
DBPORT=11001
MONGODB=telemetry

if [ $# -eq 0 ]; then
  echo "Syntax: generatePositionSeedData.sh <MongoDB username> <MongoDB password>"
  echo
  echo "- this tool intends to generate seed data for testing"
else
  echo "MongoDB Housekeeping - generate seed data: position"
  echo "Start: " `date`

  mongo -u $1 -p $2 --authenticationDatabase $MONGOADMINDB --host $DBHOST --port $DBPORT << leftcurlybracket
  use telemetry
  print("current #: " + db.position.find().count());
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
  for (var i=1; i < nTimes; i++) {   db.position.insert({ "timestamp": 1467110923 + i, "vehicleId": "ISS-" + randomString(), "x": _rand()*100, "y": _rand()*100, "z": _rand()*100, "vx": _rand(), "vy": _rand(), "vz": _rand(), "createdAt": new Date()}) }
  print("after add, current #: " + db.position.find().count());
  exit
leftcurlybracket

  echo "End:  " `date`

fi
