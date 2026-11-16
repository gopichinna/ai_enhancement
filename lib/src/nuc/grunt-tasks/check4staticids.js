/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
'use strict';

module.exports = function (grunt) {
  var fs = require('fs-extra'),
    _ = grunt.util._;

  // walk through src files (.js, .hbs) and look for static id values
  grunt.registerMultiTask(
    'checkSrc4StaticIds',
    'check for the use of static ids',

    function () {
      var taskName = this.name;
      grunt.log.debug(taskName + ': found ' + this.files.length + ' files');
      var idsFound = 0;
      _.each(this.files, function (file) {
        var src = file.src[0];
        // ignore tests and libraries
        var isTestSpec = src.search(/spec.js$/) >= 0;
        var isMock = src.search(/mock.js$/) >= 0;
        var isInTestDir = src.search(/\/test\//) >= 0;
        var isInLibDir = src.search(/^lib\//) >= 0;

        if (!(isTestSpec || isMock || isInTestDir || isInLibDir)) {
          var jsText = fs.readFileSync(src, 'utf8');

          // for looking in templates
          var regex = /\sid=['"]([a-zA-Z0-9_-]+)['"]/g;
          var searchRes = jsText.match(regex);
          if (searchRes) {
            idsFound += searchRes.length;
            grunt.log.error(src + ' has ' + searchRes.length + ' static ids: ' + searchRes);
          }
          // for looking in .js files. Will this simple approach create false positives?
          var regex2 = /\sid:\s*['"]([a-zA-Z0-9_-]+)['"]/g;
          var searchRes2 = jsText.match(regex2);
          if (searchRes2) {
            idsFound += searchRes2.length;
            grunt.log.error(src + ' has ' + searchRes2.length + ' static ids: ' + searchRes2);
          }
        }
      });
      if (idsFound > 0) {
        grunt.log.error('Found ' + idsFound + ' static ids in files');
      } else {
        grunt.log.debug('No static ids found in files');
      }
    }
  );

  // walk through all .html snapshots and look for static id values there
  grunt.registerMultiTask(
    'checkHtml4StaticIds',
    'check the snapshots for static ids',

    function () {
      var taskName = this.name;
      grunt.log.debug(taskName + ': found ' + this.files.length + ' files');
      // will gather the values and make them unique as the snapshots will find the same values repeatedly
      var idsFound = [];

      _.each(this.files, function (file) {
        var src = file.src[0];
        var htmlText = fs.readFileSync(src, 'utf8');

        // we will only report id values without numbers, assuming that the numbers are result of a _.uniqueID() mechanism.
        // this will not be perfect. Also, we are not considerate of where in the page the string is found, so this will find false positives.
        var regex = /\sid=['"]([a-zA-Z_-]+)['"]/g;
        var searchRes = htmlText.match(regex);
        if (searchRes) {
          idsFound.push(searchRes);
          grunt.log.debug(src + ' has ' + searchRes.length + ' static ids: ' + searchRes);
        }
      });
      if (idsFound.length > 0) {
        idsFound = _.uniq(_.flatten(idsFound));
        grunt.log.error('Found ' + idsFound.length + ' static ids in files: ' + idsFound);
      } else {
        grunt.log.debug('No static ids found in files');
      }
    }
  );
};
