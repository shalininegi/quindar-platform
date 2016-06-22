// Program: module01.js 
// Purpose: test module to verify NodeJS modularity. /verifyMe is a heart beat to show the app is alive.
// Author:  Ray Lai
// Updated: May 23, 2016
// License: MIT license
//
module.exports = function(app) {
  var mongoose = require('mongoose');

  console.log("/verifyMe.js - verifyMe is loaded.");
  
	/**
	* @api {get} /verifyMe system heartbeat
	* @apiVersion 0.1.0
  * @apiName verifyMe
  * @apiDescription verify if system is alive
  * @apiGroup System
 	*
 	* @apiSuccess {String} message system status about the platform
 	*
 	* @apiExample {curl} Example usage:
 	* curl -X GET http://localhost:3000/verifyMe
 	*
 	* @apiSuccessExample Success-Response:
 	*     HTTP/1.1 200 OK
 	*     {
 	*       "message": "Quindar platform is alive"
 	*     }
 	*
 	* @apiError (Error 500) {json} N/A Not applicable
 	*
 	* @apiErrorExample {json} Error-Response:
 	*     HTTP/1.1 500 Not Found
 	*     {
 	*       "error": "Internal system error. Please check with system administrator to restart servers."
 	*     }
	**/
	app.get('/verifyMe', function(req, res) {
		res.json({'message': 'Quindar platform is alive'});
	});
};