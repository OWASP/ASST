module.exports = {
	// Global Configs
	THIS_PROJECT_FOLDER_NAME: "AWSS", // Change it only if you changed this project's folder name, // case sensitive // for Contributors (Used in core/index.js)
	IS_DEBUG_MODE_ENABLED: false, // For Debugging this Toolkit
	
	USED_PROGRAMMING_LANGUAGE: "php", // choose php // not empty! // for now only PHP supported // for Contributors (Used in main.js)
	DEFAULT_PROJECT_PATH_TO_SCAN: "../ProjectFolderToScan/", // `../` means one level up from the toolkit's folder // DO NOT PUT YOUR PROJECT TO SCAN FOR INSIDE AWSS FOLDER, you can replace this with full path such as C:\\Users\\YourUsername\\Desktop\\ProjectToScan\\ (on windows) or /home/YourUsername/ProjectToScan/ (on Linux) or /Users/YourUsername/Desktop/ProjectToScan/ (on MacOSX)
	HTML_REPORT_FILE_NAME_AND_PATH: "report.html", // default path is next to the main.js of the toolkit // you can specify full path such as C:\\Users\\YourUsername\\Desktop\\report.html (on windows) or /home/YourUsername/report.html (on Linux) or /Users/YourUsername/Desktop/report.html (on MacOSX)
};
