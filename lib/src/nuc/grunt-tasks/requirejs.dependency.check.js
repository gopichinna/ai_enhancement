/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
'use strict';

const { join } = require('path');
const parseBuildConfig = require('./utils/parse.build.config');
const listModuleDependencies = require('./utils/list.module.dependencies');
const listBundleContents = require('./utils/list.bundle.contents');

module.exports = function (grunt) {
  grunt.registerMultiTask(
    'requirejsDependencyCheck',
    'Check if your modules depend only on public modules from other components',
    function () {
      const options = this.options({
        appDir: '.',
        bundleDir: '../out-debug',
        bundles: [],
        dependencies: [],
        config: 'config-build.js',
        allowIndexedPrivateModules: false,
        force: false
      });
      const force = options.force;
      const appDir = options.appDir;
      const bundleDir = options.bundleDir;
      const bundles = options.bundles.map(name => ({ module: name.name }));
      const dependencies = options.dependencies;
      const prefix = options.prefix || /^bundles\/(\w+)-/.exec(bundles[0].module)[1];
      let config = options.config;
      let failed, warned, csuiMap;

      // Parse the main RequireJS config file
      if (typeof config === 'string') {
        config = parseBuildConfig(config);
      }
      csuiMap = (config.map && config.map['*']) || {};
      // Workaround for css-builder, which needs an output directory even
      // for the loading time. Node.js 6 complains about an undefined path.
      config.dir || (config.dir = appDir);

      // Get bundle indexes and content (all modules) and check that
      // the bundles are distinct
      try {
        getBundleIndexes();
        getBundleContent();
        checkModuleDependencies();
        if (failed) {
          throw new Error('At least one module depends on a private module from other component.');
        }
        if (warned) {
          grunt.log.warn('Checking module dependencies ended with warnings.');
        } else {
          grunt.log.ok('Checking module dependencies succeeded.');
        }
      } catch (error) {
        grunt.verbose.error(error.stack);
        grunt.log.error(error);
        const warn = force ? grunt.log.warn : grunt.fail.warn;
        warn('Checking module dependencies failed.');
      }

      // Gets the bundle indexes - direct dependencies of every bundle
      // index module
      function getBundleIndexes() {
        for (const bundle of bundles) {
          grunt.verbose.writeln(`Getting the index of ${bundle.module}...`);
          const bundleFileName = join(appDir, `${bundle.module}.js`);
          bundle.index = listModuleDependencies(bundleFileName);
          grunt.verbose.writeln(`Bundle ${bundle.module} exposes ${bundle.index.length} modules.`);
        }
      }

      // Gets all modules in every bundle, tracing the dependencies
      // of modules in every bundle index module
      function getBundleContent() {
        for (const bundle of bundles) {
          grunt.verbose.writeln(`Loading ${bundle.module}...`);
          try {
            bundle.content = listBundleContents(`${bundleDir}/${bundle.module}.js`);
            for (const module of bundle.content) {
              module.exposed = bundle.index.includes(module.id);
            }
            grunt.verbose.writeln(`Bundle ${bundle.module} depends on ${bundle.content.length} modules.`);
          } catch (error) {
            grunt.verbose.error(error.stack);
            throw new Error(`When traversing dependencies of ${bundle.module}: ${error.message}`);
          }
        }
        return bundles;
      }

      // Checks that if module A depends on module B, module B is either
      // in the same bundle or in other bundle index; module B cannot be
      // out of index in other bundle
      function checkModuleDependencies() {
        var currentPrefix = prefix + '/';
        for (const bundle of bundles) {
          for (const module of bundle.content.filter(
            ({ id, deps }) =>
              // Skip modules without dependencies, plugin aliases,
              // modules processed by plugins and all modules outside
              // this component, which woudl be excluded by requirejs.
              deps && id.includes('/') && !id.includes('!') && id.startsWith(currentPrefix)
          )) {
            for (const dependency of module.deps.filter(
              dependency =>
                // Skip plugin aliases, modules processed by plugins
                // and all modules from this component, where
                // including private modules from other budles is
                // tolerated, as long as they are in some bundle
                // index (check by requirejsBundleCheck)
                dependency.includes('/') && !dependency.includes('!') && !dependency.startsWith(currentPrefix)
            )) {
              if (!dependencies.includes(dependency) && dependency.startsWith('csui/') && !csuiMap[dependency]) {
                grunt.log.warn(
                  `Module ${module.id} depends on ${dependency}, which is not public; it does not occur in any foreign bundle index.`
                );
                failed = true;
              } else if (dependency.includes('/impl/')) {
                let logMethod;
                if (options.allowIndexedPrivateModules) {
                  logMethod = 'ok';
                  warned = true;
                } else {
                  logMethod = 'warn';
                  failed = true;
                }
                grunt.log[logMethod](
                  `Module ${module.id} depends on ${dependency}, which is private; it does occur in a foreign bundle index, but it is not guaranteed and can be removed anytime.`
                );
              }
            }
          }
        }
      }
    }
  );
};
