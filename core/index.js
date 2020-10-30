/*

This file is The Toolkit Core file, which all its Functionalites can be used in all other files

*/

// Libraries
const fs = require('fs');
const path = require("path");
const colors = require('colors');
const execSync = require('child_process').execSync;

// Variables
const config = require("../config.js");

String.prototype.replaceAll = function(search, replacement) {
    return this.replace(new RegExp(search, 'g'), replacement);
};

module.exports = function() {
	this.config = config; // exporting config file to outside
	
	this.replaceAll = function(text, search, replacement) {
		return text.replace(new RegExp(search, 'g'), replacement);
	};
	
	// Methods
	this.createFile = function(content, filePath = null){
		if(!filePath)filePath = config.HTML_REPORT_FILE_NAME_AND_PATH;
		
		fs.writeFileSync(filePath, content, function (err) {
			if(config.IS_DEBUG_MODE_ENABLED){
				if (err) console.log(err);
				console.log(filePath + ' Saved!');
			}
		});
	}
	
	this.appendToFile = function(content, filePath = null){
		if(!filePath)filePath = config.HTML_REPORT_FILE_NAME_AND_PATH;
		
		fs.appendFileSync(filePath, content, function (err) {
			if(config.IS_DEBUG_MODE_ENABLED){
				if (err) console.log(err);
				console.log(filePath + ' Saved!');
			}
		});
	}
	
	this.initReport = function(){
		this.createFile("");
		this.appendToFile(
			"<style>* { background-color: #f7f8f5 !important; } div {  margin: 0 auto; width: 1000px !important; }</style>" +
			"<div>" +
				"<br/>" +
				"<hr/>" +
				"<center>" +
					"<h1 style='color:green;font-weight:bold;'>AWSS Toolkit Report @ " + this.getDateAndTime() + "</h1>" +
				"</center>"+
				"<hr/>" +
			"</div>" +
			"<br/>"
		);
	}
	
	this.println = function(message, font1 = null, font2 = null, font3 = null){
		if(font1){
			message = message + "";
			if(font2){
				if(font3){
					console.log(message[font1][font2][font3]);
				}
				else {
					console.log(message[font1][font2]);
				}
			}
			else {
				console.log(message[font1]);
			}
		}
		else {
			console.log(message);
		}
	}
	
	this.getDateAndTime = function(){
		const DATE = new Date();
		
		var month = DATE.getMonth()+1; if(month < 10)month = "0"+month;
		var day = DATE.getDate(); if(day < 10)day = "0"+day;
		var hours = DATE.getHours(); if(hours < 10)hours = "0"+hours;
		var minutes = DATE.getMinutes(); if(minutes < 10)minutes = "0"+minutes;
		var seconds = DATE.getSeconds(); if(seconds < 10)seconds = "0"+seconds;
		
		return DATE.getFullYear() + "/" + month + "/" + day + " - " + hours + ":" + minutes + ":" + seconds;
	}
	
	this.showSpace = function(){
		this.println("");
		this.println("-----------------------------------------------------------");
		this.println("");
		
		this.appendToFile("<br/>");
		this.appendToFile("<hr/>");
		this.appendToFile("<br/>");
	}
	
	this.getAllFilesPaths = (dirPath, arrayOfFiles, traverse = true, listOnlySpecificExtensions = false, extensions = [], ignoreFilesOrFolders = []) => {
	  try {
		  files = fs.readdirSync(dirPath);
		 
		  arrayOfFiles = arrayOfFiles || []
		 
		  files.forEach((file) => {
			if(file == config.THIS_PROJECT_FOLDER_NAME)return; // ignore this project's folder
			
			for(var i = 0; i < ignoreFilesOrFolders.length; i++){
				if(file == ignoreFilesOrFolders[i])return;
			}
			
			if (fs.statSync(dirPath + "/" + file).isDirectory()) {
				if(traverse){
					arrayOfFiles = this.getAllFilesPaths(dirPath + "/" + file, arrayOfFiles, traverse, listOnlySpecificExtensions, extensions, ignoreFilesOrFolders);
				}
				else {
					arrayOfFiles.push(path.join(__dirname, dirPath, "/", file + "/").replace("\\"+config.THIS_PROJECT_FOLDER_NAME, "").replace("/"+config.THIS_PROJECT_FOLDER_NAME, ""));
				}
			} 
			else {
				if(listOnlySpecificExtensions){
					var fileExtension = "nothing";
					try {
						fileExtension = file.split('.').pop().toLowerCase();
					}
					catch(e){
						return;
					}
					
					for(var i = 0; i < extensions.length; i++){
						if(fileExtension == extensions[i].toLowerCase()){
							arrayOfFiles.push(path.join(__dirname, dirPath, "/", file).replace("\\"+config.THIS_PROJECT_FOLDER_NAME, "").replace("/"+config.THIS_PROJECT_FOLDER_NAME, ""));
						}
					}
				}
				else {
					arrayOfFiles.push(path.join(__dirname, dirPath, "/", file).replace("\\"+config.THIS_PROJECT_FOLDER_NAME, "").replace("/"+config.THIS_PROJECT_FOLDER_NAME, ""));
				}
			}
		  })
	  }
	  catch(e){
		console.log(e);
	  }
	  
	  if(config.IS_DEBUG_MODE_ENABLED){
		console.dir(arrayOfFiles, {'maxArrayLength': null});
	  }
	  
	  return arrayOfFiles;
	}
	
	this.findLineInFile = function(lineToFind, inFile, returnLinesNumberArray = false, isCaseSensitive = false, isSpaceSensitive = false, verbose = false, message = "", message2 = "", writeToFile = false, filePath = null, checkIfIncompleteCodeLine = false, ignoreLineIfIncompleteCodeLineDetected = false, notifyOnlyIfIncompleteCodeLineDetected = false, checkIfMultipleCodeLinesInOneLine = false, notifyOnlyIfMultipleCodeLinesInOneLineDetected = false){
		var wordsFoundInLineNumber = [];
		
		try {
			var lines = fs.readFileSync(inFile, 'utf-8').split('\n').filter(Boolean);
			
			var wordsToFindInLine = lineToFind.split(" ");
			var wordsFoundInLine = [];

			for(var i = 0; i < lines.length; i++){
				for(var j = 0; j < wordsToFindInLine.length; j++){
					wordsFoundInLine[j] = false;
				
					if(isCaseSensitive){
						if(isSpaceSensitive){
							if(lines[i].includes(wordsToFindInLine[j])){
								lines[i] = lines[i].replace(wordsToFindInLine[j], ""); // to make sure it doesn't find duplicate result
								wordsFoundInLine[j] = true;
							}
						}
						else {
							if(lines[i].replaceAll(" ", "").includes(wordsToFindInLine[j].replaceAll(" ", ""))){
								lines[i] = lines[i].replaceAll(" ", "").replace(wordsToFindInLine[j].replaceAll(" ", ""), ""); // to make sure it doesn't find duplicate result
								wordsFoundInLine[j] = true;
							}
						}
					}
					else {
						if(isSpaceSensitive){
							if(lines[i].toLowerCase().includes(wordsToFindInLine[j].toLowerCase())){
								lines[i] = lines[i].toLowerCase().replace(wordsToFindInLine[j].toLowerCase(), ""); // to make sure it doesn't find duplicate result
								wordsFoundInLine[j] = true;
							}
						}
						else {
							if(lines[i].toLowerCase().replaceAll(" ", "").includes(wordsToFindInLine[j].toLowerCase().replaceAll(" ", ""))){
								lines[i] = lines[i].toLowerCase().replaceAll(" ", "").replace(wordsToFindInLine[j].toLowerCase().replaceAll(" ", ""), ""); // to make sure it doesn't find duplicate result
								wordsFoundInLine[j] = true;
							}
						}
					}
				}
				
				var allWordsFoundInLine = true;
				for(var j = 0; j < wordsFoundInLine.length; j++){
					if(wordsFoundInLine[j] == false){
						allWordsFoundInLine = false;
						break;
					}
				}
				
				if(allWordsFoundInLine){
					if(config.IS_DEBUG_MODE_ENABLED || verbose){
						if(verbose){
							this.println(inFile + " " + message + " (Found in line number: " + (i+1) + ")" + " " + message2, "red", "bold");
						}
						else {
							console.log(inFile + " " + lineToFind + " (Found in line number: " + (i+1) + ")");
						}
					}
						
					var extraNotifications = "";
					if(checkIfIncompleteCodeLine && !lines[i].includes(";")){
						if(ignoreLineIfIncompleteCodeLineDetected){
							continue;
						}
						
						extraNotifications = ", Note: Unfinished command detected in this line.";
					}
					if(checkIfIncompleteCodeLine && notifyOnlyIfIncompleteCodeLineDetected && lines[i].includes(";")){
						continue;
					}
					
					if(checkIfMultipleCodeLinesInOneLine && lines[i].includes(";") && (lines[i].split(";").length - 1) > 1){
						extraNotifications = ", Note: Multiple commands detected in this line.";
					}
					if(checkIfMultipleCodeLinesInOneLine && notifyOnlyIfMultipleCodeLinesInOneLineDetected && lines[i].includes(";") && (lines[i].split(";").length - 1) <= 1){
						continue;
					}
					
					if(writeToFile){
						this.appendToFile("<span style='color:red; font-weight:bold;'>" + inFile + " " + message + " (Found in line number: " + (i+1) + ")" + " " + message2 + extraNotifications + "</span><br/>", filePath);
					}
						
					wordsFoundInLineNumber.push(i+1);
				}
			}
		} 
		catch(e){
			if(config.IS_DEBUG_MODE_ENABLED){
				console.log(inFile + " File not found, or something else happened!");
				console.log(e);
			}
		}
		
		if(wordsFoundInLineNumber.length == 0){
			if(config.IS_DEBUG_MODE_ENABLED){
				console.log(lineToFind + " (Line not found in file " + inFile + ")");
			}
		}
		
		if(returnLinesNumberArray){
			return wordsFoundInLineNumber;
		}
		else {
			return wordsFoundInLineNumber.length;
		}
	}
	
	this.findLinesInFile = function(linesToFind = [], inFile, returnLinesNumberArray = false, isCaseSensitive = false, isSpaceSensitive = false, verbose = false, message = "", message2 = "", writeToFile = false, filePath = null, checkIfIncompleteCodeLine = false, ignoreLineIfIncompleteCodeLineDetected = false, notifyOnlyIfIncompleteCodeLineDetected = false, checkIfMultipleCodeLinesInOneLine = false, notifyOnlyIfMultipleCodeLinesInOneLineDetected = false){
		var numberOfLinesFound = 0; 
		var linesNumberArray = [];
		
		for(var i = 0; i < linesToFind.length; i++){
			var result = this.findLineInFile(linesToFind[i], inFile, returnLinesNumberArray, isCaseSensitive, isSpaceSensitive, verbose, message, message2, writeToFile, filePath, checkIfIncompleteCodeLine, ignoreLineIfIncompleteCodeLineDetected, notifyOnlyIfIncompleteCodeLineDetected, checkIfMultipleCodeLinesInOneLine, notifyOnlyIfMultipleCodeLinesInOneLineDetected);
			if(returnLinesNumberArray){
				linesNumberArray.concat(result);
			}
			else {
				numberOfLinesFound = numberOfLinesFound + result;
			}
		}
		
		if(returnLinesNumberArray){
			return linesNumberArray;
		}
		else {
			return numberOfLinesFound;
		}
	}
	
	this.showResults = function(num_vulnerabilities_found, securitCheckName, pdfName, however = false){
		if(num_vulnerabilities_found == -1){
			this.println("Number of " + securitCheckName + "s Found in the project is: All Project", "cyan", "bold");
			this.appendToFile("<span style='color:black; font-weight:bold'>Number of " + securitCheckName + "s Found in the project is: <span style='color:blue'>All Project Vulnerable</span></span><br/>");
		}
		else {
			this.println("Number of " + securitCheckName + "s Found in the project is: " + num_vulnerabilities_found, "cyan", "bold");
			this.appendToFile("<span style='color:black; font-weight:bold'>Number of " + securitCheckName + "s Found in the project is: <span style='color:blue'>" + num_vulnerabilities_found + "</span></span><br/>");
		}
		
		if(num_vulnerabilities_found > 0 || num_vulnerabilities_found == -1){
			this.appendToFile("<span style='color:blue; font-weight:bold'><a href='"+__dirname+"\\"+pdfName+"' target='_blank'>To learn about how to fix your code and secure it against " + securitCheckName + "s, Click here</a></span><br/>");
			this.appendToFile("<span style='color:black; font-weight:bold'>Then you come back here and fix your code line by line after you've learned how to protect it!</span><br/>");
		}
		else {
			if(however){
				this.appendToFile("<span style='color:blue; font-weight:bold'><a href='"+__dirname+"\\"+pdfName+"' target='_blank'>Well done!, No vulnerability found about " + securitCheckName + " in your code. However, there are some other " + securitCheckName + " Vulnerabilities and Notifications which cannot be detected programmatically by this toolkit and needs to get your attention about it verbosly, Click Here to read more</a></span><br/>");
				this.println("Well done!, No vulnerabilities found about " + securitCheckName + " in your code, however there are some notices that you need to check them in the report.", "cyan", "bold");
			}
			else {
				this.appendToFile("<span style='color:blue; font-weight:bold'>Well done!, No vulnerabilities found about " + securitCheckName + " in your code.</span><br/>");
				this.println("Well done!, No vulnerabilities found about " + securitCheckName + " in your code.", "cyan", "bold");
			}
		}
	}
	
	this.isValid = function(str){
		if(str != "" && str != null && str != undefined){
			return true;
		}
		
		return false;
	}
	
	this.isFileExists = function(filePath){
		try { 
			if (fs.existsSync(filePath)) {
				if(config.IS_DEBUG_MODE_ENABLED){
					console.log(filePath + " file exists!");
				}
				return true;
			}
			else {
				if(config.IS_DEBUG_MODE_ENABLED){
					console.log(filePath + " file does not exist!");
				}
				return false;
			}
		}
		catch(e){
			if(config.IS_DEBUG_MODE_ENABLED){
				console.log(filePath + " file does not exist!");
				console.log(e);
			}
			return false;
		}
	}
	
	this.isUpperCaseCharExists = function(str){
		for(var i = 0; i < str.length; i++){
			var character = str.charAt(i);
			if(isNaN(character)){ // if number ignore
				var upCharacter = character.toUpperCase();
				var lowCharacter = character.toLowerCase();
				
				if(upCharacter != lowCharacter){ // if special char ignore
					if(character == upCharacter){
						return true;
					}
				}
			}
		}
		
		return false;
	}
	
	this.runShellCmd = function(cmd){
		var output = execSync(cmd).toString().trim();
		
		if(config.IS_DEBUG_MODE_ENABLED){
			console.log(output); 
		}
		
		return output;
	}
}

