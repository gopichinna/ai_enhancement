/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
var fs = require("fs"), path = require("path");

var nucPath = path.join(__dirname, "../lib/src/nuc");

if (!fs.existsSync(nucPath)) {
  nucPath = path.join(__dirname, "../nuc");
  if (!fs.existsSync(nucPath)) {
    throw new Error("Neither ../lib/src/nuc nor ../nuc found in esoc.");
  }
}

process && process.env && process.env.verbose && console.log("Found nuc component dir in esoc:" + nucPath);

var nucComponent = require(path.join(nucPath, "/component")), bundlePrefix = "esoc", bundleNames = [ "esoc-all" ], bundlePath = path.join(__dirname, "bundles");

module.exports = {
  getAllModules: function() {
    return nucComponent.getAllComponentModules(bundleNames, bundlePath, bundlePrefix);
  },
  deprecate: {
    module: [ {
      original: "esoc/controls/userwidget/userwidget.view",
      description: "Userprofile functionality has been migrated from esoc to cssvui. Please stop using this feature",
      since: "24.3",
      until: "25.3"
    }, {
      original: "esoc/widgets/userwidget/view/userprofile.view",
      description: "Userprofile functionality has been migrated from esoc to cssvui. Please stop using this feature",
      since: "24.3",
      until: "25.3"
    }, {
      original: "esoc/widgets/userwidget/view/miniprofile.view",
      description: "Userprofile functionality has been migrated from esoc to cssvui. Please stop using this feature",
      since: "24.3",
      until: "25.3"
    }, {
      original: "esoc/widgets/userwidget/view/simple.userwidget.view",
      description: "Userprofile functionality has been migrated from esoc to cssvui. Please stop using this feature",
      since: "24.3",
      until: "25.3"
    }, {
      original: "esoc/widgets/userwidget/view/profile",
      description: "Userprofile functionality has been migrated from esoc to cssvui. Please stop using this feature",
      since: "24.3",
      until: "25.3"
    }, {
      original: "esoc/widgets/utils/commentdialog/commentdialog",
      description: "Commenting functionality has been migrated from esoc to cssvui. Please stop using this feature",
      since: "24.3",
      until: "25.3"
    }, {
      original: "esoc/widgets/utils/commentdialog/commentdialog.view",
      description: "Commenting functionality has been migrated from esoc to cssvui. Please stop using this feature",
      since: "24.3",
      until: "25.3"
    }, {
      original: "esoc/widgets/utils/command/comment/comment.toolitem.view",
      description: "Commenting functionality has been migrated from esoc to cssvui. Please stop using this feature",
      since: "24.3",
      until: "25.3"
    }, {
      original: "esoc/commands/comment/comment.command",
      description: "Commenting functionality has been migrated from esoc to cssvui. Please stop using this feature",
      since: "24.3",
      until: "25.3"
    }, {
      original: "esoc/widgets/activityfeedwidget/activityfeedwidget.view",
      description: "Activity feed functionality has been migrated from esoc to cssvui. Please stop using this feature",
      since: "24.3",
      until: "25.3"
    }, {
      original: "esoc/widgets/activityfeedwidget/activityfeedfactory",
      description: "Activity feed functionality has been migrated from esoc to cssvui. Please stop using this feature",
      since: "24.3",
      until: "25.3"
    }, {
      original: "esoc/widgets/activityfeedwidget/activityfeedcontent",
      description: "Activity feed functionality has been migrated from esoc to cssvui. Please stop using this feature",
      since: "24.3",
      until: "25.3"
    } ]
  }
};