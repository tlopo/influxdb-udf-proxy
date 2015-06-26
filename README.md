# influxdb-udf-proxy

##A user defined proxy for influxdb

As of this writing, as far as I know inflxudb does not yet support stored procedure like functions, and Grafana does not support functions instead of raw queries, that's the motiviation for influxdb-udf-proxy.

## Problems it solves

The main reason I wrote this proxy is that influxdb does not support timeshifting, which is necessary if you want to compare a serie in different periods in the same graph: 

![](https://sc-cdn.scaleengine.net/i/c04a0e5a50d0074d4d7ae7b3767aafd4.png)


Another problem, is that if you want your dashboard to be up-to-date with new servers being added and removed, you wan to use regex in your query, while the regexes is quite powerful it does not support negation, say you have the following metric: `AWS.WEB_SERVERS.WEB01.statusCode.200`  and you have many web servers being added and removed by autoscaling process. 


