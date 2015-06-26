var request = require('request');
var global = require('./global');
var log = require('./logger');

// UDF timeshift
// Usage: @timeshift:{ "shift" : <integer>, "changeTimeFilter" : <boolean> } <query>
// example: @timeshift:{ "shift" : 300000, "changeTimeFilter" : true }
// changeTimeFilter is optional default is false
udf.timeshift = function (opts,influxQuery,req,res) {
	var shift;
	var shifSec;
	var timeFilter = null;
	var modTimeFilter = false;
	var changeTimeFilter = false; 
	
	requiredFields = ['shift'];
	optionalFields = ['changeTimeFilter']; 

	// Make sure required fields are present
	if (! global.hasRequiredFields(opts,requiredFields) ) {
		global.sendError("Function timeshift requires fields: "+requiredFields ,res)
		return;
	}
	
	// Make sure there is no unkown fields
	var unknownFields = global.getUnknownFields(opts,requiredFields,optionalFields);
	if ( unknownFields.length ) {
		global.sendError("Unknown fields: " + unknownFields,res);
		return;
	}

	// Check if we need to change time filter
	if ( opts.changeTimeFilter !== 'undefined' && opts.changeTimeFilter !== 'false' ) {
		changeTimeFilter = Boolean(opts.changeTimeFilter); 
	}

	shift = parseInt(opts.shift); 
	shiftSec = shift / 1000; 
	

	if ( changeTimeFilter )  {
		var result = global.changeQueryTimeFilter(influxQuery,res) 
		// Something went wrong, and we already replied the request, so just return
		if ( ! result.success ) {
			return 
		}else{
			influxQuery = result.changedQuery;
		}
	}
	
	var ctx = {};
	ctx.shift = shift; 
	global.runQueryAndChange(influxQuery,res,['shiftTime'],ctx)
}
