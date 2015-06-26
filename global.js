var _ = require('underscore');
var request = require('request');
var config = require('./config');
var resultModifier = require("./modifiers");
var log = require('./logger');

var global = {} ;
global.series = {};
global.series.data = [];

global.runQueryAndChange = function (influxQuery,res,functions,ctx) {
	// Hit influxdb api
	global.runQuery( influxQuery ,function(error,response,body){
		var queryResult  = global.parseQueryResult(body);

		if ( error ) {
			log.error("Failed to run query:\n",error);
			global.sendError("Failed to hit influxdb api.\n" + error, res );
			return;
		}

		if (!queryResult) {
			global.sendError("Error parsing influxdb response:\n"+body,res);
			return;
		}

		if ( functions.length ){		
			var availableFunctions = _.keys(resultModifier);
			var unknownFunctions = _.difference(functions,availableFunctions);
	
			if ( unknownFunctions.length ) {
				global.sendError("Unknown Functions : " +unknownFunctions, res );
				return
			}
			
			ctx.queryResult = queryResult;
	
			_.each(functions,function(e,i,list){
				resultModifier[e](ctx);
			});
		}
		//queryResult.push({"proxyQuery" : influxQuery}); 
		res.send(JSON.stringify(queryResult));
	});	

}


global.runQueryAndSend = function (influxQuery,res) {
	global.runQueryAndChange(influxQuery,res,[],null);
}


global.changeQueryTimeFilter = function (influxQuery,res) {
	// Change time filter is a work around for grafana zoom to work
	// Grafana will give a string as $timeFilter which will look as bellow
	// Relational: time > now()-<integer><unit> ex: time > now()-7d or time > now()-1s
	// Range: time > <integer><unit> and time < <integer><unit> ex: time < 1435173156s and time > 1435169596

	var obj =  {};
	obj.success = false; 
	obj.changedQuery;

	var timeFilter;
	var match = influxQuery.match(/where.*?(time.*?)group/i);
	if ( match != null ){
		timeFilter = match[1];
	
		modTimeFilter = global.getChangedTimeFilter(timeFilter,shiftSec);

		if ( modTimeFilter != false ) {
			var changedQuery = influxQuery.replace(timeFilter,modTimeFilter);
			influxQuery = changedQuery;
			obj.success = true;
			obj.changedQuery = changedQuery; 

		}else{
			// Could not modify time filter
			global.sendError("Could not change time filter: "+timeFilter ,res);
		}
	
	}else{
		// Could not determine time filter
		global.sendError("Could not determine time filter",res);
	}
	return obj;
}



global.getChangedTimeFilter = function (timeFilter,shifSec) {
	var changedTimeFilter = false;

	// Check if timeFilter is range or relation
	if ( RegExp("and","i").test(timeFilter) ) {
		//timeFilter is range
		var match  = timeFilter.match(/([0-9]+s)/gi); 
		if ( match != null && match.length > 1) {
			var from = parseInt( match[0].replace("s","") );
			var to = parseInt( match[1].replace("s","") );
			var shiftFrom = from - shiftSec;
			var shiftTo = to - shiftSec;

			changedTimeFilter = " time > " + shiftFrom+ "s and time < " +shiftTo+ "s ";
		}
	}else{
		//timefilter is relational 
		changedTimeFilter = " " + timeFilter + "- " +shiftSec+ "s ";
		changedTimeFilter += "and time < now()-"+shiftSec+ "s ";
	}

	return changedTimeFilter;
}

global.parseQueryResult = function (queryResult){
	var parsed;
	try {
		parsed = JSON.parse(queryResult);	
	}catch(e){
		log.error("Failed to parse queryResult:\n",e);
		return false;
	}
	return parsed;
}


global.getUnknownFields = function (opts,requiredFields,optionalFields) {
	var hasUnknownFields = true;
	var allFields = requiredFields.concat(optionalFields);
	return _.difference(_.keys(opts),allFields)
}


global.hasRequiredFields = function (opts,requiredFields) {
	var hasRequiredFields = true;

	_.each(requiredFields,function(requiredField,index,list){
		var found = false;
		_.each(_.keys(opts),function(opt,index,list){
			if ( requiredField === opt ){
				found = true;
			}
		})
		if ( !found ) {
			hasRequiredFields = false;
		}
	});
	return hasRequiredFields;
}

global.runQuery =  function (influxQuery,callback) {
	var url  = config.influxdbEndPoint + "?u=" + config.user + "&p=" + config.pass + "&q=" + influxQuery; 
	log.info("Request: "+ url);
	request(url,callback);	
}

global.updateSeries = function (){
	log.info ("Updating series");
	global.runQuery('list series', function (error,response,body){
		var queryResult = global.parseQueryResult(body);
		var filteredSeries = []; 

		if( error  ){
				log.error("Failed to update series:\n",error);
				return;
		}
	
		if (!queryResult) {
				log.error("Failed to parse result of list series");
				return;
		}
		
		var tmpArray = []
		_.each(queryResult[0].points ,function(e,i,list){
			tmpArray.push(e[1]);
		});

		global.series.data = tmpArray;
		
		log.info("Series updated.");
	});
}

global.seriesUpdater = function (){
	global.updateSeries();
	setInterval( function() {
		( function() { global.updateSeries() } )();
	}, config.updateSeriesInterval );
}

global.getFilteredSeries = function (filters){
	var filteredSeries = []; 
	var regexes = [];
	var reverseRegexes = [];
	
	// Create array of regexes 	
	_.each(filters,function(e,i,list){
		if ( e.match(/^!/) ){
			var changed = e.replace(/^!/,"");
			reverseRegexes.push( RegExp(changed,"i") );
		}else{
			regexes.push(RegExp(e,"i"));
		}
	}); 
	
	// Check if series match all regexes
	_.each( global.series.data, function(serie,i,list){i
		var match = true;
		_.each(regexes,function(regex,i,list){
			if ( ! regex.test(serie) ){
				match = false;
			}
		})
		
		if ( match ) {
			_.each(reverseRegexes,function( reverseRegex, i, list){
				if ( reverseRegex.test(serie) ) {
					match = false;
				}
			});
		}
	
		if ( match ) {
			filteredSeries.push(serie);
		}
	});
	return filteredSeries;	
}

global.sendError = function (msg,res) {
	res.send(msg);
}

module.exports = global;
