/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
// Generates a unique build number from the component version
// and the current time, allowing a new build every two minutes.
// See also https://github.com/prantlf/build-number-generator.
//
// const generate = require('./utils/generate.build.number');
// const build = generate('1.0.3');
//
// 1.0.3.180625392
// => 18-06-25, 392*2 minutes after midnight
// => 25 June 2018 1:04 PM

'use strict';

// TODO: Use the build-number-generator instead of copy&pasting it here.
//
// const { generate } = require('build-number-generator');
// module.exports = function (version) {
//   return generate(version || '1.0.0');
// };

const printf = require('printf');

module.exports = function (version) {
  const now = new Date();
  // Compute the number of the 2-minute period within the day
  // from the current time: NNN = (HH * 60 + MM) / 2
  const minutes = (now.getHours() * 60 + now.getMinutes()) / 2;
  // Format the V.YYMMDDNNN build number
  return printf(
    '%s.%02d%02d%02d%03d',
    version || '1.0.0',
    now.getFullYear() % 100,
    now.getMonth() + 1,
    now.getDate(),
    minutes
  );
};
