#!/usr/bin/env node
const timestampBeforeScanStarted = Date.now() / 1000 | 0;
process.stdout.write('\033c'); // Clear screen

// Imports
const config = require("./config.js");
var start = "";

// Global Variables
// none for now

// Main
if(config.USED_PROGRAMMING_LANGUAGE.toLowerCase() == "php"){
	start = require("./langs/php");
}
else if(config.USED_PROGRAMMING_LANGUAGE.toLowerCase() == "c#"){
	//start = require("./langs/c#");
}
else {
	console.log();
	consol.log("Invalid chosen programming language, exiting..");
	process.exit();
}

if(start != ""){
	new start();
	
	const totalScanTime = (Date.now() / 1000 | 0) - timestampBeforeScanStarted;
	console.log("Total scan time: " + totalScanTime + " Seconds");
	console.log();
}

