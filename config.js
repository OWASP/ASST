module.exports = {
	// Global Configs
	THIS_PROJECT_FOLDER_NAME: "ASST", // Change it only if you changed this project's folder name, // case sensitive // for Contributors (Used in core/index.js)
	IS_DEBUG_MODE_ENABLED: false, // For Debugging this Toolkit
	
	USED_PROGRAMMING_LANGUAGE: "php", // choose php // not empty! // for now only PHP supported // for Contributors (Used in main.js)
	DEFAULT_PROJECT_PATH_TO_SCAN: "../ProjectFolderToScan/", // `../` means one level up from the toolkit's folder // DO NOT PUT YOUR PROJECT TO SCAN FOR INSIDE AWSS FOLDER, you can replace this with full path such as C:\\Users\\YourUsername\\Desktop\\ProjectToScan\\ (on windows) or /home/YourUsername/ProjectToScan/ (on Linux) or /Users/YourUsername/Desktop/ProjectToScan/ (on MacOSX)
	HTML_REPORT_FILE_NAME_AND_PATH: "report.html", // default path is next to the main.js of the toolkit // you can specify full path such as C:\\Users\\YourUsername\\Desktop\\report.html (on windows) or /home/YourUsername/report.html (on Linux) or /Users/YourUsername/Desktop/report.html (on MacOSX)

	// Optional settings (ASST v2). They can stay as they are; command-line options override them (node main.js --help).
	EXCLUDE_PATHS: [], // folders/files to skip, e.g. ["tests/**", "*.min.js"] // vendor/ and node_modules/ are skipped by default
	ONLINE_CHECKS: false, // true = check dependencies on OSV.dev and refresh end-of-life dates from endoflife.date (only package names and versions are sent; same as --online)
	LIVE_SCAN_URL: "", // e.g. "http://localhost/ProjectFolderToScan/" = also check the running site with read-only GET/HEAD requests (same as --url) // localhost and private networks only
};
