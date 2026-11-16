/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
var fs = require("fs"), path = require("path");

var possibleLocations = [ "../lib/src/nuc", "../../nucleus/src", "../nuc" ], nucPath = "";

possibleLocations.forEach(function(loc) {
  var fullLoc = path.join(`${__dirname}`, loc);
  nucPath = fs.existsSync(fullLoc) ? fullLoc : nucPath;
});

if (nucPath === "") {
  throw new Error("None of " + possibleLocations.toLocaleString() + " found.");
}

var nucComponent = require(path.join(nucPath, "/component")), bundlePrefix = "smart", bundleNames = [ "smart-all", "icons-smart-action", "icons-smart-action_16" ], bundlePath = path.join(__dirname, "bundles");

module.exports = {
  getBundleNames: function() {
    return bundleNames.slice();
  },
  getAllModules: function() {
    return nucComponent.getAllComponentModules(bundleNames, bundlePath, bundlePrefix);
  },
  getAllRequireJsPlugins: function() {
    return [];
  },
  getAllAvailableRequireJsPlugins: function() {
    return [ "smart/controls/breadcrumbs/test/breadcrumbs.mock.data", "json!smart/controls/pagination/test/pagination.data.json", "smart/controls/pagination/test/pagination.mock.data", "json!smart/controls/user/test/user.profile.data.json", "smart/controls/user/test/user.profile.mock", "smart/controls/progresspanel/progresspanel/test/progresspanel.mock", "smart/controls/list/list.view", "smart/controls/list/behaviors/list.view.keyboard.behavior", "hbs!smart/controls/list/test/testContainer", "smart/controls/list/simplelist.view", "smart/controls/listitem/listitemstandard.view", "smart/controls/listitem/simpletreelistitem.view", "smart/controls/list/test/list.mock.data", "smart/behaviors/collection.state/collection.state.behavior", "smart/behaviors/infinite.scrolling/infinite.scrolling.behavior", "smart/behaviors/collection.error/collection.error.behavior", "smart/controls/listitem/test/tileview.toolbaritems", "smart/controls/facet.panel/test/facet.mock.data", "smart/controls/facet.bar/test/facetbar.mock.data", "json!smart/controls/bulk.selection/test/bulk.selection.dropdown.data.json", "smart/controls/bulk.selection/test/bulk.selection.dropdown.mock.data", "smart/controls/node.picker/test/node.picker.mock", "css!smart/controls/node.picker/indicator/impl/node.indicator.icons", "hbs!smart/controls/node.picker/indicator/impl/node.indicator.icons", "smart/controls/node.picker/indicator/node.indicator.icons.collection.view", "smart/controls/node.picker/indicator/node.indicator.icons", "smart/controls/node.picker/indicator/node.indicator.icons.view", "smart/controls/node.picker/indicator/test/temp.node.indicator.icons", "smart/themes/carbonfiber/ot-icons/temp/icons_smart_action_temp", "smart/themes/carbonfiber/ot-icons/temp/icons_smart_header_temp", "smart/themes/carbonfiber/ot-icons/temp/icons_smart_mime_temp", "smart/themes/carbonfiber/ot-icons/temp/icons_smart_status_temp", "smart/controls/app.header/test/smart.test.app.header.controls/smart.test.app.header.controls", "smart/controls/app.header/test/smart.test.app.header.controls/logo/smart.test.logo.view", "smart/controls/app.header/test/smart.test.app.header.controls/progress.icon/smart.test.progress.view", "smart/controls/app.header/test/smart.test.app.header.controls/search.box/smart.test.search.box.view", "smart/controls/app.header/test/smart.test.app.header.controls/help/smart.test.help.view", "smart/controls/app.header/test/smart.test.app.header.controls/notification/smart.test.notification.view", "smart/controls/app.header/test/smart.test.app.header.controls/add.workspace/smart.test.add.view", "smart/controls/app.header/test/smart.test.app.header.controls/button.menu/smart.test.buttonmenu.view", "smart/controls/app.header/test/smart.test.app.header.controls/favorites/smart.test.favorites.view", "smart/controls/app.header/test/smart.test.app.header.controls/user.profile/smart.test.user.profile.view", "smart/controls/app.header/test/smart.test.app.header.controls/user.profile/branding.config/smart.test.branding.config.view", "smart/controls/app.header/test/smart.test.app.header.controls/user.profile/branding.config/smart.test.branding.config.util", "smart/controls/skip.links/test/skip.links.demo/skip.links.demo.view" ];
  },
  isScriptModule: {
    exclude: {
      equals: [ "/bundles/otwc/all.js" ]
    }
  }
};