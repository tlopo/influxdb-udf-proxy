var config = {};
config.server = {};

config.server.address = "127.0.0.1";
config.server.port = "8088";

config.influxdb_host = "127.0.0.1";
config.influxdb_port = "8086";
config.db_name = "mydb";
config.user = "root";
config.pass = "root";

config.influxdbEndPoint = "http://" + config.influxdb_host;
config.influxdbEndPoint += ":" + config.influxdb_port;
config.influxdbEndPoint += "/db/" + config.db_name + "/series";

config.updateSeriesInterval = 5 * 60 * 1000;

module.exports = config;
