var express = require('express');
var bodyParser = require('body-parser');
var request = require('request'); 
var _ = require('underscore');
var log = require('./logger');

var config = require("./config");
var udf = require("./udf");
var resultModifier = require("./modifiers.js");
var global = require('./global');

var app = express();
app.use(bodyParser.urlencoded({ extended: false }))

app.get("/db/"+config.db_name+"/series",influxProxy);

startServer();

global.seriesUpdater();


function startServer () {
	var server = app.listen(config.server.port,config.server.address, function () {
		  var host = server.address().address;
			var port = server.address().port;
			log.info('Server listening at http://%s:%s', host, port);
	});
}


function influxProxy (req,res){
	console.log("------------------------------------------------");
	var host = config.influxdb_host + ":" + config.influxdb_port;
	var path = req.path;
	var url = "http://" + host + path;
	var func ;
	var query = typeof req.query.q !== 'undfined' ? req.query.q : null;

	log.info("New Request:", req.url);
	
	// Check if uses custom functions
	if ( RegExp("^@","i").test(query) ) {
		var funcName;
		var opts;
		var influxQuery;
		
		log.info("Query:" +query );
		var match = query.match(/^@(.*?):({.*})(.*)/);
		
		// Extract function name, options, and query	
		if ( match != null && match.length > 2 ){
			funcName = match[1];
			opts = match[2];
			influxQuery = match[3];

			try {
				opts = JSON.parse(opts);
			} catch(e){
				global.sendError("Failed to parse opts",res);
				return;
			}
		}else{	
			global.sendError("Syntax error, expected @<udf>:{json opts}<query>",res);
			return;
		}
		
		// Check if function exists and call it
		if ( typeof udf[funcName] !== 'undefined' && typeof udf[funcName] === 'function' ){
			udf[funcName](opts,influxQuery,req,res);
		}else{
			global.sendError("Function "+funcName+" not Found",res);
		}
		


	}else{
	// No custom functions simple proxy
		log.info("simple proxy handler");
		log.info("redirected to http://" + host + req.url);
		request("http://" + host + req.url,function (error,response,body){
			if ( error ) {
				log.error("Failed to hit influxdb api:\n",error)
				res.send("Failed to proxy request:"+error);
			}
			res.send(body);
		});
	}	
	
	return; 
}

