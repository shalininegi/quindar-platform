#!/bin/bash
echo "Building NodeJS dependencies for Quindar platform"
echo "...installing npm modules from package.json"
npm install -g

echo "...creating a sample config/.systemSettings.js"
cp config/systemSettings.js config/.systemSettings.js

echo "...preparing logging"
if [ -d "log" ]; then
   echo "...cleaning up /log subfolder"
   rm -fr log
else
   echo "...creating /log subfolder"
   mkdir log
fi
echo "...complete"
