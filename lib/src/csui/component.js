/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
var fs = require("fs"), path = require("path");

var nucPath = `${__dirname}/../nuc/component`;

if (!fs.existsSync(nucPath + ".js")) {
  nucPath = `${__dirname}/../lib/src/nuc/component`;
  if (!fs.existsSync(nucPath + ".js")) {
    throw new Error("Neither ../lib/src/nuc nor ../nuc found in csui.");
  }
}

process && process.env && process.env.verbose && console.log("Found nuc component file in csui:" + nucPath);

var nucComponent = require(nucPath);

var bundlePrefix = "csui";

var bundleNames = [ "csui-libraries", "csui-server-adaptors", "csui-models", "csui-commands", "csui-data", "csui-view-support", "csui-app", "csui-browse", "csui-forms", "csui-metadata", "csui-search", "csui-visualisation", "csui-perspective", "csui-alpaca-legacy" ];

var bundlePath = path.join(__dirname, "bundles");

module.exports = {
  getAllModules: function() {
    return nucComponent.getAllComponentModules(bundleNames, bundlePath, bundlePrefix);
  },
  getRequireJsPluginPaths: function() {
    return {
      "csui/utils/high.contrast/detector": "utils/high.contrast/detector"
    };
  },
  isScriptModule: {
    exclude: {
      startsWith: [ "/lib/" ],
      equals: [ "/helpers.js" ]
    }
  },
  deprecate: {
    module: [ {
      original: "csui/models/noderesource",
      migrate: "nuc/models/mixins/node.resource/node.resource.mixin",
      description: "The new module provides the same usage interface, but a different initialisation."
    }, {
      original: "csui/models/navigation.history",
      description: "Do not depend on this module, pass in the urlCanChange parameter only to the prespective routing.",
      since: "23.3",
      until: "24.3"
    }, {
      original: "csui/integration/folderbrowser/folderbrowser.widget",
      migrate: "csui/integration/folderbrowser2/folderbrowser2.widget",
      description: "Folderbrowser2 has less interface and supports more perspective.",
      since: "23.4",
      until: "24.4"
    }, {
      original: "csui/controls/selected.count/selected.count.view",
      migrate: "csui/controls/selected.count/selected.count.control.view",
      description: "The new module prevents rendering of child view which improves performance",
      since: "24.4",
      until: "25.4"
    } ],
    method: [ {
      original: {
        name: "isAppContainerUsed",
        class: "NodesTableView",
        module: "csui/widgets/nodestable/nodestable.view",
        object: [ "nodesTable", "nodesTableView" ]
      },
      since: "25.1"
    } ]
  }
};