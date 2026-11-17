/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/jquery", "nuc/lib/underscore", "d2/widgets/metadata/panels/metadata.base.view", "d2/widgets/metadata/panels/relations/metadata.relations.model", "d2/widgets/metadata/panels/relations/metadata.relations.command", "d2/widgets/metadata/panels/relations/metadata.relations.toolbaritems", "d2/utils/constants", "d2/utils/widget.constants", "dctmw/utils/rest.resources" ], function(module, $, _, MetadataBaseTableView, MetadataRelationCollection, commands, toolbarItems, constants, widgetConstants, RestResources) {
  "use strict";
  var config = module.config();
  _.defaults(config, {
    defaultPageSize: 30,
    defaultPageSizes: [ 30, 50, 100 ]
  });
  return MetadataBaseTableView.extend({
    constructor: function MetadataRelationsTableView(options) {
      _.defaults(options, {
        collectionClass: MetadataRelationCollection,
        commands: commands,
        pageSize: config.defaultPageSize,
        ddItemsList: config.defaultPageSizes,
        toolbarItems: toolbarItems,
        isRelationTable: true,
        showInlineActionBarOnHover: !module.config().accessibleTable,
        forceInlineActionBarOnClick: false,
        inlineActionBarStyle: "csui-table-actionbar-bubble"
      });
      MetadataRelationsTableView.__super__.constructor.call(this, options);
      this.listenTo(options.context, "d2:add:relation", function(nodeIds) {
        if (nodeIds.includes(this.model.get("id"))) {
          this.collection.fetch({
            reload: true
          });
        }
      });
    },
    onRender: function() {
      MetadataBaseTableView.prototype.onRender.apply(this, arguments);
    }
  }, {
    enabled: function(options) {
      if (options.node.get("isChildOfRelation")) {
        return false;
      }
      if (options.node.get("type") === constants.DocumentLinkType.RELATION) {
        return false;
      }
      var w = RestResources.getCurrentUser().get("defaultWidgets");
      return w && w[widgetConstants.DEFAULT.RELATIONS] && !_.contains([ constants.Types.REPOSITORY, constants.Types.TASK, constants.Types.WORKFLOW ], options.node.get("type")) && !(options.node.get("id") === constants.NodeId.FAVORITES);
    }
  });
});