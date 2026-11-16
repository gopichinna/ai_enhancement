/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "csui/widgets/metadata/metadata.view", "dctmw/utils/rest.resources", "d2/integration/impl/embedder.utils", "d2/integration/dialog/embed.dialog.widget", "i18n!d2/integration/impl/nls/lang", "css!d2/integration/metadata/impl/embed.metadata" ], function($, _, MetadataView, RestResources, embedderUtils, EmbedDialogWidget, lang) {
  "use strict";
  require([ "csui/widgets/metadata/impl/metadata.dropdowntab.view" ], function(MetadataDropdownTabView) {
    var originalBuildTabs = MetadataDropdownTabView.prototype._buildTabs;
    MetadataDropdownTabView.prototype._buildTabs = function() {
      var tabs = originalBuildTabs.apply(this, arguments), params = embedderUtils.getHashParams();
      if (params && params["commandEvent"] === "D2_ACTION_DISPLAY_DIALOG" && params["dialogType"] === "METADATA") {
        var tabName = getTabNameForDialog(params);
        if (tabs && tabName) {
          tabs = _.where(tabs, {
            name: tabName
          });
        }
      }
      return tabs;
    };
  });
  function getTabNameForDialog(params) {
    params = params || embedderUtils.getHashParams();
    var tabName = params && params["tabName"] || "properties";
    tabName = tabName.toLowerCase();
    if (_.contains([ "properties", "versions", "relations", "renditions" ], tabName)) {
      return tabName;
    }
  }
  var EmbedMetadataWidget = function(options) {
    if (!options || !options.context || !options.connector) {
      throw new Error("context and connector attributes are mandatory in the constructor options");
    }
    this.options = options;
    $(".binf-widgets.d2-embed").addClass("only-dialog");
  };
  _.extend(EmbedMetadataWidget.prototype, {
    execute: function(params) {
      var self = this, dfd = $.Deferred(), selectedTab = getTabNameForDialog(params), validationMsg = self.validateParams();
      if (validationMsg) {
        return $.Deferred().reject(validationMsg).promise();
      }
      if (!selectedTab) {
        return $.Deferred().reject(_.str.sformat(lang.incorrectURLParamError, "tabName")).promise();
      }
      self._validateDefaultWidgets(selectedTab).done(function() {
        embedderUtils.getNodeForId(params.locateId, self.options.context, {
          fetchPreviewFormats: false,
          fetchFavorites: false,
          fetchRelationsCount: false,
          fetchExternalShare: false
        }).done(function(node) {
          node.actions.reset();
          node.set({
            actions: [],
            csuiLazyActionsRetrieved: true
          });
          $(".d2-embed > .load-container").remove();
          self._executeShowMetadataWidget(node, selectedTab);
          dfd.resolve();
        }).fail(dfd.reject);
      }).fail(dfd.reject);
      return dfd.promise();
    },
    _executeShowMetadataWidget: function(node, selectedTab) {
      this.dialogWidget = new EmbedDialogWidget({
        context: this.options.context,
        model: node,
        contentViewClass: MetadataView,
        selectedTab: selectedTab
      });
      this.dialogWidget.show({
        placeholder: ".d2-embed-container"
      });
    },
    _validateDefaultWidgets: function(selectedTab) {
      var dfd = $.Deferred();
      require([ "csui/widgets/metadata/metadata.panels" ], function(metadataPanels) {
        var defaultWidgets = RestResources.getCurrentUser().get("defaultWidgets");
        if (selectedTab !== "properties" && !_.has(defaultWidgets, selectedTab)) {
          var metadataPanelModel = metadataPanels.findWhere({
            name: selectedTab
          }), panelTitle = metadataPanelModel && metadataPanelModel.get("title") || selectedTab;
          dfd.reject(_.str.sformat(lang.defaultWidgetError, panelTitle));
        } else {
          dfd.resolve();
        }
      });
      return dfd.promise();
    },
    destroy: function() {
      if (this.dialogWidget) {
        this.dialogWidget.destroy();
      }
    },
    validateParams: function() {
      return embedderUtils.validateUrlParams({
        hashParams: {
          paramValues: embedderUtils.getHashParams(),
          mandatory: [ "commandEvent", "dialogType", "locateId", "id_source" ],
          paramRules: {
            commandEvent: "D2_ACTION_DISPLAY_DIALOG",
            dialogType: "METADATA"
          }
        }
      });
    }
  });
  return EmbedMetadataWidget;
});