var fs = require("fs");
var _ = require("underscore");
var modDir = "./modifiers/";
var mod = {};

list = fs.readdirSync(modDir);

_.each(list,function(element, index, list){
					if ( element.match(/\.js$/ ) ) {
						eval (fs.readFileSync( modDir + element ).toString() ); 
					}
	});

module.exports = mod; 

