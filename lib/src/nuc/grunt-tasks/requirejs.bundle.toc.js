/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
'use strict';

const { writeFileSync } = require('fs');
const listBundleContents = require('./utils/list.bundle.contents');

module.exports = function (grunt) {
  grunt.registerMultiTask('requirejsBundleTOC', 'Generate a complete module list of the specified bundle', function () {
    const options = this.options({
      bundleDir: '../out-debug',
      bundles: [],
      optimize: true,
      force: false
    });
    const bundleDir = options.bundleDir;
    const bundles = options.bundles.map(({ name }) => name);
    const data = this.data;
    let bundlePath = data.src;
    let tocPath = data.dest;

    if (bundlePath) {
      generateBundleTOC(this.name, bundlePath, tocPath);
    } else {
      generateAllBundleTOCs();
    }

    function generateAllBundleTOCs() {
      for (const bundle of bundles) {
        bundlePath = `${bundleDir}/${bundle}.js`;
        tocPath = `${bundleDir}/${bundle}-toc.json`;
        generateBundleTOC(bundle, bundlePath, tocPath);
      }
    }

    function generateBundleTOC(bundleName, bundlePath, tocPath) {
      grunt.verbose.writeln(`Reading bundle module ${bundlePath}`);
      try {
        const bundleContents = listBundleContents(bundlePath);
        const modules = bundleContents.map(module => module.id);
        const tocContents = JSON.stringify({ modules }, undefined, options.optimize ? undefined : 2);
        grunt.log.writeln(`Writing bundle TOC ${tocPath}`);
        writeFileSync(tocPath, tocContents);
      } catch (error) {
        const warn = options.force ? grunt.log.warn : grunt.fail.warn;
        grunt.verbose.error(error.stack);
        grunt.log.error(error);
        warn(`Generating the bundle TOC for ${bundleName} failed`);
      }
    }
  });
};
