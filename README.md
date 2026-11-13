# ASST #BETA
OWASP ASST (Automated Software Security Toolkit) | A Novel Open Source Web Security Scanner.

Note: AWSS is the older name of ASST

![alt Preview](https://github.com/OWASP/ASST/blob/main/assets/images/asst.jpg?raw=true)

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

# What's new in ASST v2

ASST v2 is a major upgrade built on the foundation of v1.0.0, the original thesis release that introduced the educational report approach. Highlights:

- **Data-flow analysis:** PHP and Node.js code is parsed, and user input is followed from request sources through variables, functions, classes and files to dangerous functions. Escaping and validation are understood for the place a value ends up in (SQL, HTML, shell, file paths, URLs). Every finding shows the path the data takes.
- **OWASP Top 10:2025:** every finding carries the 2025 category (with the 2021 one), its CWE, a severity and a confidence level. The remediation guides are refreshed for PHP 8 and current Node.js practice.
- **Reports for people and pipelines:** an interactive HTML report, plus JSON, SARIF (GitHub code scanning) and Markdown output, baselines and CI exit codes.
- **Frameworks and languages:** Laravel, WordPress and Symfony support, and a Node.js/Express scanner.
- **Software supply chain:**
  - dependencies from lock files and JavaScript libraries copied into the project;
  - end-of-life runtimes and frameworks;
  - optional OSV.dev lookups;
  - secrets detection with masked output.
- **Running systems:** opt-in, read-only live checks of the running site and a php.ini audit.
- **Tooling:** a GitHub Action, a Docker image and a benchmark harness (DVWA, NIST SARD, WordPress).

The installation steps below stay the same; ASST v2 needs Node.js 18 or newer. Configuration files from v1.0 keep working. See [CHANGELOG.md](CHANGELOG.md) for the complete list and [CONTRIBUTING.md](CONTRIBUTING.md) to add rules or languages.

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
2. Node.js Engine v18 or newer (the current LTS version is recommended)

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

Download the current LTS version of Node.js (v18 or newer) for Windows from here: https://nodejs.org/en/download select (Windows Installer (.msi)), then download, Next, Next, Next and Finish.

ASST is tested with Node.js 18, 20, 22 and 24 on Windows, Linux and macOS, so any of these versions works.

###### PS: The installation videos show ASST v1.0.0 with Node.js v12.13.0. That release remains available as tag [v1.0.0](https://github.com/OWASP/ASST/releases/tag/v1.0.0); ASST v2 requires Node.js 18 or newer.

## 3. Run ASST on Windows

Download and Extract ASST's project from this github page, rename the folder to "ASST" only, not "ASST-main", move ASST's folder next to your web project to scan it, default: "C:\xampp\htdocs\ASST"

###### Configurations:

1. Open config.js inside ASST's folder and set the name of your Web Project's folder to be scanned in DEFAULT_PROJECT_PATH_TO_SCAN variable.

2. Open config_php_lang.js inside ASST's folder: if you are using MySQL you must set the variables as explained in the file, if you are not using MySQL, just set IS_DBMS_USED variable to false, and ignore the rest, note that PHP_EXE_BIN_PATH is set to XAMPP's default location, so change it if you are using different PHP binary or different XAMPP location.

###### PS: The two config files are well explained of what to change to suit your project.

Double click on ASST.bat to run it. if it gets blocked by Windows Defender Smart Screen, allow it by clicking on More Info then Run or Run Anyway, or you can just run it using CMD command.

Run this command once to install node_modules for this project:

> $ cd C:\xampp\htdocs\ASST && npm install

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

Make sure Node.js 18 or newer is active (check with: node -v). The "n" version manager installs the current LTS version:

> $ sudo npm install n -g

> $ sudo n lts

If node -v already shows v18 or newer, you can skip the last two commands.

###### PS: The installation videos show ASST v1.0.0 with Node.js v12.13.0. That release remains available as tag [v1.0.0](https://github.com/OWASP/ASST/releases/tag/v1.0.0); ASST v2 requires Node.js 18 or newer.

## 3. Run ASST on Ubuntu

Download and Extract ASST's project from this github page, using a browser, wget or git, rename the folder to "ASST" only, not "ASST-main", move ASST's folder next to your web project to scan it, default: "/opt/lampp/htdocs/ASST"

###### Configurations:

1. Open config.js inside ASST's folder using nano, vim or text editor and set the name of your Web Project's folder to be scanned in DEFAULT_PROJECT_PATH_TO_SCAN variable.

2. Open config_php_lang.js inside ASST's folder: if you are using MySQL you must set the variables as explained in the file, if you are not using MySQL, just set IS_DBMS_USED variable to false, and ignore the rest, note that PHP_EXE_BIN_PATH is set to XAMPP's default location, so change it if you are using different PHP binary or different XAMPP location.

###### PS: The two config files are well explained of what to change to suit your project.

Run this command once to install node_modules for this project:

> $ cd /opt/lampp/htdocs/ASST && sudo npm install

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

Make sure Node.js 18 or newer is active (check with: node -v). The "n" version manager installs the current LTS version:

> $ sudo npm install n -g

> $ sudo n lts

If node -v already shows v18 or newer, you can skip the last two commands.

###### PS: The installation videos show ASST v1.0.0 with Node.js v12.13.0. That release remains available as tag [v1.0.0](https://github.com/OWASP/ASST/releases/tag/v1.0.0); ASST v2 requires Node.js 18 or newer.

## 3. Run ASST on MacOSX

Download and Extract ASST's project from this github page, using a browser or git, rename the folder to "ASST" only, not "ASST-main", move ASST's folder next to your web project to scan it, default: "/Applications/XAMPP/htdocs/ASST"

###### Configurations:

1. Open config.js inside ASST's folder using text editor, put the name of your Web Project's folder to be scanned in DEFAULT_PROJECT_PATH_TO_SCAN variable.

2. Open config_php_lang.js inside ASST's folder: if you are using MySQL you must set the variables as explained in the file, if you are not using MySQL, just set IS_DBMS_USED variable to false, and ignore the rest, note that PHP_EXE_BIN_PATH is set to XAMPP's default location, so change it if you are using different PHP binary or different XAMPP location.

###### PS: The two config files are well explained of what to change to suit your project.

Run this command once to install node_modules for this project:

> $ cd /Applications/XAMPP/htdocs/ASST && sudo npm install

To run ASST, default command:

> $ sudo node /Applications/XAMPP/htdocs/ASST/main.js

# Using ASST v2

Running `node main.js` (or `ASST.bat` / `ASST.sh`) works exactly as shown in the videos: ASST scans the folder set in `config.js` and writes `report.html` next to `main.js`. Everything below is optional.

## Command-line options

| Option | Purpose |
|---|---|
| `--path <folder>` | Folder to scan (instead of `DEFAULT_PROJECT_PATH_TO_SCAN`) |
| `--lang php\|nodejs\|auto` | Scanner to use (default: `USED_PROGRAMMING_LANGUAGE`, which is `php`) |
| `--format html,json,sarif,md` | Report formats to write |
| `--out <folder or file.html>` | Where the reports are written |
| `--min-severity <level>`, `--min-confidence <level>` | Reporting thresholds (default confidence: medium) |
| `--fail-on <severity>` | Exit with code 1 when a finding reaches this severity (for CI) |
| `--exclude <glob>`, `--include-vendor` | Skip paths, or also scan `vendor/` and `node_modules/` |
| `--rules <prefixes>`, `--disable-rules <prefixes>` | Run only some rules, or skip some (for example `PHP-XSS`) |
| `--baseline <file>`, `--update-baseline <file>` | Compare with an earlier scan, or record the current findings |
| `--second-order` | Also treat stored data (database rows, session, files) as untrusted |
| `--online` | Check dependencies on OSV.dev and refresh lifecycle dates (see the privacy note below) |
| `--url <url>`, `--allow-remote` | Opt-in live checks of the running site |
| `--no-db`, `--php-bin <path>` | Skip the database checks, or choose the PHP binary for the runtime checks |
| `--quiet`, `--no-color`, `--version`, `--help` | Output control |

Run `node main.js --help` for the complete list. Most options can also be set in `config.js` or with `ASST_*` environment variables.

Exit codes:
- `0`: the scan completed;
- `1`: there are findings at or above `--fail-on`;
- `2`: the scan could not run.

## Reports

- `report.html`: an interactive report that works offline: search, filters, grouping, code snippets, data-flow traces, the matching remediation guide section, dark mode and print layout. The PDF guides are linked as before.
- `report.json`: machine-readable results (schema `asst-report/1`).
- `report.sarif`: SARIF 2.1.0 for GitHub code scanning and IDE viewers.
- `report.md`: a Markdown summary for pull requests and CI job summaries.

## Continuous integration and the GitHub Action

```yaml
name: ASST
on: [push, pull_request]
permissions:
  contents: read
  security-events: write
jobs:
  asst:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: OWASP/ASST@v2.0.0
        with:
          path: .
          language: auto
          fail-on: high
```

The action installs ASST, scans the repository, uploads the SARIF report to code scanning and adds the Markdown summary to the job page. Inputs: `path`, `language`, `fail-on` (or `none`), `min-confidence`, `formats`, `output`, `upload-sarif`, `online` and `extra-args`. In other CI systems, run `npm ci` in the ASST folder and then `node main.js --path <project> --format sarif,md --fail-on high`.

## Node.js projects

Set `USED_PROGRAMMING_LANGUAGE: "nodejs"` in `config.js`, or run `node main.js --lang nodejs --path ../my-express-app`. ASST checks:
- the JavaScript and TypeScript code of Express-style applications;
- templates: EJS, Handlebars, Pug, Nunjucks and Vue;
- dependencies and configuration.

`--lang auto` chooses the scanner from the project's files.

## Live checks (authorized use only)

`node main.js --url http://localhost/YourProject/` also checks the running site:
- security headers, cookies, version banners, the HTTPS redirect and CORS;
- PHP error output and directory listings;
- whether backups, database dumps, `.env` files or `.git` data found in the code can actually be downloaded.

The checks are read-only. They send GET and HEAD requests only (at most 60, five per second) and never submit forms. They contact only localhost and private networks unless `--allow-remote` is given. Only scan sites you own or are explicitly authorized to test.

## Dependencies, secrets and privacy

ASST lists the packages from `composer.lock`, `package-lock.json` and `yarn.lock`, and recognizes JavaScript libraries copied into the project. Advisories for common front-end libraries and the end-of-life dates ship with ASST, so no network access is needed.

With `--online` (or `ONLINE_CHECKS: true`), ASST also:
- asks [OSV.dev](https://osv.dev) about every package;
- refreshes lifecycle dates from [endoflife.date](https://endoflife.date).

Only package names, versions and product names are sent, and the answers are cached in `.asst-cache/` for a day.

Secrets (API keys, tokens, private keys, passwords) are reported with masked values. The secret itself never appears in a report.

## Docker

```bash
docker build -t asst .
docker run --rm -v "$PWD:/src:ro" -v "$PWD/asst-out:/out" asst
docker run --rm -v "$PWD:/src:ro" -v "$PWD/asst-out:/out" asst --lang nodejs --format html,sarif --fail-on high
```

The container scans `/src`, writes the reports to `/out` and runs as an unprivileged user. Database and PHP runtime checks are switched off inside the container. The PDF guide links in the HTML report point to the container's copy; the Markdown guide sections are embedded in the report itself.

## Suppressing findings

- **Inline:** add `asst-ignore[RULE-ID] reason` in a comment on the reported line or on the line above it.
- **Paths:** list globs in `.asstignore` or `EXCLUDE_PATHS`, or use `--exclude`.
- **Baselines:** `--update-baseline asst-baseline.json` records the current findings. Later scans with `--baseline asst-baseline.json` mark findings as new or unchanged and list the fixed ones.

## Good to know

- On Windows, the first scan of a large project can take noticeably longer than later ones, while the antivirus checks each file for the first time.
- The PHP runtime checks use the PHP binary set in `config_php_lang.js` (XAMPP by default). The web server can load a different `php.ini`, so the report says which file was checked.
- Benchmark results for DVWA, the NIST SARD PHP suite and WordPress are in [bench/RESULTS.md](bench/RESULTS.md).

## Limitations

Static analysis cannot prove that code is free of vulnerabilities. ASST follows data through the code it can see, so some cases can be missed:
- values passed through variable variables, magic methods, reflection, generated code or external services;
- access-control and business-logic flaws, which need manual review (the report lists what to check).

Some findings may need a second look, which is why each one has a confidence level. Templates are checked for unescaped output rather than fully parsed. The Node.js scanner covers Express-style frameworks; Koa, NestJS decorators and Next.js API routes are not modeled yet.

# Special Thanks

Special Thanks to:

1. Assist. Prof. Dr. Ece Gelal Soyak: https://scholar.google.com.tr/citations?user=w-RBj5QAAAAJ&hl=en
2. Assist. Prof. Dr. Selçuk Baktır: https://scholar.google.com/citations?user=iwR7YF8AAAAJ&hl=en
3. Assist. Prof. Dr. Özgül Küçük: https://scholar.google.com/citations?user=qJJSkrAAAAAJ&hl=en
4. OWASP Foundation

For making this toolkit possible by providing their guidance and help.
