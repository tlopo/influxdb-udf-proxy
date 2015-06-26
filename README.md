# influxdb-udf-proxy

##A user defined functions proxy for influxdb

As of this writing, as far as I know inflxudb does not yet support stored procedure like functions, and Grafana does not support functions instead of raw queries, that's the motiviation for influxdb-udf-proxy.

## Problems it solves

The main reason I wrote this proxy is that influxdb does not support timeshifting, which is necessary if you want to compare a serie in different periods in the same graph: 

![](https://sc-cdn.scaleengine.net/i/c04a0e5a50d0074d4d7ae7b3767aafd4.png)


Another problem, is that if you want your dashboard to be up-to-date with new servers being added and removed, you wan to use regex in your query, while the regexes is quite powerful it does not support negation, say you have the following metric: `AWS.WEB_SERVERS.WEB01.statusCode.200`  and you have many web servers being added and removed by autoscaling process. 

If you want the sum of all statusCode.200 for WEBs belonging to WEB_SERVERS group in AWS, you have the following query: 

`select sum(value) from merge(AWS.WEB_SERVERS.WEB*.statusCode.200) where $timeFilter group by time($interval) order asc` 

But what if you want exclude the WEB_TEST? you can't at least not yet.

##Installation
Steps to install:
1. Clone from github
2. Change configuration 
3. Run from its directory 

```
$ git clone https://github.com/tlopo/influxdb-udf-proxy
$ vim influxdb-udf-proxy/config.js
$ cd influxdb-udf-proxy; node .
```

##Usage

UDFs can be called very easily, it follows the following syntax:

`@udfName:{<opts>} query`

For instance the timeshift UDF looks like:

```
@timeshift:{"shift":86400000} select mean(value) from "AWS.WEB_SERVERS.WEB01.statusCode.200" where time > now()-300s group by time(1m)
```

## New functions

To add a new udf it's just a matter of dropping a .js file under udf directory, the file should look like this:

```
var request = require('request');
var global = require('./global');
var log = require('./logger');

// Simple hello world udf
udf.helloWorld = function (opts,influxQuery,req,res){
	log.info("helloWorld triggered");
	res.send("Hello World!");
}
```

Take a look at ![timeshift.js](https://github.com/tlopo/influxdb-udf-proxy/blob/master/udf/timeshift.js) for a more advanced example.
























