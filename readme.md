# Quindar Platform
Updated: Jul 14, 2016

The Quindar-platform project is the backend module that generates test data for mission operations application (Quindar widgets) to consume. It adopts an API-centric architecture with the integration with WebSockets (for real time data streaming), RabbitMQ messaging (for reliable and resilient transaction handling) and distributed data management.

# Overview
The rapidly falling cost of launching a satellite has resulted in near exponential growth in the number of spacecraft being deployed and operated. Most often, each spacecraft owner / operator conducts Mission Operations using specialized software developed in house. Mission Operations centers can range in size from something as modest as a single laptop connected to a backyard radio antenna, to multiple rooms housing dozens of consoles each equipped with as many as 10 displays and/or combined with very large projection systems at the front of the room. Due to its specialized nature, the software powering these displays is often developed in house by the user, and frequently does not have the benefits of a modern software design architecture, mainstream libraries, and graphical capabilities. 

The overall Quindar project aims to create a modern, browser based, real time data visualization platform to monitor and operate complex engineering systems in a spaceflight mission operations setting. While other FOSS (Free Open Source Software) projects of this nature exist, this particular project is commercially backed by Audacy (http://audacy.space), who is fully committed to maintain it as free (no cost, open source) to the growing worldwide community of spacecraft operators of all sizes, now and in perpetuity.

# Features
This Quindar-platform project provides the platform services to support Quindar widgetes to consume, e.g.
* Telemetry data generator - this plugin will generate random data for mission operations application and Quindar widgets (there is separate Ephemeris data generator using GMAT (http://gmatcentral.org/) which will provide real orbit trajectory data points).
* Data services REST API - read/write events and telemetry data to MongoDB 
* WebSockets server - data streaming of telemetry data
* RabbitMQ gateway - guaranteed messaging for data generator 
* REST API documentation generator and API console for testing

# Folder structure
* Platform backend under /app/scripts contains all backend REST APIs
  - coreAdmin.js: core administration REST API definitions 
  - messageQueue.js: RabbitMQ client to write to the RabbitMQ exchange
  - socketConsole.js: WebSocket server
  - webSocket.js: WebSocket client
  - helper.js: helper class, e.g. simulation function to generate position data points

* Admin console is an AngularJS application
  - /app/controllers:  AngularJS controller for the dashboard
  - /app/directives: Angular-d3 directive used for charts and graphs in the admin console
  - /app/factories: wrapper for REST API
  - /app/models: data schema for telemetry
  - /app/styles: CSS stylesheets for the admin console
  - /app/views: UI views used in the admin console
  - /dist: consolidated JS/CSS used for admin console Web pages

* Configuration file under /config
   - system settings (e.g. server end-points) and credentials (e.g. username, password)

* Documentation under /docs

* Assets under /images

* SSL keys under /keys if HTTPS is used

* Server logs under /log


# Security
* Always use HTTPS. You can turn on/off different modules (e.g. http) by setting the flag to False in config/.systemSettings.js. It is perfectly acceptable to use http for early development and testing.
* Credentials.  We have made a small change not to disclose system user credentials which are defined in .systemSettings.js.  Before you run the application, you need to run the build/deploy script buildme.sh, which will install NPM dependencies, and also create a copy of .systemSettings.js based on the template config/systemSettings.js.
* Access token. We plan to use JSON Web Token for both REST API and webSockets.

# Installation Guide
## Overview
* Git clone the platform project from Github, e.g. git clone https://github.com/audacyDevOps/quindar-platform
* Install NodeJS dependencies - use buildme.sh to create a /log subfolder for logging, and to install npm packages
* Create SSL keys and self-signed certificates for NodeJS with HTTPS - use buildssl.sh to create keys under /keys
* Start NodeJS server, e.g. node server.js

## Step-by-step installation
* Pre-requisites
  - You need to install NodeJS (which comes with Node Package Manager, or npm) on your target host. Refer to https://nodejs.org/en/download/package-manager/ for details.
  - For example, you can install NodeJS on Windows by downloading the binaries from http://nodejs.org/#download.
  - You can install NodeJS and npm on Linux by:
```
curl --silent --location https://rpm.nodesource.com/setup_6.x | bash -
sudo yum -y install nodejs
```

* Git clone the platform project from Github, e.g. git clone https://github.com/audacyDevOps/quindar-platform
* Install NodeJS depencencies
```
./buildme.sh
```

If you run on Windows, you can run:
```
npm install
mkdir -p log
```
* If you need to set up SSL, you may want to create your own SSL keys. An example has been created for you under the folder /keys.
  - You can also create a self-signed certificate and SSL keys by running the command "buildssl.sh", which will output the SSL keys under the folder /keys.

* Compile REST API documentation, e.g.
```
./buildapidoc.sh
```

  - This assumes that you have the NPM package "apidoc" installed with root privilege.  You may need to run "buildme.sh" with root privilege if you run into issues of root privilege permission issue.
  - You can access and browse your REST API documentation under the URI /api, e.g. http://localhost:3000/api.

* To run your local instance of platform server, 
```
node server.js
```

Alternatively, you can run:
```
nodemon server.js
```

Open a Web browser with the URL http://localhost:3000 and you should see an admininstration console.


## Verify installation
* Open your web browser, and enter http://your-host-name:port/verifyMe
e.g. http://localhost:3000/verifyMe

This should tell you quindar platform is alive.

## Discovering Quindar platform REST API
* Open your web browser, and enter http://your-host-name:port/api to list the REST APIs available
e.g. http://platform.audacy.space:7902/api
* There are 3 groups of REST API
  * Read telemetry data, e.g. GET /services/v1/attitude
  * Write telemetry data, e.g. POST /services/v1/position
  * Telemetry simulator (write to MessageQueue), e.g. POST /services/v1/simulation/vehicle/audacy.telemetry.vehicle

## Telemetry simulator admin console
The admin console allows users to generate test data for telemetry simulation.
To start the admin console, enter the URL http://your-host-name:port, e.g. http://platform.audacy.space:7902

# Smoke test
You can run a smoke test by running "smoketest01.sh", e.g.
```
cd test
./smoketest01.sh
```

The smoke test will run a quick automated test of each REST API.  It can quickly tell you if the API server is available, or if any REST API fails to operate.  It will output 2 files:
* automatedTest-log-YYYY-MM-DD.log - a list of tests with successful results.
* automatedTest-err-YYYY-MM-DD.log - a list of tests that failed.

# For More Information
* For license (terms of use), please refer to the file license.md.
* For Quindar widgets, please refer to https://github.com/audacyDevOps/quindar-angular for details.
* If you want to contribute, or to extend the framework, you may want to refer to the "How to Contribute" document (contributing.md).
* For developers who want to modify or extend the framework, they may start with development guidelines (e.g. coding style, testing checklist) document in the contributing.md, and also additional checklists under the /docs folder. 
* The document features.md outlines the technical features and a list of widgets.
* The document frameworkDesign.md provides a high level summary of the software architecture.

# About Us
Audacy was launched in 2015 by Stanford graduates, SpaceX veterans, and NASA award winners. Audacy delivers anytime and effortless space connectivity, advancing humanity to a new age of commerce, exploration and discovery. Connect online at http://audacy.space.

