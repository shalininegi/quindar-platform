#!/bin/bash
# Program: timetoliveIndex.sh
# Purpose: add time to live index so that MongoDB can auto-purge old data (> 3 months)
# Author:  Ray Lai
# Updated: Jun 30, 2016
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
  use telemetry0
  db.postion.dropIndex("autoPurge");
  db.position.createIndex({ "createdAt": 1 }, { background: true, name: "autoPurge", expireAfterSeconds: 5 });
  exit
leftcurlybracket
fi
