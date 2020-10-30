// Libraries
const Math = require("mathjs");
const coreLib = require("../../core");
const phpCoreLib = require("./core.js");


// Libraries init
const core = new coreLib();
const phpCore = new phpCoreLib();

module.exports = function() {
	// Methods
	function checkForInjections(){
		core.println("<-- Checking for Injection Vulnerabilities -->", "green", "bold");
		core.appendToFile("<span style='color:green; font-weight:bold'><-- Checking for Injection Vulnerabilities --></span><br/>");
		
		var num_vulnerabilities_found = 0;
		
		var files = core.getAllFilesPaths(core.config.DEFAULT_PROJECT_PATH_TO_SCAN, [], true, true, ["php"]);
		
		for(var i = 0; i < files.length; i++){
			// MySQL Injection Check
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLinesInFile(["mysqli_query( \"", "mysqli_query( '"], files[i], false, true, false, false, "File has a MySQL Injection Vulnerability", "'mysqli_query' function can be injected", true, null, true, false, true, true, false);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLinesInFile(["mysqli_query( ,$", "mysqli_query( \"$", "mysqli_query( '$", "mysqli_query( ()."], files[i], false, true, false, false, "File has a MySQL Injection Vulnerability", "'mysqli_query' function can be injected", true, null, true, false, false, true, false);
			
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLinesInFile(["->query( \"", "->query( '"], files[i], false, true, false, false, "File has a MySQL Injection Vulnerability", "'query' function can be injected", true, null, true, false, true, true, false);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLinesInFile(["->query( $", "->query( \"$", "->query( '$", "->query( ()."], files[i], false, true, false, false, "File has a MySQL Injection Vulnerability", "'query' function can be injected", true, null, true, false, false, true, false);
			
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLinesInFile(["->multi_query( \"", "->multi_query( '"], files[i], false, true, false, false, "File has a MySQL Injection Vulnerability", "'multi_query' function can be injected", true, null, true, false, true, true, false);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLinesInFile(["->multi_query( $", "->multi_query( \"$", "->multi_query( '$", "->multi_query( ()."], files[i], false, true, false, false, "File has a MySQL Injection Vulnerability", "'multi_query' function can be injected", true, null, true, false, false, true, false);

			num_vulnerabilities_found = num_vulnerabilities_found + core.findLinesInFile(["->real_query( \"", "->real_query( '"], files[i], false, true, false, false, "File has a MySQL Injection Vulnerability", "'real_query' function can be injected", true, null, true, false, true, true, false);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLinesInFile(["->real_query( $", "->real_query( \"$", "->eal_query( '$", "->real_query( ()."], files[i], false, true, false, false, "File has a MySQL Injection Vulnerability", "'real_query' function can be injected", true, null, true, false, false, true, false);
			
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLinesInFile(["->reap_async_query( \"", "->reap_async_query( '"], files[i], false, true, false, false, "File has a MySQL Injection Vulnerability", "'reap_async_query' function can be injected", true, null, true, false, true, true, false);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLinesInFile(["->reap_async_query( $", "->reap_async_query( \"$", "->reap_async_query( '$", "->reap_async_query( ()."], files[i], false, true, false, false, "File has a MySQL Injection Vulnerability", "'reap_async_query' function can be injected", true, null, true, false, false, true, false);
			
			// Old mysql functions
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLinesInFile(["mysql_query( \"", "mysql_query( '"], files[i], false, true, false, false, "File has a MySQL Injection Vulnerability", "'mysql_query' function can be injected", true, null, true, false, true, true, false);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLinesInFile(["mysql_query( $", "mysql_query( \"$", "mysql_query( '$", "mysql_query( ()."], files[i], false, true, false, false, "File has a MySQL Injection Vulnerability", "'mysql_query' function can be injected", true, null, true, false, false, true, false);
			
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLinesInFile(["mysql_db_query( \"", "mysql_db_query( '"], files[i], false, true, false, false, "File has a MySQL Injection Vulnerability", "'mysql_db_query' function can be injected", true, null, true, false, true, true, false);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLinesInFile(["mysql_db_query( $", "mysql_db_query( \"$", "mysql_db_query( '$", "mysql_db_query( ()."], files[i], false, true, false, false, "File has a MySQL Injection Vulnerability", "'mysql_db_query' function can be injected", true, null, true, false, false, true, false);
			
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLinesInFile(["mysql_unbuffered_query( \"", "mysql_unbuffered_query( '"], files[i], false, true, false, false, "File has a MySQL Injection Vulnerability", "'mysql_unbuffered_query' function can be injected", true, null, true, false, true, true, false);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLinesInFile(["mysql_unbuffered_query( $", "mysql_unbuffered_query( \"$", "mysql_unbuffered_query( '$", "mysql_unbuffered_query( ()."], files[i], false, true, false, false, "File has a MySQL Injection Vulnerability", "'mysql_unbuffered_query' function can be injected", true, null, true, false, false, true, false);
			
			// PostgreSQL injection detections can be implemented here // because not implemented yet
		}
		
		// Prepare OS Commands Array to Check
		var cmds = [];
		cmds.push("system(");
		cmds.push("exec(");
		cmds.push("shell_exec(");
		cmds.push("passthru(");
		cmds.push("popen(");
		cmds.push("proc_open(");
		cmds.push("proc_close(");
		cmds.push("proc_get_status(");
		cmds.push("proc_nice(");
		cmds.push("proc_terminate(");
		
		// LDAP & OS Commands Injection Check
		for(var i = 0; i < files.length; i++){
			//LDAP
			var ldap_search_array = core.findLineInFile("ldap_search(", files[i], true);
			if(ldap_search_array.length > 0){
				if(core.findLineInFile("ldap_escape(", files[i]) == 0){
					num_vulnerabilities_found = num_vulnerabilities_found + ldap_search_array.length;
					core.appendToFile("<span style='color:red; font-weight:bold;'>" + files[i] + " File has an LDAP Injection Vulnerability, 'ldap_search()' function can be injected without ldap_escape() function and its flag LDAP_ESCAPE_FILTER!, check the lines number: " + ldap_search_array.toString() + " for the vulnerability.</span><br/>");
				}
				else if(core.findLineInFile("LDAP_ESCAPE_FILTER", files[i]) == 0){
					num_vulnerabilities_found = num_vulnerabilities_found + ldap_search_array.length;
					core.appendToFile("<span style='color:red; font-weight:bold;'>" + files[i] + " File has an LDAP Injection Vulnerability, 'ldap_escape()' function can be injected without its flag LDAP_ESCAPE_FILTER!, check the lines number: " + ldap_search_array.toString() + " for the vulnerability.</span><br/>");
				}
			}
			
			//OS Commands
			for(var j = 0; j < cmds.length; j++){
				var cmd_array = core.findLineInFile(cmds[j], files[i], true);
				if(cmd_array.length > 0){
					if(core.findLineInFile("escapeshellcmd(", files[i]) == 0 || core.findLineInFile("escapeshellarg(", files[i]) == 0){
						num_vulnerabilities_found = num_vulnerabilities_found + cmd_array.length;
						core.appendToFile("<span style='color:red; font-weight:bold;'>" + files[i] + " File has an OS Command Injection Vulnerability, '" + cmds[j] + ")' function can be injected without escapeshellcmd() and escapeshellarg() functions, check the lines number: " + cmd_array.toString() + " for the vulnerability.</span><br/>");
					}
				}
			}
		}
		
		// Results
		core.showResults(num_vulnerabilities_found, "Injection", "../langs/php/docs/php_injection_prevention.pdf", true);
		return num_vulnerabilities_found;
	}
	
	function checkForBrokenAuth(){
		core.println("<-- Checking for Broken Authentication Vulnerabilities -->", "green", "bold");
		core.appendToFile("<span style='color:green; font-weight:bold'><-- Checking for Broken Authentication Vulnerabilities --></span><br/>");
		
		var files = core.getAllFilesPaths(core.config.DEFAULT_PROJECT_PATH_TO_SCAN, [], true, true, ["php", "html"]);
		
		var num_vulnerabilities_found = 0;
		for(var i = 0; i < files.length; i++){
			if(core.findLineInFile("<form", files[i]) > 0 && core.findLineInFile("</form>", files[i]) > 0){
				if((core.findLineInFile("g-recaptcha", files[i]) == 0 || core.findLineInFile("data-sitekey", files[i]) == 0) && (core.findLineInFile("grecaptcha", files[i]) == 0)){
					num_vulnerabilities_found++;
					core.appendToFile("<span style='color:red; font-weight:bold;'>" + files[i] + " File might have a Broken Authentication Vulnerability, Check if Google reCaptcha implemented properly!</span><br/>");
				}
			}
		}
		
		// Results
		core.showResults(num_vulnerabilities_found, "Broken Authentication", "../langs/php/docs/php_broken_authentication_prevention.pdf", true);
		return num_vulnerabilities_found;
	}
	
	function checkForSensitiveDataExposure(){
		core.println("<-- Checking for Sensitive Data Exposure Vulnerabilities -->", "green", "bold");
		core.appendToFile("<span style='color:green; font-weight:bold'><-- Checking for Sensitive Data Exposure Vulnerabilities Vulnerabilities --></span><br/>");
				
		var num_vulnerabilities_found = 0;
		
		// DBMS Stuff
		if(phpCore.config.IS_DBMS_USED){
			if(phpCore.config.DBMS == "mysql"){
				if(phpCore.connectToDBMS()){
					// User table
					var password_hash = phpCore.getOneColumnValueFromDBMS(phpCore.config.YOUR_WEBAPP_DBMS_USER_TABLE_PASSWORD_COLUMN_NAME, phpCore.config.YOUR_WEBAPP_DBMS_USER_TABLE_NAME);
					
					if(password_hash){
						if(password_hash.length < 60){
							num_vulnerabilities_found++;
							if(password_hash.length < 24){
								core.appendToFile("<span style='color:red; font-weight:bold;'>In User Table, The Password is not Hashed with hashing algorithm at all, it is in plaintext which leads to information leakage!</span><br/>");
							}
							else {
								core.appendToFile("<span style='color:red; font-weight:bold;'>In User Table, The Password Hash Length is less than 60 Chars which means the hash algorithm is too weak!, it can be subject to rainbow table or dictionary attacks!</span><br/>");
							}
						}
						else if(password_hash.length == 60 && password_hash.charAt(0) == "$"){ // it is bcrypt hash // salt already included // so no need to check it
							password_hash = false;
						}
					}
					
					if(password_hash && core.isValid(phpCore.config.YOUR_WEBAPP_DBMS_USER_TABLE_SALT_COLUMN_NAME)){
						var salt = phpCore.getOneColumnValueFromDBMS(phpCore.config.YOUR_WEBAPP_DBMS_USER_TABLE_SALT_COLUMN_NAME, phpCore.config.YOUR_WEBAPP_DBMS_USER_TABLE_NAME);
						
						if(salt){
							if(salt.length < password_hash.length){
								num_vulnerabilities_found++;
								core.appendToFile("<span style='color:red; font-weight:bold;'>In User Table, The Salt Length is less than Password Hash length, Salt length should be same or more than hash length, to make it harder to be cracked with rainbow table or dictionary attacks, if password hash somehow leaked.</span><br/>");
							}
							
							if(!phpCore.isAllColumnValuesRandomInDBMSTable(phpCore.config.YOUR_WEBAPP_DBMS_USER_TABLE_SALT_COLUMN_NAME, phpCore.config.YOUR_WEBAPP_DBMS_USER_TABLE_NAME)){
								num_vulnerabilities_found++;
								core.appendToFile("<span style='color:red; font-weight:bold;'>In User Table, All Salt values must be unique and random!, there must not be any two rows have same Salt values</span><br/>");
							}
						}
					}
					else if(password_hash && !core.isValid(phpCore.config.YOUR_WEBAPP_DBMS_USER_TABLE_SALT_COLUMN_NAME)){
						num_vulnerabilities_found++;
						core.appendToFile("<span style='color:red; font-weight:bold;'>In User Table, It seems that Salt mechanism is not used in the table, Salting must be used, to make it harder to be cracked with rainbow table or dictionary attacks, if password hash somehow leaked.</span><br/>");
					}
					
					
					// Admin table
					if(phpCore.config.YOUR_WEBAPP_DBMS_USER_TABLE_NAME != phpCore.config.YOUR_WEBAPP_DBMS_ADMIN_TABLE_NAME){ // if same table, no need to check
						password_hash = phpCore.getOneColumnValueFromDBMS(phpCore.config.YOUR_WEBAPP_DBMS_ADMIN_TABLE_PASSWORD_COLUMN_NAME, phpCore.config.YOUR_WEBAPP_DBMS_ADMIN_TABLE_NAME);
						
						if(password_hash){
							if(password_hash.length < 60){
								num_vulnerabilities_found++;
								if(password_hash.length < 24){
									core.appendToFile("<span style='color:red; font-weight:bold;'>In Admin Table, The Password is not Hashed with hashing algorithm at all, it is in plaintext which leads to information leakage!</span><br/>");
								}
								else {
									core.appendToFile("<span style='color:red; font-weight:bold;'>In Admin Table, The Password Hash Length is less than 60 Chars which means the hash algorithm is too weak!, it can be subject to rainbow table or dictionary attacks!</span><br/>");
								}
							}
							else if(password_hash.length == 60 && password_hash.charAt(0) == "$"){ // it is bcrypt hash // salt already included // so no need to check it
								password_hash = false;
							}
						}
						
						if(password_hash && core.isValid(phpCore.config.YOUR_WEBAPP_DBMS_USER_TABLE_SALT_COLUMN_NAME)){
							var salt = phpCore.getOneColumnValueFromDBMS(phpCore.config.YOUR_WEBAPP_DBMS_USER_TABLE_SALT_COLUMN_NAME, phpCore.config.YOUR_WEBAPP_DBMS_ADMIN_TABLE_NAME);
							
							if(salt){
								if(salt.length < password_hash.length){
									num_vulnerabilities_found++;
									core.appendToFile("<span style='color:red; font-weight:bold;'>In Admin Table, The Salt Length is less than Password Hash length, Salt length should be same or more than hash length, to make it harder to be cracked with rainbow table or dictionary attacks, if password hash somehow leaked.</span><br/>");
								}
								
								if(!phpCore.isAllColumnValuesRandomInDBMSTable(phpCore.config.YOUR_WEBAPP_DBMS_USER_TABLE_SALT_COLUMN_NAME, phpCore.config.YOUR_WEBAPP_DBMS_ADMIN_TABLE_NAME)){
									num_vulnerabilities_found++;
									core.appendToFile("<span style='color:red; font-weight:bold;'>In Admin Table, All Salt values must be unique and random!, there must not be any two rows have same Salt values</span><br/>");
								}
							}
						}
						else if(password_hash && !core.isValid(phpCore.config.YOUR_WEBAPP_DBMS_USER_TABLE_SALT_COLUMN_NAME)){
							num_vulnerabilities_found++;
							core.appendToFile("<span style='color:red; font-weight:bold;'>In Admin Table, It seems that Salt mechanism is not used in the table, Salting must be used, to make it harder to be cracked with rainbow table or dictionary attacks, if password hash somehow leaked.</span><br/>");
						}
					}
				}
			}
			else {
				// for other dbms if used
			}
		}

		// Checking for HTTPS
		var htaccessPath = core.config.DEFAULT_PROJECT_PATH_TO_SCAN + ".htaccess";
		
		if(!core.isFileExists(htaccessPath)){
			var folders = core.getAllFilesPaths(core.config.DEFAULT_PROJECT_PATH_TO_SCAN, [], false);
			
			var found = -1;
			for(var i = 0; i < folders.length; i++){
				if(core.isFileExists(folders[i] + ".htaccess")){
					found = i;
					break;
				}
			}
			
			if(found >= 0){
				htaccessPath = folders[i] + ".htaccess";
			}
			else {
				num_vulnerabilities_found++;
				core.appendToFile("<span style='color:red; font-weight:bold;'>.htaccess file couldn't be detected, .htaccess file must exists in the project's root folder and have conditions to force redirection of all HTTP requests to HTTPS.</span><br/>");
			}
		}
		
		if(core.isFileExists(htaccessPath)){
			if(core.findLineInFile("RewriteEngine On", htaccessPath) == 0 || core.findLineInFile("RewriteRule ^(.*)$", htaccessPath) == 0 || core.findLineInFile("$1 [", htaccessPath) == 0){
				num_vulnerabilities_found++;
				core.appendToFile("<span style='color:red; font-weight:bold;'>" + htaccessPath + " file does not have specific conditions to force redirection of all HTTP requests to HTTPS.</span><br/>");
			}
		}
		
		// Checking for HTTP
		var files = core.getAllFilesPaths(core.config.DEFAULT_PROJECT_PATH_TO_SCAN, [], true, true, ["php", "html", "css", "js", "json"]);
		for(var i = 0; i < files.length; i++){
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLinesInFile(["\"http://", "'http://"], files[i], false, false, false, false, "This line does not use a secure connection as HTTPS to exchange sensitive information.", "You should transmit all sensitive data over a HTTPS connection instead of HTTP.", true);
		}
		
		// Results
		core.showResults(num_vulnerabilities_found, "Sensitive Data Exposure", "../langs/php/docs/php_sensitive_data_exposure_prevention.pdf", true);
		return num_vulnerabilities_found;
	}
	
	function checkForXmlExternalEntityInjection(){
		core.println("<-- Checking for XML External Entity Injection Vulnerabilities -->", "green", "bold");
		core.appendToFile("<span style='color:green; font-weight:bold'><-- Checking for XML External Entity Injection Vulnerabilities --></span><br/>");
		
		var files = core.getAllFilesPaths(core.config.DEFAULT_PROJECT_PATH_TO_SCAN, [], true, true, ["php"]);
		
		var num_vulnerabilities_found = 0;
		for(var i = 0; i < files.length; i++){
			if(core.findLineInFile("simplexml_load_file(", files[i]) > 0 || core.findLineInFile("simplexml_load_string(", files[i]) > 0 || core.findLineInFile("->loadXml(", files[i]) > 0){
				if(core.findLineInFile("libxml_disable_entity_loader", files[i]) > 0){
					num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("libxml_disable_entity_loader(false)", files[i], false, true, false, false, "File has an XML External Entity Injection Vulnerability", "External Entity Loading Prevention is Disabled, make sure: libxml_disable_entity_loader(boolean) function is called with true value not false!", true);
				}
				else {
					num_vulnerabilities_found++;
					core.appendToFile("<span style='color:red; font-weight:bold;'>" + files[i] + " file has an XML External Entity Injection Vulnerability, XML usage is detected, but libxml_disable_entity_loader(true) function is not called before the XML parser process.</span><br/>");
				}
				
				num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("LIBXML_NOENT", files[i], false, true, false, false, "XML usage is detected in file, but LIBXML_NOENT flag is used", "which allows the substitution of all entity references, remove this flag unless you know well how to use it, because it might cause an XML External Entity Injection.", true);
			}
		}
		
		// Results
		core.showResults(num_vulnerabilities_found, "XML External Entity Injection", "../langs/php/docs/php_xml_external_entity_injection_prevention.pdf", true);
		return num_vulnerabilities_found;
	}
	
	function checkForSecurityMisconfiguration(){
		core.println("<-- Checking for Security Misconfiguration Vulnerabilities -->", "green", "bold");
		core.appendToFile("<span style='color:green; font-weight:bold'><-- Checking for Security Misconfiguration Vulnerabilities --></span><br/>");
		
		var num_vulnerabilities_found = 0;
		
		// Checking for Listing Directories
		var htaccessPath = core.config.DEFAULT_PROJECT_PATH_TO_SCAN + ".htaccess";
		
		if(!core.isFileExists(htaccessPath)){
			var folders = core.getAllFilesPaths(core.config.DEFAULT_PROJECT_PATH_TO_SCAN, [], false);
			
			var found = -1;
			for(var i = 0; i < folders.length; i++){
				if(core.isFileExists(folders[i] + ".htaccess")){
					found = i;
					break;
				}
			}
			
			if(found >= 0){
				htaccessPath = folders[i] + ".htaccess";
			}
			else {
				num_vulnerabilities_found++;
				core.appendToFile("<span style='color:red; font-weight:bold;'>.htaccess file couldn't be detected, .htaccess file must exists in the project's root folder and have rules to prevent directory listing (index).</span><br/>");
			}
		}
		
		if(core.isFileExists(htaccessPath)){
			if(core.findLineInFile("Options -Indexes", htaccessPath) == 0){
				num_vulnerabilities_found++;
				core.appendToFile("<span style='color:red; font-weight:bold;'>" + htaccessPath + " file does not have specific rule to prevent directory listing, which may lead to information leakage.</span><br/>");
			}
		}
		
		// Checking for error handling
		var files = core.getAllFilesPaths(core.config.DEFAULT_PROJECT_PATH_TO_SCAN, [], true, true, ["php"]);
		
		var isErrorReportingFound = false;
		for(var i = 0; i < files.length; i++){
			if(core.findLineInFile("error_reporting(0)", files[i]) > 0 || core.findLineInFile("error_reporting($", files[i]) > 0){
				isErrorReportingFound = true;
				break;
			}
		}
		
		if(!isErrorReportingFound){
			num_vulnerabilities_found++;
			core.appendToFile("<span style='color:red; font-weight:bold;'>Project is not configured to not report any error while production, make sure you add this function call 'error_reporting(0);' in the header of every page, or add it to your web site/app config file then it will be called in all pages.</span><br/>");
		}
		
		// Results
		core.showResults(num_vulnerabilities_found, "Security Misconfiguration", "../langs/php/docs/php_security_misconfiguration_prevention.pdf", true);
		return num_vulnerabilities_found;
	}
	
	function checkForCrossSiteScripting(){
		core.println("<-- Checking for Cross-Site Scripting Vulnerabilities -->", "green", "bold");
		core.appendToFile("<span style='color:green; font-weight:bold'><-- Checking for Cross-Site Scripting Vulnerabilities --></span><br/>");
		
		var num_vulnerabilities_found = 0;
	
		var files = core.getAllFilesPaths(core.config.DEFAULT_PROJECT_PATH_TO_SCAN);
		
		for(var i = 0; i < files.length; i++){
			if(core.findLineInFile("$_GET[ ;", files[i]) > 0){
				if(core.findLineInFile("htmlentities( $_GET[ ;", files[i], false, true) == 0 && core.findLineInFile("htmlspecialchars( $_GET[ ;", files[i], false, true) == 0 && core.findLineInFile("->purify( $_GET[ ;", files[i], false, true) == 0 && core.findLineInFile("xss $_GET[ ;", files[i]) == 0){
					num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("$_GET[ ;", files[i], false, true, false, false, "File might have Cross-Site Scripting Vulnerability", "'$_GET' user input can be injected, please make sure to filter or sanitize any $_GET user input from Javascript, HTML and CSS codes input", true);
				}
			}
			
			if(core.findLineInFile("$_POST[ ;", files[i]) > 0){
				if(core.findLineInFile("htmlentities( $_POST[ ;", files[i], false, true) == 0 && core.findLineInFile("htmlspecialchars( $_POST[ ;", files[i], false, true) == 0 && core.findLineInFile("->purify( $_POST[ ;", files[i], false, true) == 0 && core.findLineInFile("xss $_POST[ ;", files[i]) == 0){
					num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("$_POST[ ;", files[i], false, true, false, false, "File might have Cross-Site Scripting Vulnerability", "'$_POST' user input can be injected, please make sure to filter or sanitize any $_POST user input from Javascript, HTML and CSS codes input", true);	
				}
			}
			
			if(core.findLineInFile("$_REQUEST[ ;", files[i]) > 0){
				if(core.findLineInFile("htmlentities( $_REQUEST[ ;", files[i], false, true) == 0 && core.findLineInFile("htmlspecialchars( $_REQUEST[ ;", files[i], false, true) == 0 && core.findLineInFile("->purify( $_REQUEST[ ;", files[i], false, true) == 0 && core.findLineInFile("xss $_REQUEST[ ;", files[i]) == 0){
					num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("$_REQUEST[ ;", files[i], false, true, false, false, "File might have Cross-Site Scripting Vulnerability", "'$_REQUEST' user input can be injected, please make sure to filter or sanitize any $_REQUEST user input from Javascript, HTML and CSS codes input", true);	
				}
			}
			
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile(".innerHTML", files[i], false, true, false, false, "File might have Cross-Site Scripting Vulnerability", "'.innerHTML' function can be injected, please use '.innerText' instead", true);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("eval(", files[i], false, true, false, false, "File might have Cross-Site Scripting Vulnerability", "'eval()' function can be injected, never use it. needing to use eval() usually indicates a problem in your code design.", true);
		}
		
		// Results
		core.showResults(num_vulnerabilities_found, "Cross-Site Scripting", "../langs/php/docs/php_cross_site_scripting_prevention.pdf", true);
		return num_vulnerabilities_found;
	}
	
	function checkForUsingComponentsWithKnownVulnerabilities(){
		core.println("<-- Checking for Using Components With Known Vulnerabilities -->", "green", "bold");
		core.appendToFile("<span style='color:green; font-weight:bold'><-- Checking for Using Components With Known Vulnerabilities --></span><br/>");
		
		var num_vulnerabilities_found = 0;
		
		if(core.isValid(phpCore.config.PHP_EXE_BIN_PATH)){
			if(core.runShellCmd(phpCore.config.PHP_EXE_BIN_PATH + " -r \"echo PHP_MAJOR_VERSION;\"") < 7){
				num_vulnerabilities_found++;
				core.appendToFile("<span style='color:red; font-weight:bold;'>Server's PHP version is low and vulnerable, your PHP server must be up to date</span><br/>");
			}
			
			if(core.runShellCmd(phpCore.config.PHP_EXE_BIN_PATH + " -r \"echo LIBXML_VERSION ;\"") < 20904){
				num_vulnerabilities_found++;
				core.appendToFile("<span style='color:red; font-weight:bold;'>PHP Server's XML parser version is low and vulnerable, your XML parser must be up to date</span><br/>");
			}
		}
		
		if(phpCore.config.IS_DBMS_USED){
			if(phpCore.config.DBMS == "mysql"){
				var mysqlConnection = null;
				if(mysqlConnection = phpCore.connectToDBMS()){
					var queryResult = mysqlConnection.query("SHOW VARIABLES LIKE 'innodb_version'");
					
					if(queryResult && queryResult.length > 0){
						var mysqlVersion = queryResult[0]["Value"].split(".");
						if(mysqlVersion[0] && mysqlVersion[0] < 10)mysqlVersion[0] = "0"+mysqlVersion[0];
						if(mysqlVersion[1] && mysqlVersion[1] < 10)mysqlVersion[1] = "0"+mysqlVersion[1];
						if(mysqlVersion[2] && mysqlVersion[2] < 10)mysqlVersion[2] = "0"+mysqlVersion[2];
					
						if(core.replaceAll(mysqlVersion.toString(), ",", "") < 100408){
							num_vulnerabilities_found++;
							core.appendToFile("<span style='color:red; font-weight:bold;'>MySQL Server's version is low and vulnerable, your MySQL server must be up to date</span><br/>");
						}
					}
				}
			}
		}
		
		// Results
		core.showResults(num_vulnerabilities_found, "Using Old Components", "../langs/php/docs/php_using_components_with_known_vulnerabilities_prevention.pdf", true);
		return num_vulnerabilities_found;
	}
	
	function checkForCrossSiteRequestForgery(){
		core.println("<-- Checking for Cross-Site Request Forgery Vulnerabilities -->", "green", "bold");
		core.appendToFile("<span style='color:green; font-weight:bold'><-- Checking for Cross-Site Request Forgery Vulnerabilities --></span><br/>");
		
		var files = core.getAllFilesPaths(core.config.DEFAULT_PROJECT_PATH_TO_SCAN, [], true, true, ["php", "html"]);
		
		var num_vulnerabilities_found = 0;
		for(var i = 0; i < files.length; i++){
			if(core.findLineInFile("<form", files[i]) > 0 && core.findLineInFile("</form>", files[i]) > 0){
				if(core.findLineInFile("token", files[i]) == 0 && core.findLineInFile("csrf", files[i]) == 0){
					num_vulnerabilities_found++;
					core.appendToFile("<span style='color:red; font-weight:bold;'>" + files[i] + " File might have Cross-Site Request Forgery Vulnerability, Check if CSRF Token implemented properly!</span><br/>");
				}
			}
		}
		
		// Results
		core.showResults(num_vulnerabilities_found, "Broken Authentication", "../langs/php/docs/php_cross_site_request_forgery_prevention.pdf", true);
		return num_vulnerabilities_found;
	}
	
	function checkForServerSideRequestForgery(){
		core.println("<-- Checking for Server-Side Request Forgery Vulnerabilities -->", "green", "bold");
		core.appendToFile("<span style='color:green; font-weight:bold'><-- Checking for Server-Side Request Forgery Vulnerabilities --></span><br/>");
		
		var files = core.getAllFilesPaths(core.config.DEFAULT_PROJECT_PATH_TO_SCAN, [], true, true, ["php"]);
		
		var num_vulnerabilities_found = 0;
		for(var i = 0; i < files.length; i++){
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("get_file_content($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'get_file_content()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("include($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'include()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("include_once($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'include_once()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("require($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'require()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("require_once($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'require_once()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("unlink($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'unlink()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("highlight_file($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'highlight_file()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("show_source($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'show_source()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("dba_open($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'dba_open()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("bzopen($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'bzopen()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("dba_popen($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'dba_popen()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("dbase_open($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'dbase_open()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("fdf_open($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'fdf_open()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("rpm_open($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'rpm_open()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("dio_open($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'dio_open()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("dbplus_open($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'dbplus_open()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("fopen($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'fopen()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("fam_open($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'fam_open()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("dbplus_ropen($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'dbplus_ropen()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("imap_open($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'imap_open()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("gzopen($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'gzopen()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("shmop_open($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'shmop_open()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("opendir($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'opendir()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("openlog($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'openlog()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("imap_reopen($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'imap_reopen()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("dbx_compare($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'dbx_compare()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("zip_open($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'zip_open()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("eio_open($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'eio_open()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("dba_optimize($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'dba_optimize()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("odbc_binmode($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'odbc_binmode()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("pdf_open_pdi($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'pdf_open_pdi()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("pdf_open_gif($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'pdf_open_gif()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("dbplus_errno($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'dbplus_errno()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("bcmod($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'bcmod()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("db2_close($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'db2_close()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("domentity($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'domentity()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("putenv($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'putenv()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("move_uploaded_file($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'move_uploaded_file()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("chdir($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'chdir()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("mkdir($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'mkdir()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("rmdir($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'rmdir()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("chmod($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'chmod()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("rename($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'rename()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("filepro($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'filepro()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("filepro_rowcount($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'filepro_rowcount()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("filepro_retrieve($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'filepro_retrieve()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
			num_vulnerabilities_found = num_vulnerabilities_found + core.findLineInFile("posix_mkfifo($", files[i], false, true, false, false, "File might have Server-Side Request Forgery Vulnerability", "'posix_mkfifo()' function used with a variable can be injected, please be careful not to directly use inputted values from clients without filtering or whitelisting.", true);
		}	
		
		// Results
		core.showResults(num_vulnerabilities_found, "Server-Side Request Forgery Problem", "../langs/php/docs/php_server_side_request_forgery_prevention.pdf", true);
		return num_vulnerabilities_found;
	}
	
	function checkForExtraWebSecurityHardenings(){
		core.println("<-- Checking for Extra Web Security Hardenings -->", "green", "bold");
		core.appendToFile("<span style='color:green; font-weight:bold'><-- Checking for Extra Web Security Hardenings --></span><br/>");
		
		var num_vulnerabilities_found = 0;
		
		// Checking for redirection ignore, thus may leak the rest of the page (which page may generate warning or error).
		var files = core.getAllFilesPaths(core.config.DEFAULT_PROJECT_PATH_TO_SCAN, [], true, true, ["php"]);
		
		for(var i = 0; i < files.length; i++){
			var headers = core.findLineInFile("header(", files[i], true, true);
			var locations = core.findLineInFile("Location", files[i], true, true);
			
			var metas = core.findLineInFile("<meta", files[i], true);
			var httpeqivs = core.findLineInFile("http-equiv", files[i], true);
			var refreshs = core.findLineInFile("refresh", files[i], true);
			
			var exits = core.findLineInFile("exit(", files[i], true, true);
			var dies = core.findLineInFile("die(", files[i], true, true);
			
			if(exits.length == 0 && dies.length == 0 && headers.length > 0 && locations.length > 0){
				core.appendToFile("<span style='color:red; font-weight:bold'>" + files[i] + " File has header redirection on line " + headers[0] + " but stopping execution function such as 'exit()' or 'die()' never called after it, client may disable page redirection and view the rest of the page.</span><br/>");
				num_vulnerabilities_found++;
			}
			
			if(exits.length == 0 && dies.length == 0 && metas.length > 0 && httpeqivs.length > 0 && refreshs.length > 0){
				core.appendToFile("<span style='color:red; font-weight:bold'>" + files[i] + " File has HTML Meta redirection on line " + metas[0] + " but stopping execution function such as 'exit()' or 'die()' never called after it, client may disable page redirection and view the rest of the page.</span><br/>");
				num_vulnerabilities_found++;
			}
			
			if(headers.length > 0 && (exits.length > 0 || dies.length > 0)){
				for(var j = 0; j < headers.length; j++){
					for(var k = 0; k < locations.length; k++){
						if(headers[j] - locations[k] == 0){
							var hasProblem = true;
							if(exits.length > 0){
								for(var l = 0; l < exits.length; l++){
									if(Math.abs(headers[j] - exits[l]) <= 5){ // distance(numOfLines) between two functions is 5 lines
										hasProblem = false;
										break;
									}
								}
							}
							
							if(dies.length > 0){
								for(var l = 0; l < dies.length; l++){
									if(Math.abs(headers[j] - dies[l]) <= 5){
										hasProblem = false;
										break;
									}
								}
							}
							
							if(hasProblem){
								core.appendToFile("<span style='color:red; font-weight:bold'>" + files[i] + " File has header redirection on line " + headers[j] + " but stopping execution function such as 'exit()' or 'die()' never called after it, client may disable page redirection and view the rest of the page.</span><br/>");
								num_vulnerabilities_found++;
							}
						}
					}
				}
			}
			
			if(metas.length > 0 && (exits.length > 0 || dies.length > 0)){
				for(var j = 0; j < metas.length; j++){
					for(var k = 0; k < httpeqivs.length; k++){
						for(var m = 0; m < refreshs.length; m++){
							if(metas[j] - httpeqivs[k] - refreshs[m] == 0){
								var hasProblem = true;
								if(exits.length > 0){
									for(var l = 0; l < exits.length; l++){
										if(Math.abs(metas[j] - exits[l]) <= 5){
											hasProblem = false;
											break;
										}
									}
								}
								
								if(dies.length > 0){
									for(var l = 0; l < dies.length; l++){
										if(Math.abs(metas[j] - dies[l]) <= 5){
											hasProblem = false;
											break;
										}
									}
								}
								
								if(hasProblem){
									core.appendToFile("<span style='color:red; font-weight:bold'>" + files[i] + " File has HTML Meta redirection on line " + metas[j] + " but stopping execution function such as 'exit()' or 'die()' never called after it, client may disable page redirection and view the rest of the page.</span><br/>");
									num_vulnerabilities_found++;
								}
							}
						}
					}
				}
			}
		}
		
		// Check for weird files exist in project
		var files = core.getAllFilesPaths(core.config.DEFAULT_PROJECT_PATH_TO_SCAN, [], true, true, ["sql", "txt", "zip", "rar", "tar", "gz", "7z", "z", "iso", "json", "doc", "docx", "xls", "xlsx"]);

		for(var i = 0; i < files.length; i++){
			var file = files[i];
			file = files[i].substring(file.lastIndexOf('\\') + 1).toLowerCase();
			
			if(file == "composer.json" || file == "package.json" ||  file == "bower.json"){
				core.appendToFile("<span style='color:red; font-weight:bold'>" + files[i] + " Package file found in your project, it may leak important info related to your project, you must remove it.</span><br/>");
			}
			else if(file.split('.').pop().toLowerCase() == "sql"){
				core.appendToFile("<span style='color:red; font-weight:bold'>" + files[i] + " SQL file found in your project, it may leak important info related to your project, you must remove it.</span><br/>");
			}
			else {
				core.appendToFile("<span style='color:red; font-weight:bold'>" + files[i] + " Weird file found in your project!, make sure it belongs there, if it doesn't, remove it.</span><br/>");
			}
			
			num_vulnerabilities_found++;
		}
		
		// Results
		core.showResults(num_vulnerabilities_found, "Extra Web Security Hardening", "../langs/php/docs/php_extra_web_security_hardenings.pdf", true);
		return num_vulnerabilities_found;
	}
	

	// Main
	var total_num_vulnerabilities_found = 0;
	
	console.log("");
	console.log("------------------------------");
	console.log("Scanning Web Site/App Security");
	console.log("------------------------------");
	console.log("");
	
	core.initReport();
	
	total_num_vulnerabilities_found = total_num_vulnerabilities_found + checkForInjections();
	core.showSpace();
	total_num_vulnerabilities_found = total_num_vulnerabilities_found + checkForBrokenAuth();
	core.showSpace();
	total_num_vulnerabilities_found = total_num_vulnerabilities_found + checkForSensitiveDataExposure();
	core.showSpace();
	total_num_vulnerabilities_found = total_num_vulnerabilities_found + checkForXmlExternalEntityInjection();
	core.showSpace();
	total_num_vulnerabilities_found = total_num_vulnerabilities_found + checkForSecurityMisconfiguration();
	core.showSpace();
	total_num_vulnerabilities_found = total_num_vulnerabilities_found + checkForCrossSiteScripting();
	core.showSpace();
	total_num_vulnerabilities_found = total_num_vulnerabilities_found + checkForUsingComponentsWithKnownVulnerabilities();
	core.showSpace();
	total_num_vulnerabilities_found = total_num_vulnerabilities_found + checkForCrossSiteRequestForgery();
	core.showSpace();
	total_num_vulnerabilities_found = total_num_vulnerabilities_found + checkForServerSideRequestForgery();
	core.showSpace();
	total_num_vulnerabilities_found = total_num_vulnerabilities_found + checkForExtraWebSecurityHardenings();
	
	core.showSpace();
	core.println("Total number of possible vulnerabilities found: " + total_num_vulnerabilities_found, "yellow", "bold");
	core.println("Check the generated " + core.config.HTML_REPORT_FILE_NAME_AND_PATH + " file to see scan results in detailed", "cyan", "bold");
	core.appendToFile("<span style='color:orange; font-weight:bold'>Total number of possible vulnerabilities found: " + total_num_vulnerabilities_found + "</span><br/>");
	core.appendToFile("<span style='color:blue; font-weight:bold'><a href='"+__dirname+"\\../php/docs/php_other_web_security_suggestions.pdf' target='_blank'>There are other Web Security Suggestions which can only be explained verbosely, Click Here to read more.</a></span><br/>");
	core.showSpace();
}

