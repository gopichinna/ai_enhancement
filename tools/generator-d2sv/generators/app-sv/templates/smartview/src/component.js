'use strict';

const { join } = require('path');
const { existsSync } = require('fs-extra');
const selfDir = __dirname;
const {svf: {name: svfName, deps: svfDependencies}} = require(join(selfDir, '../package.json'));

let nucCompPath = join(__dirname, '../lib/src/nuc/component');
if (!existsSync(`${nucCompPath}.js`)) {
  nucCompPath = join(__dirname, '../nuc/component');
  if (!existsSync(`${nucCompPath}.js`)) {
    throw new Error(`Neither ../lib/src/nuc nor ../nuc found for ${svfName}`);
  }
}

const
  nucComponent = require(nucCompPath),
  bundlePrefix = svfName,
  bundleNames = [`${svfName}-bundle`],
  bundlePath = join(selfDir, 'bundles');

module.exports = {
  // Return all module bundle names built by this component
  getBundleNames: function () {
    return bundleNames.slice();
  },

  // Return all public modules exposed via bundle indexes in this component
  getAllModules: function () {
    return nucComponent.getAllComponentModules(bundleNames, bundlePath, bundlePrefix);
  },

  //List of all RequireJS plugins exposed publicly by this component
  getAllRequireJsPlugins: function() {
    return [];
  },

  getRequireJsPluginPaths: function() {
    return {
      //Key value pairs, where key is set to publicly exposed RequireJS plugin name and value is set to relative path from 'src' directory to the js file
      //implementing the RequireJS plugin.
    };
  },

  getSVFDependencies: function() {
    return svfDependencies;
  },

  isScriptModule: {
    exclude: {
      // Do not transpile 3rd party libraries, which are not in AMD format
      startsWith: ['/lib/'],
      equals: [`/${svfName}-init.js`]
    }
  }
};
