// Libraries
const config = require("../../config_php_lang.js");
const coreLib = require("../../core");

// Libraries init
const core = new coreLib();

module.exports = function() {
	this.config = config; // exporting config file to outside
	
	// Methods
	this.connectToDBMS = function(){
		if(config.IS_DBMS_USED){
			if(config.DBMS == "mysql"){
				try {
					var mysql = require('sync-mysql');
					var mysqlConnection = new mysql({
					  host     : config.YOUR_WEBAPP_DBMS_SERVER_IP,
					  user     : config.YOUR_WEBAPP_DBMS_USERNAME,
					  password : config.YOUR_WEBAPP_DBMS_PASSWORD,
					  database : config.YOUR_WEBAPP_DBMS_DB_NAME
					});
					 
					const result = mysqlConnection.query('SELECT 1 + 1 AS answer');
			
					if(result[0].answer === 2){
						return mysqlConnection;
					}
					else {
						core.println("MySQL Config Error: MySQL not connected!", "red", "bold");
					}
				}
				catch(e){
					core.println("MySQL Config Error: MySQL not connected!", "red", "bold");
					console.log(e);
				}
			}
			else {
				if(core.config.IS_DEBUG_MODE_ENABLED){
					console.log("Other DBMS is used, make sure you implement it.");
				}
			}
		}
		else {
			if(core.config.IS_DEBUG_MODE_ENABLED){
				console.log("DBMS not enabled in the config");
			}
		}
		
		return null;
	}
	
	this.getOneColumnValueFromDBMS = function(column, table, where = "where " + column + " != null or " + column + " != '' or " + column + " != ' ' or " + column + " != 'NULL' or " + column + " != 'null' or " + column + " != 'Null'", orderBy = " order by " + column + " DESC"){
		var columnValue = null;

		if(config.IS_DBMS_USED){
			if(config.DBMS == "mysql"){
				try {
					var mysqlConnection = this.connectToDBMS();

					if(mysqlConnection){
						var queryResult = mysqlConnection.query('SELECT ' + column + ' from ' + table + ' ' + where + ' ' + orderBy + ' limit 1');

						if(queryResult && queryResult.length && queryResult.length != 0 && queryResult[0][column]){
							columnValue = queryResult[0][column];
						}
						else {
							core.println("Please make sure the configurations are correct and your table " + table + " contains at least one row with real production data for tests!", "red", "bold");
						}
					}
					else {
						if(core.config.IS_DEBUG_MODE_ENABLED){
							console.log("MySQL Connection Error!");
						}
					}
				}
				catch(e){
					if(core.config.IS_DEBUG_MODE_ENABLED){
						console.log("Error happened in Mysql query!");
						console.log(e);
					}
				}
			}
			else {
				if(core.config.IS_DEBUG_MODE_ENABLED){
					console.log("Other DBMS is used, make sure you implement it.");
				}
			}
		}
		else {
			if(core.config.IS_DEBUG_MODE_ENABLED){
				console.log("DBMS not enabled in the config");
			}
		}

		if(core.config.IS_DEBUG_MODE_ENABLED){
			console.log(columnValue);
		}
		
		return columnValue;
	}
	
	this.isAllColumnValuesRandomInDBMSTable = function(column, table, where = "where " + column + " != null or " + column + " != '' or " + column + " != ' ' or " + column + " != 'NULL' or " + column + " != 'null' or " + column + " != 'Null'", orderBy = " order by " + column + " DESC"){
		if(config.IS_DBMS_USED){
			if(config.DBMS == "mysql"){
				try {
					var mysqlConnection = this.connectToDBMS();

					if(mysqlConnection){
						var queryResult = mysqlConnection.query('SELECT ' + column + ' from ' + table + ' ' + where + ' ' + orderBy);
						
						if(core.config.IS_DEBUG_MODE_ENABLED){
							console.log(queryResult);
						}

						if(queryResult && queryResult.length && queryResult.length > 0){
							for(var i = 0; i < queryResult.length; i++){
								var columnValue = queryResult[i][column];
								for( j = i + 1; j < queryResult.length; j++){
									column2Value = queryResult[j][column];
									
									if(columnValue == column2Value){
										return false;
									}
								}
							}
						}
						else {
							core.println("Please make sure the configurations are correct and your table " + table + " contains at least one row with real production data for tests!", "red", "bold");
						}
					}
					else {
						if(core.config.IS_DEBUG_MODE_ENABLED){
							console.log("MySQL Connection Error!");
						}
					}
				}
				catch(e){
					if(core.config.IS_DEBUG_MODE_ENABLED){
						console.log("Error happened in Mysql query!");
						console.log(e);
					}
				}
			}
			else {
				if(core.config.IS_DEBUG_MODE_ENABLED){
					console.log("Other DBMS is used, make sure you implement it.");
				}
			}
		}
		else {
			if(core.config.IS_DEBUG_MODE_ENABLED){
				console.log("DBMS not enabled in the config");
			}
		}

		return true;
	}
}

