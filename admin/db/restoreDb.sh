#!/bin/bash
# Program: restoreDb.sh
# Purpose: restore to remote db
# Author:  Ray Lai
# Updated: Jun 28, 2016
# Example: mongorestore -u ray -p race2space --authenticationDatabase admin --host data04.audacy.space --port 3102 --db telemetry2 --gzip
#
MONGOADMINDB=admin
DUMPDIR=/mnt/data/tmp/databaseDump
DBHOST=data04.audacy.space
DBPORT=3102
MONGODB=telemetry2

if [ $# -eq 0 ]; then
  echo "Syntax: restoreDb.sh <MongoDB username> <MongoDB password>"
  echo
  echo "- this tool intends to restore entire MongoDB database to remote host as per data retention policy"
else
  mongorestore -u $1 -p $2 --authenticationDatabase $MONGOADMINDB --host $DBHOST --port $DBPORT --db $MONGODB --gzip $DUMPDIR
fi
