#!/bin/bash
# Program: timetoliveIndex.sh
# Purpose: add time to live index so that MongoDB can auto-purge old data (> 3 months)
# Author:  Ray Lai
# Updated: Jul 20, 2016
# Example: ./timetoliveIndex.sh myusername mypassword
# Remark:  running this script will auto purge old records after 6 months (15552000 seconds)
#
if [ $# -eq 0 ]; then
  echo "Syntax: timetoliveIndex.sh <MongoDB username> <MongoDB password>"
  echo 
  echo "- this tool creates and updates index to auto-purge old data (> 3 months)"
else
  MONGOADMINDB=admin
  DUMPDIR=/mnt/data/tmp/databaseDump
  DBHOST=data01.audacy.space
  DBPORT=11001
  mongo -u $1 -p $2 --authenticationDatabase $MONGOADMINDB --host $DBHOST --port $DBPORT << leftcurlybracket
  use telemetry
  db.attitude.dropIndex("autoPurge");
  db.attitude.createIndex({ "createdAt": 1 }, { background: true, name: "autoPurge", expireAfterSeconds: 15552000 });
  db.position.dropIndex("autoPurge");
  db.position.createIndex({ "createdAt": 1 }, { background: true, name: "autoPurge", expireAfterSeconds: 15552000 });
  db.vehicle.dropIndex("autoPurge");
  db.vehicle.createIndex({ "createdAt": 1 }, { background: true, name: "autoPurge", expireAfterSeconds: 15552000 });
  db.orbit.dropIndex("autoPurge");
  db.orbit.createIndex({ "createdAt": 1 }, { background: true, name: "autoPurge", expireAfterSeconds: 15552000 });
  exit
leftcurlybracket
fi
