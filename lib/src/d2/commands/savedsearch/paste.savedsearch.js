/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/models/nodes", "nuc/models/node/node.model", "nuc/utils/url", "d2/commands/paste", "d2/models/savedsearch/savedsearch.model", "d2/utils/clipboard.manager", "d2/utils/constants", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "d2/utils/widget.constants", "dctmw/utils/utils", "i18n!d2/commands/nls/localized.strings" ], function(_, $, NodeCollection, NodeModel, Url, D2Paste, SavedSearchModel, ClipboardManager, constants, RestResources, RestLinkrels, widgetConstants, utils, lang) {
  "use strict";
  return D2Paste.extend({
    defaults: {
      signature: "D2-PasteSavedSearch",
      command_key: "D2-PasteSavedSearch",
      name: lang.CommandNameCutSearchObject,
      scope: "multiple"
    },
    enabled: function(status) {
      var container = status.container, enabled = false;
      if (this._hasValidClipboardData()) {
        enabled = !container.get("id") || D2Paste.prototype.enabled.apply(this, arguments);
        if (enabled && container.isAvailablePublic()) {
          enabled = container.searchConfig && container.searchConfig.canCreatePublicSearch;
        }
      }
      return enabled;
    },
    _performActions: function(status, options) {
      status.nodes = new NodeCollection(_.map(ClipboardManager.getStoredItems(), function(item) {
        var node = new SavedSearchModel(item.nodeAttributes, {
          connector: options.container.connector
        });
        node._parentId = item.parentId;
        return node;
      }));
      return D2Paste.__super__._performActions.call(this, status, options);
    },
    doAction: function(node, options) {
      var me = this, deferred = $.Deferred(), container = options.container, targetId = container.get("id");
      if (!targetId) {
        var searchConfig = container.searchConfig;
        if (searchConfig) {
          targetId = container.isAvailablePublic() ? searchConfig.root_public_category_id : searchConfig.root_private_category_id;
        } else {
          return deferred.reject(new Error(lang.noSearchConfiguration)).promise();
        }
      }
      var payload = JSON.stringify({
        href: Url.combine(RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.SELF), "objects", targetId),
        "child-id": node.get("id"),
        "parent-id": node._parentId
      });
      function performPaste(url) {
        $.ajax(container.connector.extendAjaxOptions({
          url: url,
          type: "PUT",
          data: payload,
          headers: {
            "Content-Type": constants.MediaTypes.DCTM_JSON
          },
          success: function(response) {
            ClipboardManager.clear();
            var id = response["child-id"], newNode = new SavedSearchModel({
              id: id
            }, {
              connector: container.connector
            });
            me._refreshNode(newNode, options).done(function() {
              newNode.set("parent_id", response["parent-id"], {
                silent: true
              });
              newNode.isLocallyCreated = true;
              options.originatingView.collection.unshift(newNode);
              deferred.resolve(newNode);
            });
          },
          error: function(xhr, textStatus, errorThrown) {
            var errMessage = utils.parseAjaxErrorAsString(xhr, textStatus, errorThrown, true);
            deferred.reject(errMessage);
          }
        }));
      }
      if (!RestLinkrels.getLink(node.get("links"), RestLinkrels.PARENT_LINKS)) {
        var nodeModel = new NodeModel({
          id: node.get("id")
        }, {
          connector: container.connector
        });
        me._refreshNode(nodeModel, options).done(function() {
          performPaste(RestLinkrels.getLink(nodeModel.get("links"), RestLinkrels.PARENT_LINKS) + "/" + node._parentId);
        });
      } else {
        performPaste(RestLinkrels.getLink(node.get("links"), RestLinkrels.PARENT_LINKS) + "/" + node._parentId);
      }
      return deferred.promise();
    },
    handleResults: function(results, options) {
      var container = options.originatingView.container;
      if (container.get("id")) {
        return container.fetch({
          force: true,
          reload: false
        });
      }
      return $.Deferred().resolve().promise();
    },
    _hasValidClipboardData: function() {
      var hasData = !ClipboardManager.isClipboardEmpty() && ClipboardManager.getOperation() === "cut";
      return hasData && !_.find(ClipboardManager.getStoredItems(), function(item) {
        return item.widgetScope !== widgetConstants.D2.SEARCH;
      });
    }
  });
});