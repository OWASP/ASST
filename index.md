---

layout: col-sidebar
title: OWASP ASST
tags: asst web-vulnerability-scanners cybersecurity owasp-top-10 owasp vulnerability-scanners web-vulnerability-scanner vulnerability-detection vulnerability-scanner vulnerability-assessment security-assesment security-tools security-assessments security-audit security-hardening security-testing
level: 1
type: Tool
pitch: OWASP ASST (Automated Software Security Toolkit) | A Novel Open Source Web Security Scanner.

---

# OWASP ASST #BETA
OWASP ASST (Automated Software Security Toolkit) | A Novel Open Source Web Security Scanner.

Note: AWSS is the older name of ASST

# Introduction
Web applications have become an integral part of everyday life, but many of these applications are deployed with critical vulnerabilities that can be fatally exploited. As the technology used to develop these applications become sophisticated, so do the attackers’ techniques. Attackers no longer need physical access to the victims, they can attack more than one at the same time and the possibility of being caught and brought to justice is minimal.
Automated web vulnerability scanners have been heavily used to assess the security of web applications. They can improve the efficiency of vulnerability scanning compared to traditional manual vulnerability detection that are time-consuming, labor-intensive, and inefficient. There are a lot of web vulnerability scanners on the Internet, however, they do not explain the possible attack and how to have counter- measurements against it. 
We designed and implemented a new automated web vulnerability scanner called Automated Software Security Toolkit (ASST), which scans a web project’s source code and generates a report of the results with detailed explanation about each possible vulnerability and how to secure against it. We have tested the performance of ASST, and compared its results with other major open source vulnerability scanners. Our results show that ASST can identify web software security vulnerabilities more comprehensively and accurately.

NOTE: It is Still under development, Please, report for any error you get.

# What is ASST?
ASST is an Open Source, Source Code Scanning Tool, it is a CLI (Command Line Interface) application, developed with JavaScript (Node.js framework).

Currently concentrates on PHP and MySQL programming languages, but since its core functionalities are ready and available for everyone, programmers can contribute and add plugins or extensions to it, to add features and make it scan for other programming languages such as Java, C#, Python, etc.., and their frameworks. So its infrastructure is designed to be contributed with other programmers to make it better and more novel.

The best of our knowledge, ASST is the only tool that scans PHP language according to OWASP Top 10 Web Application Security Risks.

# How ASST Teaches Developers of How to Secure their Codes ?
When ASST scans for a project it checks each and every file line by line for security vulnerabilities. If a vulnerability was detected, it will alert in the report at which line in which file a vulenrability was detected and a "Click Here" link to explain the attack and how to secure against it.

ASST's results are showed as HTML Report linked with PDF files to explain each attack and its protection mechanism.

# How to Contribute?
- ASST can be easily extended to support other programming languages that may be scanned for vulnerabilities. The project is open source therefore, programmers with expertise in cyber security can contribute or fork the toolkit and add features. Other programming languages such as Python, C#, Java or Node.js itself can be added to be scanned for vulnerabilities as backend server code.

- If you are a security experienced developer, you can contribute to make this current version better, or you can contribute into adding new programming languages to be scanned.
But there are rules needs to be followed while improving it:
1. The Core codes shouldn’t be changed, while you can suggest for better ones or adding new ones to be used if well justified its need.
2. A specific Language Core Code can be changed if it can be made better.
3. If you want to add a new language, you need to follow the same code design and file structure of the project.

# How to install and run it?
To let ASST work 100%, you will need to install:
1. localhost on your PC, we recommend (XAMPP).
2. Node.js Engine v12.13.0

- The best usage of ASST is to run it directly on Online Production Server, and scan the project(s) in it. because ASST also checks Server's PHP and MySQL Versions if they are outdated or not.

# A) Install ASST On Windows

> Full Video of how to run ASST on Windows: https://youtu.be/FKxDa3zYz1E

## 1. XAMPP on Windows
You can download XAMPP for windows from here: https://www.apachefriends.org/download.html choose the version of PHP that suits your project, if you don't know which version to pick, just pick the first one for windows.

After downloading and installing XAMPP (Next, Next, Next, Finish), run XAMPP Control Panel, you can type XAMPP in Start Menu Search Field then you will see it, run it, Next To Apache and MySQL labels press start (two buttons).

###### PS: 

1. Make sure your PC doesn't have Virtual Machine program installed because XAMPP and Virtual Machine get conflicted on Ports, you will have to force close the VM background services using Task Manager (Google it, if you don't know what i am talking about).

2. Make sure Skype program is closed (Even from the tray bar), because they also get conflicted on Ports, you can run skype after you start XAMPP.

Place your Project's folder in htdocs: default: "C:\xampp\htdocs\YourProjectFolderName"

Open browser, type: localhost/phpmyadmin, create empty database, import your project_database.sql file to it, open your project's folder and change your project's config file to connect to MySQL's localhost: default configs are: host: "localhost" or "127.0.0.1", username: "root", password: "" (Empty_String), database name: "dbname_you_chose_in_phpmyadmin"

## 2. Node.js on Windows

You must download a specific version of Node.js for windows from here: https://nodejs.org/en/blog/release/v12.13.0/ select (Windows 64-bit Installer), then download, Next, Next, Next and Finish.

We are not keeping up with nodejs upgrades every month, so if you would like to test it on your own, you can download latest node.js version from here: https://nodejs.org/en/download/ choose (Windows Installer (.msi)), download and run it, Next, Next, Next and Finish.

###### PS: Downloading latest Node.js Engine may require you to update ASST's modules, so if you know what you are doing and you have time, and want to contribute, you can report your latest version of node.js and update modules and ask us to commit it on the repo if it works.

## 3. Run ASST on Windows

Download and Extract ASST's project from this github page, rename the folder to "ASST" only, not "ASST-main", move ASST's folder next to your web project to scan it, default: "C:\xampp\htdocs\ASST"

###### Configurations:

1. Open config.js inside ASST's folder and set the name of your Web Project's folder to be scanned in DEFAULT_PROJECT_PATH_TO_SCAN variable.

2. Open config_php_lang.js inside ASST's folder: if you are using MySQL you must set the variables as explained in the file, if you are not using MySQL, just set IS_DBMS_USED variable to false, and ignore the rest, note that PHP_EXE_BIN_PATH is set to XAMPP's default location, so change it if you are using different PHP binary or different XAMPP location.

###### PS: The two config files are well explained of what to change to suit your project.

Double click on ASST.bat to run it. if it gets blocked by Windows Defender Smart Screen, allow it by clicking on More Info then Run or Run Anyway, or you can just run it using CMD command.

default CMD command to run ASST:

> $ node C:\xampp\htdocs\ASST\main.js

# B) Install ASST On Linux (Ubuntu)

> Full Video of how to run ASST on Ubuntu: https://youtu.be/XrAB8_BHxfo

## 1. XAMPP on Ubuntu
Using a web browser, open this link: https://www.apachefriends.org/download.html and look for "XAMPP for Linux" section, choose the PHP version that suits your project and download it, if you don't know which version to pick, just pick the first one.
Or you can download XAMPP through terminal using "wget" command(tool), but you will need to have and know the correct url version to download.

Now working in Terminal: 
> $ cd Downloads

> $ ls

You should see the XAMPP setup file you downloaded.

> $ sudo chmod +x xampp-linux-*

> $ sudo ./xampp-linux-*

Wait a second for the setup to run, then follow the instructions. After downloading and installing XAMPP, run it.
> $ sudo /opt/lampp/lampp start

Place your Project's folder in htdocs: default: "/opt/lampp/htdocs/YourProjectFolderName"

Open browser, type: localhost/phpmyadmin, create empty database, import your project_database.sql file to it, open your project's folder and change your project's config file to connect to MySQL's localhost: default configs are: host: "localhost" or "127.0.0.1", username: "root", password: "" (Empty_String), database name: "dbname_you_chose_in_phpmyadmin"

## 2. Node.js on Ubuntu

> $ sudo apt-get install nodejs -y

> $ sudo apt-get install npm -y

You must set a specific version of Node.js to let ASST works without any problem.

> $ sudo npm install n -g

> $ sudo n 12.13.0

We are not keeping up with nodejs upgrades every month, so if you would like to test it on your own, you can ignore the last two commands of installing "n" using npm

###### PS: Using latest Node.js Engine may require you to update ASST's modules, so if you know what you are doing and you have time, and want to contribute, you can report your latest version of node.js and update modules and ask us to commit it on the repo if it works.

## 3. Run ASST on Ubuntu

Download and Extract ASST's project from this github page, using a browser, wget or git, rename the folder to "ASST" only, not "ASST-main", move ASST's folder next to your web project to scan it, default: "/opt/lampp/htdocs/ASST"

###### Configurations:

1. Open config.js inside ASST's folder using nano, vim or text editor and set the name of your Web Project's folder to be scanned in DEFAULT_PROJECT_PATH_TO_SCAN variable.

2. Open config_php_lang.js inside ASST's folder: if you are using MySQL you must set the variables as explained in the file, if you are not using MySQL, just set IS_DBMS_USED variable to false, and ignore the rest, note that PHP_EXE_BIN_PATH is set to XAMPP's default location, so change it if you are using different PHP binary or different XAMPP location.

###### PS: The two config files are well explained of what to change to suit your project.

To run ASST, default command:

> $ sudo node /opt/lampp/htdocs/ASST/main.js

# C) Install ASST On MacOSX

> Full Video of how to run ASST on MacOSX: https://youtu.be/IThRZEQVa7M

## 1. XAMPP on MacOSX
Using a web browser, open this link: https://www.apachefriends.org/download.html and look for "XAMPP for OSX" section, choose the PHP version that suits your project and download it, if you don't know which version to pick, just pick the first one.

Open Downloads Folder and double click on the xampp-osx-.dmg file you downloaded. then install: Next, Next, Next, Finish.

After installation, open Applications Folder using Finder and open XAMPP folder, click on manager-osx.app to open XAMPP Control Panel, click on Manage Servers tab then click Start All button.

Place your Project's folder in htdocs: 
1. Using Finder, open Applications then navigate to XAMPP folder then htdocs, then place your Project there.
2. You can use terminal: default location /Applications/XAMPP/htdocs/YourProjectFolderName

Open browser, type: localhost/phpmyadmin, create empty database, import your project_database.sql file to it, open your project's folder and change your project's config file to connect to MySQL's localhost: default configs are: host: "localhost" or "127.0.0.1", username: "root", password: "",(Empty_String), database name: "dbname_you_chose_in_phpmyadmin"

## 2. Node.js on MacOSX
There are several ways to download and install Node.js on MacOSX specified here: https://nodejs.org/en/download/package-manager/#macos

We used: brew (package system), Open Terminal:

> $ sudo /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"

> $ sudo brew install node

You must set a specific version of Node.js to let ASST works without any problem.

> $ sudo npm install n -g

> $ sudo n 12.13.0

We are not keeping up with nodejs upgrades every month, so if you would like to test it on your own, you can ignore the last two commands of installing "n" using npm

###### PS: Using the latest Node.js Engine may require you to update ASST's modules, so if you know what you are doing and you have time, and want to contribute, you can report your latest version of node.js and update modules and ask us to commit it on the repo if it works.

## 3. Run ASST on MacOSX

Download and Extract ASST's project from this github page, using a browser or git, rename the folder to "ASST" only, not "ASST-main", move ASST's folder next to your web project to scan it, default: "/Applications/XAMPP/htdocs/ASST"

###### Configurations:

1. Open config.js inside ASST's folder using text editor, put the name of your Web Project's folder to be scanned in DEFAULT_PROJECT_PATH_TO_SCAN variable.

2. Open config_php_lang.js inside ASST's folder: if you are using MySQL you must set the variables as explained in the file, if you are not using MySQL, just set IS_DBMS_USED variable to false, and ignore the rest, note that PHP_EXE_BIN_PATH is set to XAMPP's default location, so change it if you are using different PHP binary or different XAMPP location.

###### PS: The two config files are well explained of what to change to suit your project.

To run ASST, default command:

> $ sudo node /Applications/XAMPP/htdocs/ASST/main.js

# Special Thanks

Special Thanks to:

1. Assist. Prof. Dr. Ece Gelal Soyak: https://scholar.google.com.tr/citations?user=w-RBj5QAAAAJ&hl=en
2. Assist. Prof. Dr. Selçuk Baktır: https://scholar.google.com/citations?user=iwR7YF8AAAAJ&hl=en
3. Assist. Prof. Dr. Özgül Küçük: https://scholar.google.com/citations?user=qJJSkrAAAAAJ&hl=en
4. OWASP Foundation

For making this toolkit possible by providing their guidance and help.
