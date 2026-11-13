'use strict';
/*
 * Compatibility layer for the original (v1.0) check implementations.
 *
 * It exposes the helper API the v1 checks were written against (findLineInFile,
 * getAllFilesPaths, showResults, ...) with the same matching semantics, backed by the
 * v2 foundation:
 *   - files come from one shared walk and are read once (FileCache)
 *   - scan/report paths are resolved against the ASST folder
 *   - report content is HTML-escaped and written in one pass
 *   - guide links are proper file:// URLs on every operating system
 *   - the PHP binary is executed without a shell
 */
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const ansi = require('./ansi');
const { runPhp } = require('./shell');

function escapeText(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function pad(n) {
  return n < 10 ? `0${n}` : String(n);
}

class LegacyCore {
  /**
   * @param {{config:object, project:{root:string, files:Array, skipped:Array}, cache:FileCache}} ctx
   */
  constructor({ config, project, cache }) {
    this.cfg = config;
    this.project = project;
    this.cache = cache;
    this.html = [];
    // The config object the v1 checks read, with resolved absolute paths.
    this.config = {
      ...config.user,
      DEFAULT_PROJECT_PATH_TO_SCAN: config.scanPath.endsWith(path.sep) ? config.scanPath : config.scanPath + path.sep,
      HTML_REPORT_FILE_NAME_AND_PATH: config.htmlPath,
      IS_DEBUG_MODE_ENABLED: config.debug,
    };
  }

  esc(value) {
    return escapeText(value);
  }

  /** file:// URL for a path relative to the ASST folder. */
  docUrl(relativeToAsst) {
    return pathToFileURL(path.resolve(this.cfg.asstRoot, relativeToAsst)).href;
  }

  replaceAll(text, search, replacement) {
    return String(text).split(search).join(replacement);
  }

  createFile(content) {
    this.html = [content];
  }

  appendToFile(content) {
    this.html.push(content);
  }

  initReport() {
    this.createFile(
      "<style>* { background-color: #f7f8f5 !important; } div {  margin: 0 auto; width: 1000px !important; } a { word-break: break-all; }</style>" +
      '<div>' +
        '<br/>' +
        '<hr/>' +
        '<center>' +
          `<h1 style='color:green;font-weight:bold;'>ASST Report @ ${this.getDateAndTime()}</h1>` +
        '</center>' +
        '<hr/>' +
      '</div>' +
      '<br/>'
    );
  }

  /** Writes the accumulated report to disk as a complete HTML document. */
  flushReport() {
    const file = this.cfg.htmlPath;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const doc = '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>ASST Report</title>\n</head>\n<body>\n' +
      this.html.join('') + '\n</body>\n</html>\n';
    fs.writeFileSync(file, doc);
    return file;
  }

  println(message, font1 = null, font2 = null, font3 = null) {
    if (this.cfg.quiet) return;
    console.log(ansi.paint(message, font1, font2, font3));
  }

  getDateAndTime() {
    const d = new Date();
    return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} - ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  showSpace() {
    this.println('');
    this.println('-----------------------------------------------------------');
    this.println('');
    this.appendToFile('<br/>');
    this.appendToFile('<hr/>');
    this.appendToFile('<br/>');
  }

  /**
   * Same contract as v1: returns absolute file paths under the scanned folder.
   * traverse=false returns the top-level entries (folders end with a separator).
   */
  getAllFilesPaths(dirPath, arrayOfFiles, traverse = true, listOnlySpecificExtensions = false, extensions = [], ignoreFilesOrFolders = []) {
    const out = arrayOfFiles || [];
    const ignore = new Set(ignoreFilesOrFolders);
    if (!traverse) {
      const seen = new Set();
      for (const f of this.project.files) {
        const top = f.rel.split('/')[0];
        if (seen.has(top) || ignore.has(top)) continue;
        seen.add(top);
        const isDir = f.rel.includes('/');
        out.push(path.join(this.project.root, top) + (isDir ? path.sep : ''));
      }
      return out;
    }
    const wanted = extensions.map((e) => String(e).toLowerCase());
    for (const f of this.project.files) {
      if (f.rel.split('/').some((segment) => ignore.has(segment))) continue;
      if (listOnlySpecificExtensions) {
        const ext = f.name.split('.').pop().toLowerCase();
        if (!wanted.includes(ext)) continue;
      }
      out.push(f.abs);
    }
    if (this.cfg.debug) console.dir(out, { maxArrayLength: null });
    return out;
  }

  findLineInFile(lineToFind, inFile, returnLinesNumberArray = false, isCaseSensitive = false, isSpaceSensitive = false, verbose = false, message = '', message2 = '', writeToFile = false, filePath = null, checkIfIncompleteCodeLine = false, ignoreLineIfIncompleteCodeLineDetected = false, notifyOnlyIfIncompleteCodeLineDetected = false, checkIfMultipleCodeLinesInOneLine = false, notifyOnlyIfMultipleCodeLinesInOneLineDetected = false) {
    const found = [];
    const cached = this.cache.lines(inFile);
    if (cached) {
      const lines = cached.slice(); // matching consumes words from a working copy
      const words = lineToFind.split(' ');
      for (let i = 0; i < lines.length; i++) {
        const foundWord = [];
        for (let j = 0; j < words.length; j++) {
          foundWord[j] = false;
          const w = words[j];
          if (isCaseSensitive) {
            if (isSpaceSensitive) {
              if (lines[i].includes(w)) { lines[i] = lines[i].replace(w, ''); foundWord[j] = true; }
            } else {
              const ww = w.replaceAll(' ', '');
              if (lines[i].replaceAll(' ', '').includes(ww)) { lines[i] = lines[i].replaceAll(' ', '').replace(ww, ''); foundWord[j] = true; }
            }
          } else if (isSpaceSensitive) {
            const lw = w.toLowerCase();
            if (lines[i].toLowerCase().includes(lw)) { lines[i] = lines[i].toLowerCase().replace(lw, ''); foundWord[j] = true; }
          } else {
            const lw = w.toLowerCase().replaceAll(' ', '');
            if (lines[i].toLowerCase().replaceAll(' ', '').includes(lw)) { lines[i] = lines[i].toLowerCase().replaceAll(' ', '').replace(lw, ''); foundWord[j] = true; }
          }
        }
        if (!foundWord.every(Boolean)) continue;

        if (this.cfg.debug || verbose) {
          if (verbose) this.println(`${inFile} ${message} (Found in line number: ${i + 1}) ${message2}`, 'red', 'bold');
          else console.log(`${inFile} ${lineToFind} (Found in line number: ${i + 1})`);
        }
        let extra = '';
        if (checkIfIncompleteCodeLine && !lines[i].includes(';')) {
          if (ignoreLineIfIncompleteCodeLineDetected) continue;
          extra = ', Note: Unfinished command detected in this line.';
        }
        if (checkIfIncompleteCodeLine && notifyOnlyIfIncompleteCodeLineDetected && lines[i].includes(';')) continue;
        if (checkIfMultipleCodeLinesInOneLine && lines[i].includes(';') && (lines[i].split(';').length - 1) > 1) {
          extra = ', Note: Multiple commands detected in this line.';
        }
        if (checkIfMultipleCodeLinesInOneLine && notifyOnlyIfMultipleCodeLinesInOneLineDetected && lines[i].includes(';') && (lines[i].split(';').length - 1) <= 1) continue;
        if (writeToFile) {
          this.appendToFile(`<span style='color:red; font-weight:bold;'>${escapeText(`${inFile} ${message} (Found in line number: ${i + 1}) ${message2}${extra}`)}</span><br/>`);
        }
        found.push(i + 1);
      }
    } else if (this.cfg.debug) {
      console.log(`${inFile} could not be read as text`);
    }
    return returnLinesNumberArray ? found : found.length;
  }

  findLinesInFile(linesToFind = [], inFile, returnLinesNumberArray = false, ...rest) {
    let total = 0;
    let numbers = [];
    for (const line of linesToFind) {
      const result = this.findLineInFile(line, inFile, returnLinesNumberArray, ...rest);
      if (returnLinesNumberArray) numbers = numbers.concat(result);
      else total += result;
    }
    return returnLinesNumberArray ? numbers : total;
  }

  showResults(count, checkName, pdfName, however = false) {
    const link = this.docUrl(path.join('core', pdfName));
    if (count === -1) {
      this.println(`Number of ${checkName}s Found in the project is: All Project`, 'cyan', 'bold');
      this.appendToFile(`<span style='color:black; font-weight:bold'>Number of ${checkName}s Found in the project is: <span style='color:blue'>All Project Vulnerable</span></span><br/>`);
    } else {
      this.println(`Number of ${checkName}s Found in the project is: ${count}`, 'cyan', 'bold');
      this.appendToFile(`<span style='color:black; font-weight:bold'>Number of ${checkName}s Found in the project is: <span style='color:blue'>${count}</span></span><br/>`);
    }
    if (count > 0 || count === -1) {
      this.appendToFile(`<span style='color:blue; font-weight:bold'><a href='${link}' target='_blank'>To learn about how to fix your code and secure it against ${checkName}s, Click here</a></span><br/>`);
      this.appendToFile("<span style='color:black; font-weight:bold'>Then you come back here and fix your code line by line after you've learned how to protect it!</span><br/>");
    } else if (however) {
      this.appendToFile(`<span style='color:blue; font-weight:bold'><a href='${link}' target='_blank'>Well done!, No vulnerability found about ${checkName} in your code. However, there are some other ${checkName} Vulnerabilities and Notifications which cannot be detected programmatically by this toolkit and needs to get your attention about it verbosly, Click Here to read more</a></span><br/>`);
      this.println(`Well done!, No vulnerabilities found about ${checkName} in your code, however there are some notices that you need to check them in the report.`, 'cyan', 'bold');
    } else {
      this.appendToFile(`<span style='color:blue; font-weight:bold'>Well done!, No vulnerabilities found about ${checkName} in your code.</span><br/>`);
      this.println(`Well done!, No vulnerabilities found about ${checkName} in your code.`, 'cyan', 'bold');
    }
  }

  isValid(str) {
    return str !== '' && str !== null && str !== undefined;
  }

  isFileExists(filePath) {
    try {
      return fs.existsSync(filePath);
    } catch (_) {
      return false;
    }
  }

  isUpperCaseCharExists(str) {
    for (const ch of String(str)) {
      if (Number.isNaN(Number(ch)) && ch.toUpperCase() !== ch.toLowerCase() && ch === ch.toUpperCase()) return true;
    }
    return false;
  }

  /** Runs a PHP snippet with the configured PHP binary; returns trimmed stdout or null. */
  runPhp(code) {
    const result = runPhp(this.phpBin, code);
    if (!result.ok && this.cfg.debug) console.log(`PHP execution failed: ${result.error}`);
    return result.ok ? result.stdout : null;
  }
}

module.exports = { LegacyCore, escapeText };
