var _ = require('underscore');
var _ = require('request');
var global = require('./global');
var log = require('./logger');

// Influxdb SQL language is not yet as powerful as graphite, this will enhance its power.
// Usage: @fiters:{"filters": [], "timeShift" : integer, "changeTimefilter" : boolean } <query>
// Reverse filters  needs to start with ! ex.:  "!web[24]", this works similar to grep -vi 'web[24]'
udf.filters =  function (opts,influxQuery,req,res) {
	var filters;
	var timeFilter;
	var timeshift;

	var requiredFields = ['filters'];
	var optionalFields =  ['changeTimeFilter','timeShift'];

	// Make sure required fields are present
	if (! global.hasRequiredFields(opts,requiredFields) ) {
		global.sendError("Function filters requires fields: "+requiredFields ,res)
		return;
	}
	
	// Make sure there is no unknown fields
	var unknownFields = global.getUnknownFields(opts,requiredFields,optionalFields);
	if ( unknownFields.length ) {
		global.sendError("Function filters unknown fields: " + unknownFields,res);
		return;
	}

	filters = opts.filters;
	var filteredSeries = global.getFilteredSeries(filters);


	var changedQuery = influxQuery.replace(/%filtered%/,filteredSeries);
	influxQuery = changedQuery;

	if ( typeof opts.timeShift !== 'undefined' ) {
		var timeshiftOpts = {};	
		timeshiftOpts.shift = opts.timeShift;
		if ( typeof opts.changeTimeFilter !== undefined) {
			timeshiftOpts.changeTimeFilter = opts.changeTimeFilter;
		}
		log.info ("Calling timeshift");
		udf.timeshift (timeshiftOpts,influxQuery,req,res);
		return ;
	}

	global.runQueryAndSend (influxQuery,res);	

}
