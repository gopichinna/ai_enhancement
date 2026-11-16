/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "csui/utils/commands", "nuc/models/node/node.model", "d2/utils/constants", "d2/utils/widget.constants", "d2/utils/rest.linkrels" ], function(_, $, commands, NodeModel, constants, widgetConstants, RestLinkrels) {
  "use strict";
  var CollectionItemWidgetModel = NodeModel.extend({
    constructor: function CollectionItemWidgetModel(attributes, options) {
      options = options || {};
      options.d2ActionsOptions = options.d2ActionsOptions || {
        menuType: constants.MenuTypes.COLLECTION_ITEMS,
        widgetType: widgetConstants.D2.COLLECTIONS
      };
      options.delayedActionsOptions = options.d2ActionsOptions;
      options.nonPromotedActionsOptions = options.d2ActionsOptions;
      if (!options?.collection?.expanded && options?.collection?.options.toolbarItems) {
        options.nonPromotedActionCommands = commands.getSignatures(options?.collection?.options.toolbarItems);
        options.promotedActionCommands = [];
      }
      this.options = options;
      NodeModel.prototype.constructor.apply(this, arguments);
    },
    sync: function(method, model, options) {
      if (method === "delete") {
        let oldSuccess = options.success, oldError = options.error, dfd = $.Deferred();
        options.success = function(model, status, xhr) {
          oldSuccess.call(options.context, model, status, xhr);
          dfd.resolve();
        };
        options.error = function(xhr, statusText, error) {
          oldError.call(options.context, xhr, statusText, error);
          dfd.reject({
            responseJSON: {
              error: error.message
            }
          });
        };
        this.deleteModel(model, options);
        return dfd.promise();
      }
      return NodeModel.prototype.sync.apply(this, arguments);
    },
    deleteModel: function(model, options) {
      let me = this, data = {
        items_chronicle_id: [ model.get("i_chronicle_id") ]
      };
      _.extend(options, {
        contentType: constants.MediaTypes.DCTM_JSON,
        type: "DELETE",
        url: me._getCollectionItemUrl("parent"),
        data: JSON.stringify(data)
      });
      $.ajax(this.connector.extendAjaxOptions(options));
    },
    _getCollectionItemUrl: function(from) {
      from = from ? "parentLinks" : "links";
      let containerUrl = RestLinkrels.getLink(this.get(from), RestLinkrels.SELF), url = containerUrl?.indexOf("?") > -1 ? containerUrl?.slice(0, containerUrl.indexOf("?")) : containerUrl;
      return url;
    }
  });
  return CollectionItemWidgetModel;
});