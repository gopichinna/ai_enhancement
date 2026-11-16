/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "d2/widgets/metadata/panels/metadata.base.view", "d2/widgets/metadata/panels/renditions/metadata.renditions.model", "d2/widgets/metadata/panels/renditions/metadata.renditions.commands", "d2/widgets/metadata/panels/renditions/metadata.renditions.toolbaritems", "d2/utils/constants", "d2/utils/widget.constants", "dctmw/utils/rest.resources" ], function(module, _, MetadataBaseTableView, MetadataRenditionCollection, commands, toolbarItems, constants, widgetConstants, RestResources) {
  "use strict";
  var config = module.config();
  _.defaults(config, {
    defaultPageSize: 30,
    defaultPageSizes: [ 30, 50, 100 ]
  });
  return MetadataBaseTableView.extend({
    constructor: function MetadataRenditionsTableView(options) {
      _.defaults(options, {
        collectionClass: MetadataRenditionCollection,
        commands: commands,
        pageSize: config.defaultPageSize,
        ddItemsList: config.defaultPageSizes,
        toolbarItems: toolbarItems,
        columnsWithSearch: [ "a_content_type" ],
        showInlineActionBarOnHover: !module.config().accessibleTable,
        forceInlineActionBarOnClick: false,
        inlineActionBarStyle: "csui-table-actionbar-bubble"
      });
      MetadataRenditionsTableView.__super__.constructor.call(this, options);
      this.listenTo(options.originatingView, "d2:add:rendition", function(parentId) {
        if (parentId == this.model.get("id")) {
          this.collection.fetch({
            reload: true
          });
        }
      });
    }
  }, {
    enabled: function(options) {
      var w = RestResources.getCurrentUser().get("defaultWidgets");
      return w && w[widgetConstants.DEFAULT.RENDITIONS] && _.contains([ constants.Types.DOCUMENT, constants.Types.EMAIL, constants.Types.RENDITION ], options.node.get("type")) && !(options.node.get("id") === constants.NodeId.FAVORITES);
    }
  });
});