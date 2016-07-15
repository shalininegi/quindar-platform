#!/bin/bash
# Program: generateAttitudeSeedData.sh
# Purpose: create seed data
# Author:  Ray Lai
# Updated: Jul 6, 2016
#
MONGOADMINDB=admin
DBHOST=data01.audacy.space
DBPORT=11001
MONGODB=telemetry

if [ $# -eq 0 ]; then
  echo "Syntax: generateAttitudeSeedData.sh <MongoDB username> <MongoDB password>"
  echo
  echo "- this tool intends to generate seed data for testing"
else
  echo "MongoDB Housekeeping - generate seed data: attitude"
  echo "Start: " `date`

  mongo -u $1 -p $2 --authenticationDatabase $MONGOADMINDB --host $DBHOST --port $DBPORT << leftcurlybracket
  use telemetry
  print("current #: " + db.attitude.find().count());
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
  vehicleId="IBEX"
  nTimes=5000  
  for (var i=1; i < nTimes; i++) {   db.attitude.insert({ "timestamp": 1467110921 + i, "vehicleId": vehicleId, "q1": _rand()*100, "q2": _rand()*100, "q3": _rand()*100, "q4": _rand()*100, "createdAt": new Date()}) }
  print("after add, current #: " + db.attitude.find().count());
  exit
leftcurlybracket

  echo "End:  " `date`

fi
