var request = require('request');
var global = require('./global');
var log = require('./logger');

// Simple hello world udf
udf.helloWorld = function (opts,influxQuery,req,res){
	log.info("helloWorld triggered");
	res.send("Hello World!");
}
