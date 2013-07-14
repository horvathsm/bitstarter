#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var util = require('util');
var fs = require('fs');
var program = require('commander');
var rest = require('restler');
var cheerio = require('cheerio');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var assertURLExists = function(url) {
   var r = rest.get(url).on('complete',function(result) {
      if (result instanceof Error) {
         console.log("%s is a bad URL",result.message);
         process.exit(1); 
      }
      else {
        console.log("URL is valid %s",url.toString());
        return url.toString();
      }
   });   
   return r; 
};


var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var cheerioHtmlURL = function(htmlurl) {
    var r = rest.get(htmlurl).on('complete',function(result) { return result; });
    return cheerio.load(r);
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile, url) {
    console.log(htmlfile);
    console.log(checksfile);
    console.log(util.inspect(url));
    if (url) {
       //console.log("checkHtmlFile - URL %s",url.request);
       $ = cheerioHtmlURL(url);
    }
    else {
       //console.log("checkHtmlFile - File"); 
       $ = cheerioHtmlFile(htmlfile);
    }
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists),CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists),HTMLFILE_DEFAULT)
        .option('-u, --url <url>','URL to get',clone(assertURLExists),null)
        .parse(process.argv);
     
    if (program.checks) console.log("Option Checks file %s", program.checks);
    if (program.file) console.log("Option File file %s",program.file);
    if (program.url) console.log("Option URL %s",program.url);

    //var checkJson = checkHtmlFile(program.file, program.checks, program.url);
    //var outJson = JSON.stringify(checkJson, null, 4);
    //console.log(outJson);
} 
else {
    exports.checkHtmlFile = checkHtmlFile;
}
