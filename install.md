# Installation Guide
Updated: May 25, 2016

# Overview
To install quindar-platform:
* Git clone the platform project from Github, e.g. git clone https://github.com/audacyDevOps/quindar-platform
* Install NodeJS dependencies - use buildme.sh to create a /log subfolder for logging, and to install npm packages
* Create SSL keys and self-signed certificates for NodeJS with HTTPS - use buildssl.sh to create keys under /keys
* Start NodeJS server, e.g. node server.js

# Verify installation
* Open your web browser, and enter http://your-host-name:port/verifyMe
e.g. http://platform.audacy.space:7902/verifyMe

This should tell you quindar platform is alive.

# Discovering Quindar platform REST API
* Open your web browser, and enter http://your-host-name:port/api to list the REST APIs available
e.g. http://platform.audacy.space:7902/api
* There are 3 groups of REST API
  * Read telemetry data, e.g. GET /services/v1/attitude
  * Write telemetry data, e.g. POST /services/v1/position
  * Telemetry simulator (write to MessageQueue), e.g. POST /services/v1/simulation/vehicle/audacy.telemetry.vehicle

# Telemetry simulator admin console
The admin console allows users to generate test data for telemetry simulation.
To start the admin console, enter the URL http://your-host-name:port, e.g. http://platform.audacy.space:7902


