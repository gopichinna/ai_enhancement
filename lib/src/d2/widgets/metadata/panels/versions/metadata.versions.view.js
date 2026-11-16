/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "d2/widgets/metadata/panels/metadata.base.view", "csui/models/nodeversions", "d2/widgets/metadata/panels/versions/metadata.versions.command", "d2/widgets/metadata/panels/versions/metadata.versions.toolbaritems", "d2/utils/constants", "d2/utils/widget.constants", "dctmw/utils/rest.resources", "csui/models/version" ], function(module, _, MetadataBaseTableView, MetadataVersionCollection, commands, toolbarItems, constants, widgetConstants, RestResources, VersionModel) {
  "use strict";
  var config = module.config();
  _.defaults(config, {
    defaultPageSize: 30,
    defaultPageSizes: [ 30, 50, 100 ]
  });
  return MetadataBaseTableView.extend({
    constructor: function MetadataVersionsTableView(options) {
      _.defaults(options, {
        collectionClass: MetadataVersionCollection,
        commands: commands,
        pageSize: config.defaultPageSize,
        ddItemsList: config.defaultPageSizes,
        toolbarItems: toolbarItems,
        showInlineActionBarOnHover: !module.config().accessibleTable,
        forceInlineActionBarOnClick: false,
        inlineActionBarStyle: "csui-table-actionbar-bubble"
      });
      MetadataVersionsTableView.__super__.constructor.call(this, options);
    }
  }, {
    enabled: function(options) {
      if (options.node instanceof VersionModel) {
        return false;
      }
      var w = RestResources.getCurrentUser().get("defaultWidgets");
      return w && w[widgetConstants.DEFAULT.VERSIONS] && _.contains([ constants.Types.OBJECT, constants.Types.DOCUMENT, constants.Types.EMAIL ], options.node.get("type"));
    }
  });
});