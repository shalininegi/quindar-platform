#!/bin/bash
# Program: archiveDb.sh
# Purpose: dump db collection, copy to shared folder
# Author:  Ray Lai
# Updated: Jun 28, 2016
# Example: mongodump -u ray -p race2space --authenticationDatabase admin --host data01.audacy.space --port 11001 --db telemetry -o=/mnt/data/tmp/databaseDump
#
MONGOADMINDB=admin
DUMPDIR=/mnt/data/tmp/databaseDump
DBHOST=data01.audacy.space
DBPORT=11001
MONGODB=telemetry

if [ $# -eq 0 ]; then
  echo "Syntax: archiveDb.sh <MongoDB username> <MongoDB password>"
  echo
  echo "- this tool intends to archive entire MongoDB database as per data retention policy"
else
  mongodump -u $1 -p $2 --authenticationDatabase $MONGOADMINDB --host $DBHOST --port $DBPORT --db $MONGODB --gzip -o=$DUMPDIR
fi
