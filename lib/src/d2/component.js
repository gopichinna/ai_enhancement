/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
"use strict";

const {
  join
} = require("path");

const {
  existsSync
} = require("fs-extra");

const selfDir = __dirname;

const {
  svf: {
    name: svfName,
    deps: svfDependencies
  }
} = {
  svf: {
    name: "d2",
    deps: [ "dctmw" ]
  }
};

let nucCompPath = join(__dirname, "../lib/src/nuc/component");

if (!existsSync(`${nucCompPath}.js`)) {
  nucCompPath = join(__dirname, "../nuc/component");
  if (!existsSync(`${nucCompPath}.js`)) {
    throw new Error(`Neither ../lib/src/nuc nor ../nuc found for ${svfName}`);
  }
}

const nucComponent = require(nucCompPath), bundlePrefix = svfName, bundleNames = [ `${svfName}-core`, `${svfName}-desktop`, `${svfName}-sdk` ], bundlePath = join(selfDir, "bundles");

module.exports = {
  getAllModules: function() {
    return nucComponent.getAllComponentModules(bundleNames, bundlePath, bundlePrefix);
  },
  getAllRequireJsPlugins: function() {
    return [];
  },
  getRequireJsPluginPaths: function() {
    return {};
  },
  getSVFDependencies: function() {
    return svfDependencies;
  },
  isScriptModule: {
    exclude: {
      startsWith: [ "/lib/" ],
      equals: [ "/d2-init.js" ]
    }
  }
};