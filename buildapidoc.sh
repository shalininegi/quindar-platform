#!/bin/bash
echo "Building REST API documentation for Quindar platform"
if [ -d "api" ]; then
   echo "...cleaning up /api subfolder"
   rm -fr api
else
   echo "...creating /api subfolder"
   mkdir api
fi
echo "...generating API documentation for *.js"
apidoc -o api -f ".*\\.js$" -i app/scripts
echo "...complete"
