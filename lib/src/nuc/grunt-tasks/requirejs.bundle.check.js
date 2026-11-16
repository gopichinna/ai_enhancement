/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
'use strict';

const _ = require('underscore');
const { join } = require('path');
const listModuleDependencies = require('./utils/list.module.dependencies');
const listBundleContents = require('./utils/list.bundle.contents');

module.exports = function (grunt) {
  grunt.registerMultiTask(
    'requirejsBundleCheck',
    'Check if bundle indexes refer to distinct collection of modules',
    function () {
      const options = this.options({
        appDir: '.',
        bundleDir: '../out-debug',
        bundles: [],
        force: false
      });
      const linefeed = grunt.util.linefeed;
      const force = options.force;
      const appDir = options.appDir;
      const bundleDir = options.bundleDir;
      const bundles = options.bundles.map(({ name }) => ({ module: name }));
      const result = {};

      // Get bundle indexes and content (all modules) and check that
      // the bundles are distinct
      try {
        getBundleIndexes();
        getBundleContents();
        compactBundleContents();
        checkBundleIndexes();
        checkBundleModulesOutOfIndex();
        if (result.index || result.outOfIndex) {
          let message = result.index
            ? 'At least one module was ' +
              'found in more than one bundle. Check content ' +
              'of bundle index modules and if bundles are ' +
              'distinct by exclusions.'
            : '';
          if (result.outOfIndex) {
            message && (message += linefeed);
            message +=
              'At least one module depends on a private ' +
              'module from other bundle. Check if your foreign ' +
              'dependencies come from foreign bundle indexes.';
          }
          throw new Error(message);
        }
        for (const bundle of bundles) {
          grunt.log.ok(
            'Bundle ' +
              bundle.module +
              ' exposes ' +
              bundle.index.length +
              ' modules from ' +
              bundle.content.length +
              ' total.'
          );
        }
        grunt.log.ok('Checking the bundle indexes succeeded.');
      } catch (error) {
        grunt.verbose.error(error.stack);
        grunt.log.error(error);
        const warn = force ? grunt.log.warn : grunt.fail.warn;
        warn('Checking the bundle indexes failed.');
      }

      // Gets the bundle indexes - direct dependencies of every bundle
      // index module
      function getBundleIndexes() {
        for (const bundle of bundles) {
          const bundleFileName = join(appDir, `${bundle.module}.js`);
          grunt.verbose.writeln(`Loading index of ${bundleFileName}...`);
          bundle.index = listModuleDependencies(bundleFileName);
          checkDuplicateModules(bundle.index, bundleFileName);
          grunt.verbose.writeln(`Bundle ${bundle.module} exposes ${bundle.index.length} modules.`);
        }
      }

      // Gets all modules in every bundle, tracing the dependencies
      // of modules in every bundle index module
      function getBundleContents() {
        for (const bundle of bundles) {
          grunt.verbose.writeln(`Loading contents of ${bundle.module}...`);
          try {
            bundle.content = listBundleContents(`${bundleDir}/${bundle.module}.js`);
            for (const module of bundle.content) {
              let { id: moduleName } = module;
              if (moduleName.endsWith('!')) {
                moduleName = moduleName.substr(0, moduleName.length - 1);
              }
              module.exposed = bundle.index.includes(moduleName);
            }
            grunt.verbose.writeln(`Bundle ${bundle.module} depends on ${bundle.content.length} modules.`);
          } catch (error) {
            grunt.verbose.error(error.stack);
            throw new Error(`When traversing dependencies of ${bundle.module}: ${error.message}`);
          }
        }
        return bundles;
      }

      // Removes common modules included in the bundle content by tracking
      // all dependencies; shared modules pulled in by the dependency
      // walking are excluded correctly by the requirejs task; the problem
      // is with modules listed explicitly in the bundle index module
      function compactBundleContents() {
        for (const currentDependency of bundles) {
          const currentBundle = bundles.find(({ module }) => module === currentDependency.name);
          if (currentDependency.exclude) {
            for (const otherDependency of currentDependency.exclude) {
              var otherBundle = bundles.find(({ module }) => module === otherDependency);
              if (otherBundle) {
                grunt.verbose.writeln(`Compacting ${currentBundle.module} against ${otherBundle.module}...`);
                currentBundle.content = currentBundle.content.filter(
                  ({ id: currentId }) => !otherBundle.content.some(({ id: otherId }) => currentId === otherId)
                );
              }
            }
          }
        }
        for (const bundle of bundles) {
          grunt.verbose.writeln(`Bundle ${bundle.module} contains ${bundle.content.length} modules.`);
        }
      }

      // Checks that if a module is included in a bundle index, no other
      // bundle, which the first bundle depends on, includes that module
      // in its content
      function checkBundleIndexes() {
        for (const currentDependency of bundles) {
          var currentBundle = bundles.find(({ module }) => module === currentDependency.name);
          if (currentDependency.exclude) {
            for (const otherDependency of currentDependency.exclude) {
              var otherBundle = bundles.find(({ module }) => module === otherDependency);
              if (otherBundle) {
                grunt.verbose.writeln(
                  'Checking index of ' + currentBundle.module + ' against ' + otherBundle.module + '...'
                );
                currentBundle.index.forEach(function (currentModule) {
                  _.chain(otherBundle.content)
                    .filter(function (otherModule) {
                      return currentModule === otherModule.id;
                    })
                    .each(function (_otherModule) {
                      grunt.log.warn(
                        'Bundle ' +
                          currentBundle.module +
                          ' includes ' +
                          currentModule +
                          ' in index, but ' +
                          otherBundle.module +
                          ' contains this module too.'
                      );
                      traceModuleInBundle(currentModule, otherBundle);
                      result.index = true;
                    });
                });
              }
            }
          }
        }
      }

      // Checks that if module A depends on module B, module B is either
      // in the same bundle or in other bundle index; module B cannot be
      // out of index in other bundle
      function checkBundleModulesOutOfIndex() {
        for (const currentDependency of bundles) {
          var currentBundle = bundles.find(({ module }) => module === currentDependency.name);
          if (currentDependency.exclude) {
            for (const otherDependency of currentDependency.exclude) {
              var otherBundle = bundles.find(({ module }) => module === otherDependency);
              if (otherBundle) {
                checkOutOfIndexModulesForTwoBundles(currentBundle, otherBundle);
                checkOutOfIndexModulesForTwoBundles(otherBundle, currentBundle);
              }
            }
          }
        }
      }

      // Checks that if module A depends on module B, module B is either
      // in the same bundle or in other bundle index; module B cannot be
      // out of index in other bundle
      function checkOutOfIndexModulesForTwoBundles(currentBundle, otherBundle) {
        grunt.verbose.writeln(
          'Checking out-of-index modules of ' + currentBundle.module + ' against ' + otherBundle.module + '...'
        );
        for (const currentModule of currentBundle.content) {
          if (!currentModule.exposed) {
            for (const otherModule of otherBundle.content) {
              if (otherModule.deps && otherModule.deps.includes(currentModule.id)) {
                grunt.log.warn(
                  'Module ' +
                    otherModule.id +
                    ' from bundle ' +
                    otherBundle.module +
                    ' includes ' +
                    currentModule.id +
                    ' from ' +
                    currentBundle.module +
                    ' which is not in bundle index.'
                );
                traceModuleInBundle(currentModule, otherBundle);
                result.outOfIndex = true;
              }
            }
          }
        }
      }

      // Traverses from the specified module down the dependency tree
      // to the main bundle module name
      function traceModuleInBundle(tracedModule, otherBundle) {
        if (otherBundle) {
          tracedModule = otherBundle.content.find(({ id }) => tracedModule === id);
        } else {
          tracedModule = findModule(tracedModule);
        }
        // Skip modules from bundles outside of this project
        if (tracedModule) {
          // FInd all modules, which depend on the traced module and
          // follow with the modules, which depend on them again
          for (const module of otherBundle.content) {
            if (module.deps && module.deps.some(dependency => dependency === tracedModule.id)) {
              grunt.log.warn(`Module ${module.id} depends on ${tracedModule.id}.`);
              if (module.dependencies) {
                for (const _parent of module.dependencies) {
                  traceModuleInBundle(module.id, otherBundle);
                }
              }
            }
          }
        }
      }

      // Looks for the module with the specified identifier
      // in all bundles; returns the first one found
      function findModule(moduleId) {
        let module;
        bundles.some(bundle => {
          module = bundle.content.find(({ id }) => moduleId === id);
          return !!module;
        });
        return module;
      }

      function checkDuplicateModules(bundleIndex, bundleFilePath) {
        // Duplicates are probably harmless, butt nevertheless, keep the code clean.
        for (let i = 0, l = bundleIndex.length; i < l; ++i) {
          const module = bundleIndex[i];
          const indexAfter = bundleIndex.indexOf(module, i + 1);
          if (indexAfter > 0) {
            throw new Error(`Bundle ${bundleFilePath} refers to ${module} at positions ${i} and ${indexAfter}.`);
          }
        }
      }
    }
  );
};
