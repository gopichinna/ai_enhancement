/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
// Creates build and editor configuration files for RequireJS:
//   src/config-build.js
//   config-editor.js
//
// function createRequireConfigs(configObject, configOptions?)
//   configObject:  part of the build configuration (at least the dependencies)
//   configOptions:
//     buildConfig:  output file to write the build configuration to
//                   ('config-build.js' by default)
//     editorConfig: output file to write the editor configuration to
//                    ('../config-editor.js' by default)
//     nucleusPath:  relative path to nucleus source directory
//                   ('../lib/src/nuc' by default)
//
// Example from `src/Gruntfile.js` in the `Greetings` component:
//
// require('../lib/src/nuc/grunt-tasks/utils/create.build.config')({
//   prefix: 'greet', dependencies: ['csui'] // 'nuc' is always included
// });
//
// Alternative way supplying the object for `require.config` directly:
//
// require('../lib/src/nuc/grunt-tasks/utils/create.build.config')({
//   paths: {
//     nuc:   'empty:',
//     csui:  'empty:',
//     greet: '.'
//   }
// });
//
// You can combine the prefix & dependencies and paths & map ways together.
// The contents of paths & map will win in case of conflicts.
//
// The config-build and config-editor files will be overwritten only if they
// do not start with a line-comment. If you edit the file locally and you do
// not want to be updated whenever you run `grunt`, add a comment on its first
// line.
//
// This module is supposed to be used with the current directory set to `src`
// of the particular Smart UI project. If you set teh current directory to
// some other directory, set `buildConfig`, `editorConfig` and `nucleusPath`.

'use strict';

const { accessSync, constants, existsSync, readFileSync, writeFileSync } = require('fs');
const { dirname, join, isAbsolute } = require('path');

module.exports = function createRequireConfigs(configObject, buildOptions, alternativeNucleusPath) {
  // Infer paths from prefix and dependencies.
  if (configObject.prefix) {
    const dependencies = configObject.dependencies || [];
    if (!dependencies.includes('nuc')) {
      dependencies.push('nuc');
    }
    // Remember the original paths if they were provided.
    const originalPaths = configObject.paths;
    configObject.paths = { [configObject.prefix]: '.' };
    for (const dependency of dependencies) {
      configObject.paths[dependency] = 'empty:';
    }
    // Let the original paths override the simplified syntax.
    Object.assign(configObject.paths, originalPaths);
    // Do not leave items not recognised by RequireJS in the configuration.
    delete configObject.prefix;
    delete configObject.dependencies;
  }

  // Compatibility - buildOptions used to be a string called buildConfig.
  if (typeof buildOptions !== 'object') {
    buildOptions = { buildConfig: buildOptions };
  }
  // Compatibility - nucleusPath used to be the third parameter.
  if (alternativeNucleusPath) {
    buildOptions.nucleusPath = alternativeNucleusPath;
  }

  // Default parameter values.
  const {
    buildConfig = 'config-build.js',
    editorConfig = '../config-editor.js',
    nucleusPath = '../lib/src/nuc'
  } = buildOptions;

  console.log('Generating the build configuration.');

  // RequireJS plugins provided by the components depended on.
  const srcPath = nucleusPath.replace(/\/nuc$/, '');
  for (const compPrefix in configObject.paths) {
    const configPath = configObject.paths[compPrefix];
    // Skip the components that are not excluded. They do not need to
    // re-include some modules for the build like the RequireJS plugins.
    if (configPath !== 'empty:') continue;

    let compModule = `${srcPath}/${compPrefix}/component`;
    // Relative paths in Node.js modules are resolved against the script
    // source directory; not against the process current directory, where
    // the Smart UI components are installed.
    if (!isAbsolute(compModule)) {
      compModule = `${process.cwd()}/${compModule}`;
    }

    // The paths configuration can point to directories with pre-bundled
    // libraries, which are no Smart UI projects.
    try {
      require.resolve(compModule);
    } catch (error) {
      console.warn(`  "${compPrefix}" is not a Smart UI component`);
      continue;
    }

    try {
      const { getRequireJsPluginPaths } = require(compModule);
      if (getRequireJsPluginPaths) {
        const pluginPaths = getRequireJsPluginPaths();
        const pathCount = Object.keys(pluginPaths).length;
        const pathText = pathCount === 1 ? 'path' : 'paths';
        console.log(`  Adding ${pathCount} ${pathText} from "${compPrefix}".`);
        for (const sourceModule in pluginPaths) {
          // Modules base their paths on theur `src` directory.
          configObject.paths[sourceModule] = `../lib/src/${compPrefix}/${pluginPaths[sourceModule]}`;
        }
      }
    } catch (error) {
      console.warn(`  Loading the component descriptor for "${compPrefix}" failed:`);
      console.warn(`  Current directory: "${process.cwd()}".`);
      console.warn(`  ${error.stack}`);
    }

    let compExtensions = join(dirname(compModule), `${compPrefix}-extensions.json`);
    try {
      // compatibility module map for loading the modules by their original names
      const { rename } = require(compExtensions);
      if (rename) {
        configObject.rename = Object.assign(configObject.rename || {}, rename);
        const entryCount = Object.keys(rename).length;
        const entryText = entryCount === 1 ? 'entry' : 'entries';
        console.log(`  Adding ${entryCount} renaming map ${entryText} from "${compPrefix}".`);
      }
    } catch (error) {
      console.warn(`  Loading the component extensions for "${compExtensions}" failed:`);
      console.warn(`  Current directory: "${process.cwd()}".`);
      console.warn(`  ${error.stack}`);
    }
  }

  if (configObject.rename) {
    // duplicate the renamed modules to the starMap to support build and other
    // tools than need to track the remapped modules by the standard property
    // (the rename map is be used during the runtime to remap both old and new
    //  module names)
    configObject.map = Object.assign({ '*': {} }, configObject.map);
    ensureRenameMapMerged(configObject.map['*']);
  }

  // Duplicates those entries in starMap, which include an old
  // module name as the key with the new module name as the key.
  // Keep this consistent with config.js
  function ensureRenameMapMerged(starMap) {
    var rename = configObject.rename;
    Object.keys(rename).forEach(function (oldName) {
      var newName = rename[oldName];
      if (!starMap[newName]) {
        // If the new name is not mapped, duplicate
        // the mapping of the old name.
        var mappedName = starMap[oldName];
        if (mappedName) {
          starMap[newName] = mappedName;
        }
      }
      if (!starMap[oldName]) {
        // If the old name is not mapped, duplicate
        // the mapping of the new name if present,
        // otherwise rename the old to the new name.
        starMap[oldName] = starMap[newName] || newName;
      }
    });
    delete configObject.rename;
  }

  // Common configuration of RequireJS plugins from Nucleus.
  configObject.hbs = Object.assign(
    {
      disableI18n: true,
      disableHelpers: true,
      templateExtension: 'hbs'
    },
    configObject.hbs
  );
  configObject.less = Object.assign({
    sourceMap: {
      sourceMapFileInline: true
    }
  });

  const buildContent = `require.config(${JSON.stringify(configObject, undefined, 2)});`;

  // If config-build exists and is is not writable, an error will be thrown.
  // This file is critical for the build and the initial migration required
  // it to be always re-generated.
  if (needsUpdate(buildConfig)) {
    console.log(`  Writing ${buildConfig}.`);
    writeFileSync(buildConfig, buildContent);
  }

  // If config-editor exists and is not writable, it will be ignored. This file
  // is not critical and the initial Nucleus migration did not include it.
  let updateEditor = true;
  try {
    updateEditor = needsUpdate(editorConfig);
  } catch {
    console.log(`  Ignoring not writable ${editorConfig}.`);
    updateEditor = false;
  }
  if (updateEditor) {
    console.log(`  Writing ${editorConfig}.`);
    writeFileSync(editorConfig, buildContent);
  }

  console.log('Done.\n');

  // Let the file updated only if it does not start with a line-comment,
  // which means that it was customised and must not be overwritten.
  function needsUpdate(fileName) {
    if (existsSync(fileName)) {
      accessSync(fileName, constants.R_OK | constants.W_OK);
      const buildConfigContent = readFileSync(fileName, 'utf8');
      if (buildConfigContent.startsWith('//')) {
        console.log(`  Ignoring customised ${fileName}.`);
        return false;
      }
    }
    return true;
  }
};
