var _ = require('underscore');
var log = require('./logger');
// This shifts the time 
mod.shiftTime = function  (ctx) {
	shift = parseInt(ctx.shift);
	queryResult = ctx.queryResult

	_.each(queryResult,function (element,index,list){ 
		if ( typeof element.points !== 'undefined' ) {
			_.each( element.points, function( point, index, list){
				point[0] += shift;
			})
		}else{
			console.log("WARN: queryResult has no points?");
		}
	})
}

