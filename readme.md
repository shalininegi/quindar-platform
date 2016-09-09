# Quindar Platform
Updated: September 09, 2016

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

# Security
* Always use HTTPS. You can turn on/off different modules (e.g. http) by setting the flag to False in config/.systemSettings.js. It is perfectly acceptable to use http for early development and testing.
* Credentials.  We have made a small change not to disclose system user credentials which are defined in .systemSettings.js.  Before you run the application, you need to run the build/deploy script buildme.sh, which will install NPM dependencies, and also create a copy of .systemSettings.js based on the template config/systemSettings.js.
* Access token. We plan to use JSON Web Token for both REST API and webSockets.

# For More Information
* For license (terms of use), please refer to the file license.md.
* For Quindar widgets, please refer to https://github.com/audacyDevOps/quindar-angular for details.
* If you want to contribute, or to extend the framework, you may want to refer to the "How to Contribute" document (contributing.md).
* For developers who want to modify or extend the framework, they may start with development guidelines (e.g. coding style, testing checklist) document in the contributing.md, and also additional checklists under the /docs folder. 
* The document features.md outlines the technical features and a list of widgets.
* The document frameworkDesign.md provides a high level summary of the software architecture.

# About Us
Audacy was launched in 2015 by Stanford graduates, SpaceX veterans, and NASA award winners. Audacy delivers anytime and effortless space connectivity, advancing humanity to a new age of commerce, exploration and discovery. Connect online at http://audacy.space.

