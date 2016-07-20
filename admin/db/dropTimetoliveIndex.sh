#!/bin/bash
# Program: dropTimetoliveIndex.sh
# Purpose: add time to live index so that MongoDB can auto-purge old data (> 3 months)
# Author:  Ray Lai
# Updated: Jul 20, 2016
# Example: ./dropTimetoliveIndex.sh myusername mypassword
# Remark:  running this script will auto purge old records after 6 months (15552000 seconds)
#
if [ $# -eq 0 ]; then
  echo "Syntax: dropTimetoliveIndex.sh <MongoDB username> <MongoDB password>"
  echo 
  echo "- this tool removes index to auto-purge old data (> 3 months)"
else
  MONGOADMINDB=admin
  DUMPDIR=/mnt/data/tmp/databaseDump
  DBHOST=data01.audacy.space
  DBPORT=11001
  
  mongo -u $1 -p $2 --authenticationDatabase $MONGOADMINDB --host $DBHOST --port $DBPORT << leftcurlybracket
  use telemetry
  db.attitude.dropIndex("autoPurge");
  db.position.dropIndex("autoPurge");
  db.vehicle.dropIndex("autoPurge");
  db.orbit.dropIndex("autoPurge");
  exit
leftcurlybracket
fi
