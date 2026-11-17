/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
'use strict';

const { writeFileSync } = require('fs');
const listModuleDependencies = require('./utils/list.module.dependencies');

module.exports = function (grunt) {
  grunt.registerMultiTask(
    'requirejsBundleIndex',
    'Generate an index module defining content of all bundles',
    function () {
      const linefeed = grunt.util.linefeed;
      const options = this.options({
        bundleIndexes: {}
      });
      const bundleIndexes = options.bundleIndexes;
      const prefix =
        options.prefix ||
        (Object.keys(bundleIndexes).length && /^bundles\/(\w+)-/.exec(Object.keys(bundleIndexes)[0])[1]);

      if (this.filesSrc.length) {
        generateBundleIndex(this.name, this.filesSrc, this.data.dest);
      } else {
        for (const bundleIndex in bundleIndexes) {
          const bundles = bundleIndexes[bundleIndex].map(name => `${name}.js`);
          generateBundleIndex(bundleIndex, bundles, bundleIndex);
        }
      }

      function generateBundleIndex(bundleName, dependencies, outputIndex) {
        const moduleList = dependencies.map(function (bundlePath) {
          grunt.verbose.writeln(`Processing bundle specification module ${bundlePath}`);
          try {
            const bundleIndex = listModuleDependencies(bundlePath);
            const dependencyText = bundleIndex
              .map(module => {
                // Remove 'i18n!...' prefix rom llocalization modules.
                // Bundle content does not contain a 'i18n!...' module
                // with precompiled localization; it contains master
                // and root modules and that's why bundle index should
                // also point to he master module, at least, so that
                // the i18n plugin gets executed durint runtime
                if (module.startsWith('i18n!')) {
                  module = module.substr(5);
                }
                return `'${module}',`;
              })
              .join(linefeed)
              // JavaScript allows a trailing comma, but JSON does not
              .replace(/,\s*$/g, '');
            const bundleId = bundlePath.replace(/\.\w+$/, '');
            return `'${prefix}/${bundleId}': [${linefeed}${dependencyText}${linefeed}]`;
          } catch (error) {
            grunt.verbose.error(error.stack);
            grunt.log.error(error);
            grunt.fail.warn(`Generating the bundle index for ${bundleName} failed`);
          }
        });

        // Write the .js file as a require config module declaring twe
        const bundleIndexJavaScriptPath = `${outputIndex}.js`;
        const bundleIndexJavaScriptText = Array.prototype.concat
          .call(['require.config({', '  bundles: {'], [moduleList.join(`,${linefeed}`)], ['  }', '});'])
          .join(linefeed);
        grunt.log.writeln(`Writing JavaScript bundle index ${bundleIndexJavaScriptPath}`);
        writeFileSync(bundleIndexJavaScriptPath, bundleIndexJavaScriptText);

        // Write the .json file as an object be concatenated with the others later
        const bundleIndexJSONPath = `${outputIndex}.json`;
        const bundleIndexJSONText = Array.prototype.concat
          .call(['{'], [moduleList.join(`,${linefeed}`)], ['}'])
          .join(linefeed)
          // JSON allows double quotes only
          .replace(/'/g, '"');
        grunt.log.writeln(`Writing JSON bundle index ${bundleIndexJSONPath}`);
        writeFileSync(bundleIndexJSONPath, bundleIndexJSONText);
      }
    }
  );
};
