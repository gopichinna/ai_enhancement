/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
'use strict';

module.exports = function (grunt) {
  // compare number of files found with expected numbers
  grunt.registerMultiTask(
    'checkSnapshotNumbers',
    'check correct number of snapshots',

    function () {
      var name = this.name;
      var expectedNumber = this.data.options.expectedNumber;
      grunt.log.debug(name + ': ' + this.files.length + ' vs ' + expectedNumber);

      if (expectedNumber > this.files.length) {
        throw new Error(name + ': expected ' + expectedNumber + ' files but only got ' + this.files.length);
      }
    }
  );
};
