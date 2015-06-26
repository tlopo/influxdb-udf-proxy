var fs = require("fs");
var _ = require("underscore");
var udfDir = "./udf/";
var udf = {};

list = fs.readdirSync(udfDir);

_.each(list,function(element, index, list){
					if ( element.match(/\.js$/ ) ) {
						eval (fs.readFileSync( udfDir + element ).toString() ); 
					}
	});

module.exports = udf; 

