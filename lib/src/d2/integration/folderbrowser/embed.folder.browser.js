/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "csui/integration/folderbrowser/folderbrowser.widget", "csui/utils/contexts/factories/node", "csui/utils/contexts/factories/connector", "csui/utils/contexts/factories/widget.settings.collection.factory", "d2/integration/folderbrowser/folder.browser.id.rules", "d2/utils/contexts/embed.context.controller", "d2/utils/constants", "d2/utils/widget.constants", "d2/utils/server.query.utils", "d2/utils/widgets.utils", "dctmw/utils/user.preference.storage", "dctmw/utils/rest.resources", "d2/integration/impl/embedder.utils" ], function($, _, FolderBrowserWidget, NodeModelFactory, ConnectionFactory, WidgetSettingsCollectionFactory, FolderBrowserIdRules, EmbedContextController, constants, widgetConstants, serverQueryUtils, widgetUtils, userPreference, RestResources, embedderUtils) {
  "use strict";
  var EmbedFolderBrowser = function(options) {
    if (!options || !options.context || !options.connector) {
      throw new Error("context and connector attributes are mandatory in the constructor options");
    }
    this.options = options;
    this.options.context.isFolderBrowser = true;
    this.options.context.isEmbeddedSearch = false;
  };
  _.extend(EmbedFolderBrowser.prototype, {
    execute: function(params) {
      var me = this, deferred = $.Deferred(), queryParams = embedderUtils.getQueryParams();
      if (queryParams && queryParams["plugin_mode"] && queryParams["plugin_mode"] === constants.BrowserPluginMode.WSCTF) {
        embedderUtils.checkWsctfStatus(me.options.context).done(function() {
          me.executeEmbedFolderBrower(params).done(deferred.resolve).fail(deferred.reject);
        }).fail(deferred.reject);
      } else {
        me.executeEmbedFolderBrower(params).done(deferred.resolve).fail(deferred.reject);
      }
      return deferred.promise();
    },
    prepareWidgetSettings: function() {
      var deferred = $.Deferred(), userDefaultWidgets = RestResources.getCurrentUser().get("defaultWidgets"), widgetName = userDefaultWidgets[widgetConstants.DEFAULT.DOCLIST], widgetType = widgetConstants.D2.DOCLIST, widgetStorageId = widgetUtils.getPreferenceStorageId(widgetType, widgetName), connectionObject = this.options.context.getObject(ConnectionFactory);
      serverQueryUtils.fetchColumnPreferences({
        widgetName: widgetName,
        widgetType: widgetType,
        defaultType: constants.ColTypes.DEFAULT,
        connector: connectionObject
      }).done(() => {
        var widgetSettingsCollection = this.options.context.getCollection(WidgetSettingsCollectionFactory), widgetSettingsModel = widgetSettingsCollection.get(widgetStorageId);
        if (widgetSettingsModel) {
          widgetSettingsModel.set({
            isTreeOpen: false,
            isFacetOpen: false
          });
          deferred.resolve();
        }
      }).fail(deferred.reject);
      return deferred.promise();
    },
    executeEmbedFolderBrower: function(params) {
      var me = this, context = me.options.context, deferred = $.Deferred();
      params.id_source = params.id_source || "static";
      var fetchNodeOptions = _.extend({
        params: params
      }, me.options);
      if (context.currentNodeId) {
        var currentNodeId = context.currentNodeId;
        delete context.currentNodeId;
        fetchNodeOptions.currentNodeId = currentNodeId;
      }
      FolderBrowserIdRules.fetchNodeId(fetchNodeOptions).done(function(id) {
        EmbedContextController.setEmbedData({
          mode: "folderbrowser",
          rootNodeId: id
        });
        if (params.allow_back === "true" || context.visitedNodeHistory && context.visitedNodeHistory.length > 1) {
          if (context.visitedNodeHistory) {
            var lastVisited = context.visitedNodeHistory[context.visitedNodeHistory.length - 1];
            if (lastVisited !== id) {
              context.visitedNodeHistory.push(id);
            }
          }
          context.allowBack = true;
        } else {
          context.rootNodeId = id;
          context.visitedNodeHistory = [ id ];
          delete context.allowBack;
        }
        var node = context.getObject(NodeModelFactory);
        node.set({
          id: id
        });
        node.fetch().done(function() {
          me.prepareWidgetSettings().done(function() {
            me.browserWidget = me._createWidget({
              context: context,
              start: {},
              breadcrumb: false,
              facetPanel: false
            });
            me.browserWidget.folderView.fetchNode = function(nodeAttr) {
              var container = this.container;
              this.prevNodeId = nodeAttr.id;
              this.$el && this.$el.find(".csui-item-title").toggle(true);
              this.$el && this.$el.find(".d2-embedded-search").parent().remove();
              container.clear({
                silent: true
              });
              container.set(nodeAttr, {
                silent: true
              });
              var me = this;
              me.context.getObject(NodeModelFactory).fetch().done(function() {
                me.context.fetch();
              });
              return true;
            };
            $(".d2-embed > .load-container").remove();
            me.browserWidget.show({
              placeholder: ".d2-embed-container"
            });
            deferred.resolve();
          }).fail(deferred.reject);
        }).fail(deferred.reject);
      }).fail(deferred.reject);
      return deferred.promise();
    },
    destroy: function() {
      if (this.browserWidget) {
        this.browserWidget.destroy();
      }
    },
    _createWidget: function(options) {
      return new FolderBrowserWidget(options);
    }
  });
  return EmbedFolderBrowser;
});