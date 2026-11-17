/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
// Exposes getAllModules method which returns all public modules from this
// component.  Components depending on csui can use it to exclude dependant
// csui modules from their bundles.
//
// Other components can use the additionally exposed getAllComponentModules
// method to provide their own list of public modules, similarly to nucleus.

const { readFileSync } = require('fs');
const { EOL } = require('os');
const { basename, join } = require('path');

// Describe local bundles
const bundlePrefix = 'nuc';
const bundleNames = ['nuc-loader', 'nuc-libraries', 'nuc-models', 'nuc-log4javascript', 'nuc-lessc'];
const bundlePath = join(__dirname, 'bundles');

function loadBundleIndex(bundlePath, bundlePrefix) {
  // Naive way to convert a bundle index source module to a JSON
  // array with the module name list
  const bundleLines = readFileSync(bundlePath)
    .toString()
    // Separate the source file content to an array with code lines
    .split(/\r?\n/);
  // Expect a consistent syntax of beginning and end of the module
  const firstLine = bundleLines.indexOf('define([');
  const lastLine = bundleLines.indexOf('], {});');
  const bundleSource = bundleLines
    // Cut the content oc the requirejs module - list of module names
    .slice(firstLine + 1, lastLine)
    // Omit empty lines and single line comments
    .filter(function (line) {
      return !(/^\s*$/.test(line) || /^\s*\/\//.test(line));
    })
    // Cut trailing comments
    .map(function (line) {
      return line.replace(/\/\/.*$/, '');
    })
    // Create a single multiline string from the module names again
    .join(EOL)
    // JSON allows double quotes only
    .replace(/'/g, '"')
    // JavaScript allows a trailing comma, but JSON does not
    .replace(/,\s*$/g, '');
  const bundleName = basename(bundlePath).replace(/\.\w+$/, '');
  const bundleIndex = {};
  try {
    const bundleModules = JSON.parse('[' + bundleSource + ']');
    bundleIndex[bundlePrefix + '/bundles/' + bundleName] = bundleModules;
    return bundleIndex;
  } catch (error) {
    console.error(`Parsing "${bundlePath}" failed: [${bundleSource}]`);
    throw error;
  }
}

function getAllComponentModules(bundleNames, bundlePath, bundlePrefix) {
  const modules = bundleNames.reduce(function (result, bundleName) {
    //const bundle = require(join(bundlePath, bundleName));
    const filePath = join(bundlePath, bundleName) + '.js';
    const bundle = loadBundleIndex(filePath, bundlePrefix);
    return [...result, ...Object.values(bundle).flat()];
  }, []);
  return [...new Set(modules)];
}

module.exports = {
  // Expose helpers to implement the getAllModules method in other components
  getAllComponentModules: getAllComponentModules,
  loadBundleIndex: loadBundleIndex,

  // Return all module bundles built by this component
  getBundleNames: function () {
    return bundleNames.slice();
  },

  // Return all public modules exposed via bundle indexes in this component
  getAllModules: function () {
    return getAllComponentModules(bundleNames, bundlePath, bundlePrefix);
  },

  // Return all requirejs plugin modules exposed as public from this component,
  // which do not start with the "nuc/" prefix and have to be declared and
  // excluded explicitly by other components
  getAllRequireJsPlugins: function () {
    return ['css', 'csui-ext', 'hbs', 'i18n', 'json', 'less', 'txt'];
  },

  // Return paths (relative to `src`) to be added to the RequireJS build
  // configuration of component depending on this one. When the run-time
  // modules of this component are excluded from the other build by `empty:`,
  // the built-time modules (RequireJS plugins) have to be re-included.
  getRequireJsPluginPaths: function () {
    return {
      css: 'lib/css',
      'csui-ext': 'utils/load-extensions/load-extensions',
      hbs: 'lib/hbs',
      i18n: 'lib/i18n',
      json: 'lib/json',
      less: 'lib/less',
      txt: 'lib/text',
      'nuc/lib/css-buffers': 'lib/css-buffers',
      'nuc/lib/css-builder': 'lib/css-builder',
      'nuc/lib/handlebars': 'lib/handlebars',
      'nuc/lib/handlebars3': 'lib/handlebars3',
      'nuc/lib/i18nprecompile': 'lib/i18nprecompile',
      'nuc/lib/less-builder': 'lib/less-builder',
      'nuc/lib/lessc': 'lib/lessc',
      'nuc/lib/normalize': 'lib/normalize',
      'nuc/lib/source-map': 'lib/source-map',
      'nuc/lib/underscore': 'lib/underscore'
    };
  },

  // Exclude files and directories from ESM -> AMD preprocessing
  isScriptModule: {
    exclude: {
      // Do not transpile 3rd party libraries, which are in AMD format
      startsWith: ['/lib/'],
      // Do not transpile global configuration, which is in IIFE format
      // and is supposed to be just inserted to a bundle as-is
      equals: ['/config.js']
    }
  },

  deprecate: {
    module: [
      {
        original: ['csui/models/autofetchable', 'nuc/models/autofetchable'],
        migrate: 'nuc/models/mixins/autofetchable/autofetchable.mixin',
        since: '22.4'
      },
      {
        original: ['csui/models/connectable', 'nuc/models/connectable'],
        migrate: 'nuc/models/mixins/connectable/connectable.mixin',
        since: '22.4'
      },
      {
        original: ['csui/models/expandable', 'nuc/models/expandable'],
        migrate: 'nuc/models/mixins/expandable/expandable.mixin',
        since: '22.4'
      },
      {
        original: ['csui/models/fetchable', 'nuc/models/fetchable'],
        migrate: 'nuc/models/mixins/fetchable/fetchable.mixin',
        since: '22.4'
      },
      {
        original: ['csui/models/including.additional.resources', 'nuc/models/including.additional.resources'],
        migrate: 'nuc/models/mixins/including.additional.resources/including.additional.resources.mixin',
        since: '22.4'
      },
      {
        original: ['csui/models/nodeautofetchable', 'nuc/models/nodeautofetchable'],
        migrate: 'nuc/models/mixins/node.autofetchable/node.autofetchable.mixin',
        since: '22.4'
      },
      {
        original: ['csui/models/nodeconnectable', 'nuc/models/nodeconnectable'],
        migrate: 'nuc/models/mixins/node.connectable/node.connectable.mixin',
        since: '22.4'
      },
      {
        original: ['csui/models/noderesource', 'nuc/models/noderesource'],
        migrate: 'nuc/models/mixins/node.resource/node.resource.mixin',
        since: '22.4'
      },
      {
        original: ['csui/models/resource', 'nuc/models/resource'],
        migrate: 'nuc/models/mixins/resource/resource.mixin',
        since: '22.4'
      },
      {
        original: ['csui/models/uploadable', 'nuc/models/uploadable'],
        migrate: 'nuc/models/mixins/uploadable/uploadable.mixin',
        since: '22.4'
      },
      {
        original: ['csui/utils/authenticator', 'nuc/utils/authenticator'],
        replace: 'nuc/utils/authenticators/ticket.authenticator',
        since: '22.4'
      },
      {
        original: ['csui/utils/basicauthenticator', 'nuc/utils/basicauthenticator'],
        replace: 'nuc/utils/authenticators/credentials.authenticator',
        since: '22.4'
      },
      {
        original: ['csui/utils/headerauthenticator', 'nuc/utils/headerauthenticator'],
        replace: 'nuc/utils/authenticators/initial.header.authenticator',
        since: '22.4'
      },
      {
        original: ['csui/utils/requestauthenticator', 'nuc/utils/requestauthenticator'],
        replace: 'nuc/utils/authenticators/request.authenticator',
        since: '22.4'
      }
    ],
    method: [
      {
        original: {
          name: 'isBusy',
          class: 'Context',
          module: 'nuc/contexts/context',
          object: ['*context', '*ctx']
        },
        migrate: {
          name: 'fetching',
          class: 'Context',
          module: 'nuc/contexts/context'
        },
        since: '22.4'
      },
      {
        original: {
          name: 'extendFetchOptions',
          class: 'Connector',
          module: 'nuc/utils/connector',
          object: ['*connector']
        },
        replace: 'extendAjaxOptions',
        since: '22.4'
      },
      {
        original: {
          name: 'getFilterAsString',
          class: 'BrowsableMixin',
          module: 'nuc/models/browsable/browsable.mixin',
          object: ['*odel', '*ollection']
        },
        since: '22.4',
        until: '23.2'
      },
      {
        original: {
          name: 'filterStringToObject',
          class: 'BrowsableMixin',
          module: 'nuc/models/browsable/browsable.mixin',
          object: ['*odel', '*ollection']
        },
        since: '22.4',
        until: '23.2'
      }
    ]
  }
};
