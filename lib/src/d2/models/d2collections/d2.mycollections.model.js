/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/models/node/node.model", "d2/utils/constants", "d2/utils/widget.constants", "d2/utils/rest.linkrels", "csui/utils/commands", "d2/utils/server.query.utils", "d2/widgets/d2collections.perspective/impl/d2collections.toolbaritems" ], function($, NodeModel, constants, widgetConstants, RestLinkrels, commands, serverQueryUtils, d2collectionsToolbaritems) {
  "use strict";
  var MyCollectionWidgetModel = NodeModel.extend({
    constructor: function MyCollectionWidgetModel(attributes, options) {
      options.d2ActionsOptions = options.d2ActionsOptions || {
        menuType: constants.MenuTypes.COLLECTIONS,
        widgetType: widgetConstants.D2.COLLECTIONS
      };
      options.delayedActionsOptions = options.d2ActionsOptions;
      options.nonPromotedActionsOptions = options.d2ActionsOptions;
      if (!options.toolbarItems) {
        options.toolbarItems = {
          inlineActionbar: d2collectionsToolbaritems.collectionsInlineActionBar
        };
      }
      if (!options?.collection?.expanded && options.toolbarItems) {
        options.nonPromotedActionCommands = commands.getSignatures(options.toolbarItems);
        options.promotedActionCommands = [];
      }
      this.options = options;
      NodeModel.prototype.constructor.apply(this, arguments);
      this.set("type", constants.Types.COLLECTIONS);
    },
    url: function() {
      return RestLinkrels.getLink(this.get("links"), RestLinkrels.SELF);
    },
    sync: function(method) {
      if (method === "delete") {
        return NodeModel.prototype.sync.apply(this, arguments);
      }
      var me = this, dfd = $.Deferred(), id = this.get("id"), params = {
        actions: {
          menuType: constants.MenuTypes.COLLECTIONS,
          widgetType: widgetConstants.D2.COLLECTIONS
        },
        ids: [ id ],
        connector: me.connector
      };
      serverQueryUtils.fetchDataForObjects(params).done(function(output) {
        me.set("actions", output.actions && output.actions[id] || []);
        dfd.resolve();
      }).fail(function() {
        dfd.reject.apply(dfd, arguments);
      });
      return dfd.promise();
    },
    parse: function(response) {
      return response.entries ? response.entries[0].properties : response;
    }
  });
  return MyCollectionWidgetModel;
});