/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
'use strict';

const { join } = require('path');
const listModuleDependencies = require('./utils/list.module.dependencies');
const listBundleContents = require('./utils/list.bundle.contents');
const parseObjectModule = require('./utils/parse.object.module');

module.exports = function (grunt) {
  grunt.registerMultiTask('languagepack', function () {
    const options = this.options({
      locale: 'en',
      bundles: [],
      bundleIndexes: {},
      inputDir: '../out-debug',
      outputDir: '../out-languagepack_en'
    });
    const linefeed = grunt.util.linefeed;
    const force = options.force;
    const locale = options.locale;
    const inputDir = options.inputDir;
    const outputDir = options.outputDir;
    const bundles = prepareBundles(options.bundles);
    const bundleIndexes = prepareBundleIndexes(options.bundleIndexes);
    const prefix = options.prefix || /^bundles\/(\w+)-/.exec(bundles[0].module)[1];

    try {
      getBundleIndexes();
      getBundleContent();
      filterBundleContent();
      writeAllBundles();
      writeAllBundleIndexes();
    } catch (error) {
      grunt.verbose.error(error.stack);
      grunt.log.error(error);
      const warn = force ? grunt.log.warn : grunt.fail.warn;
      warn('Processing bundles failed.');
    }

    // Extracts only the information needed from the bundle configuration
    // and clones it to be able to modify it here.
    function prepareBundles(bundles) {
      return bundles.map(({ name }) => ({ module: name }));
    }

    // Converts global bundle indexes from an object to an array.
    function prepareBundleIndexes(bundleIndexes) {
      return Object.keys(bundleIndexes).map(name => ({
        index: name,
        content: bundleIndexes[name]
      }));
    }

    // Ensures that the bundle content consists of localization modules only.
    function filterBundleContent() {
      for (const bundle of bundles) {
        // collect localization modules from dependencies of bundled modules
        const localizables = new Set();
        for (const module of bundle.content) {
          for (const dep of module.deps) {
            if (dep.startsWith('i18n!')) {
              localizables.add(dep.substr(5));
            }
          }
        }
        // filter out other than localization modules
        bundle.content = bundle.content.filter(module => localizables.has(module.id));
        grunt.log.writeln(`Bundle ${bundle.module} contains ${bundle.content.length} localization modules.`);
      }
    }

    // Writes out all localization bundles.
    function writeAllBundles() {
      for (const bundle of bundles) {
        if (bundle.content.length) {
          writeBundle(bundle);
        }
      }
    }

    // Writes out one localization bundle.
    function writeBundle(bundle) {
      const lines = bundle.content.map(module => {
        const fileName = moduleID2FileName(module.id);
        const result = parseObjectModule(fileName);
        return `csui.define("${getLocalizedModuleName(module)}", ${JSON.stringify(result, undefined, 2)});${linefeed}`;
      });
      const fileName = bundle.module.replace('bundles/', `bundles/nls/${locale}/`);
      grunt.file.write(join(outputDir, `${fileName}.js`), lines.join(linefeed));
    }

    // Writes out all localization bundle indexes.
    function writeAllBundleIndexes() {
      for (const bundleIndex of bundleIndexes) {
        writeBundleIndex(bundleIndex);
      }
    }

    // Writes out one localization bundle index.
    function writeBundleIndex(bundleIndex) {
      let lines = [];
      for (const contentBundleName of bundleIndex.content) {
        const contentBundle = bundles.find(bundleName => bundleName.module === contentBundleName);
        if (lines.length) {
          lines[lines.length - 1] += ',';
        }
        lines = lines.concat(singleBundleAsIndex(contentBundle));
      }
      lines = ['{'].concat(lines).concat(['}']);

      const fileName = bundleIndex.index.replace('bundles/', `bundles/nls/${locale}/`);
      const jsonContents = lines.join(linefeed);
      grunt.file.write(join(outputDir, `${fileName}.json`), jsonContents);
      const jsContent = `csui.require.config({${linefeed}bundles: ${jsonContents}${linefeed}});`;
      grunt.file.write(join(outputDir, `${fileName}.js`), jsContent);
    }

    // Generates an index from one localization bundle content.
    function singleBundleAsIndex(bundle) {
      const lines = [];
      const fileName = bundle.module.replace('bundles/', `bundles/nls/${locale}/`);

      lines.push(`  "${prefix}/${fileName}": [`);
      for (let i = 0, l = bundle.content.length; i < l; ++i) {
        const module = bundle.content[i];
        if (i > 0) {
          lines[lines.length - 1] += ',';
        }
        lines.push(`    "${getLocalizedModuleName(module)}"`);
      }
      lines.push('  ]');

      return lines;
    }

    // Converts RequireJS module ID to the file path with the source script.
    function moduleID2FileName(moduleId) {
      const nameParts = moduleId.split('/');
      nameParts.shift();
      const fileName = nameParts.pop();
      if (nameParts[nameParts.length - 1] !== 'root') {
        nameParts.push('root');
      }
      nameParts.push(fileName + '.js');
      return nameParts.join('/');
    }

    // COnverts a module ID of the localization master module to a module ID
    // of the localization module for the specified language.
    function getLocalizedModuleName(module) {
      return module.id.replace('/nls/', `/nls/${locale}/`);
    }

    // Gets all modules in every bundle, tracing the dependencies
    // of modules in every bundle index module
    function getBundleContent() {
      for (const bundle of bundles) {
        grunt.verbose.writeln(`Loading ${bundle.module}...`);
        try {
          const result = listBundleContents(`${inputDir}/${bundle.module}.js`);
          bundle.content = result;
          grunt.verbose.writeln(`Bundle ${bundle.module} depends on ${bundle.content.length} modules.`);
        } catch (error) {
          grunt.verbose.error(error.stack);
          throw new Error(`When traversing dependencies of ${bundle.module}: ${error.message}`);
        }
      }
    }

    // Gets the bundle indexes - direct dependencies of every bundle
    // index module
    function getBundleIndexes() {
      for (const bundle of bundles) {
        const bundleFileName = `${bundle.module}.js`;
        bundle.index = listModuleDependencies(bundleFileName);
        grunt.verbose.writeln(`Bundle ${bundle.module} exposes ${bundle.index.length} modules.`);
      }
    }
  });
};
