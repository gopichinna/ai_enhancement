/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/underscore", "nuc/models/node/node.model", "csui/utils/commandhelper", "d2/controls/globalmessage/globalmessage", "d2/commands/viewer/compare.base.command", "d2/dialogs/document.preview/document.preview.plugins", "d2/commands/open.plugins/impl/bravaviewer.preview.plugin", "d2/commands/open.plugins/impl/iviewer.preview.plugin", "d2/commands/open.plugins/impl/iviewer/utils", "d2/utils/content.assist", "d2/commands/viewer/compare.text", "d2/commands/viewer/compare.graphical", "d2/utils/constants", "d2/utils/widget.constants", "dctmw/utils/rest.resources", "d2/utils/server.query.utils", "i18n!d2/commands/nls/localized.strings" ], function(require, $, Backbone, _, NodeModel, CommandHelper, GlobalMessage, CompareBaseCommand, docPreviewPlugins, BravaViewerPreviewPlugin, IViewerPreviewPlugin, iviewerUtils, ContentAssist, CompareText, CompareGraphical, constants, widgetConstants, RestResources, serverQueryUtils, lang) {
  "use strict";
  var CompareWith = CompareBaseCommand.extend({
    defaults: {
      signature: "D2-CompareWith",
      command_key: "D2-CompareWith",
      name: lang.CompareWithName,
      scope: "single"
    },
    enabled: function(status) {
      var enabled = false, node = CommandHelper.getJustOneNode(status);
      if (node && status.nodes.length === 1) {
        var previewPlugin = node && docPreviewPlugins.findByNode(node), userDefaultWidgets = RestResources.getCurrentUser().get("defaultWidgets");
        this.isIViewer = previewPlugin instanceof IViewerPreviewPlugin;
        this.isBravaViewer = previewPlugin instanceof BravaViewerPreviewPlugin;
        var ivTextEnabled = false, ivGraphicalEnabled = false, ivWidgetConfiguration = null;
        if (this.isIViewer && userDefaultWidgets && !_.isEmpty(userDefaultWidgets)) {
          ivWidgetConfiguration = serverQueryUtils.getWidgetConfig(widgetConstants.D2.BRAVAIV, userDefaultWidgets[widgetConstants.DEFAULT.BRAVAIV]);
          ivTextEnabled = ivWidgetConfiguration["widgetParams"] && ivWidgetConfiguration["widgetParams"]["is_iv_t_compare_enabled"];
          ivGraphicalEnabled = ivWidgetConfiguration["widgetParams"] && ivWidgetConfiguration["widgetParams"]["is_iv_g_compare_enabled"];
        }
        if ((this.isBravaViewer || this.isIViewer && (ivTextEnabled || ivGraphicalEnabled)) && this.isCompareEnabled(node)) {
          enabled = true;
        }
        if (this.isIViewer && iviewerUtils.hasRegularLicense === 0) {
          enabled = false;
        }
      }
      return enabled;
    },
    isCompareEnabled: function(node) {
      var supportedTypeTextCompare = this.getAllSupportedContentTypesForTextCompare(this.isIViewer), supportedTypeGraphicatCompare = this.getAllSupportedContentTypesForGraphicalCompare(this.isIViewer);
      var allSupportedTypes = Object.assign(supportedTypeTextCompare, supportedTypeGraphicatCompare);
      var contentType = this.getContentType(node);
      if (!allSupportedTypes[contentType]) {
        return false;
      }
      return true;
    },
    execute: function(status) {
      var deferred = $.Deferred(), node = CommandHelper.getJustOneNode(status);
      this.compareText = new CompareText();
      this.compareGraphical = new CompareGraphical();
      this.status = status;
      this.node = node;
      status.suppressSuccessMessage = true;
      this.doExecute(node, status).done(function() {
        deferred.resolve();
      });
      return deferred.promise();
    },
    doExecute: function(node, status) {
      var me = this, deferred = $.Deferred(), container = node.parent && node.parent.clone();
      if (!container) {
        container = new NodeModel({
          id: node.get("parent_id")
        }, {
          connector: status.container.connector
        });
      }
      container.fetch().done(function() {
        ContentAssist.getContentAssistOptions(status).done(function(config) {
          var compareWithAction = me.node.actions.get({
            signature: "D2-CompareWith"
          });
          var title = compareWithAction.get("actionProperties").name || this.attributes.name;
          var includeBrowse = config && config.properties ? config.properties.has_browse_assist : true;
          var includeFavorites = config && config.properties ? config.properties.has_favorites_assist : false;
          var globalSearch = config && config.properties ? config.properties.has_search_assist : false;
          me._displayContentAssist(status, node, title, includeBrowse, includeFavorites, globalSearch, container).done(function(selectedNodes) {
            me.doCompare(selectedNodes);
          }).fail(function() {});
          deferred.resolve();
        });
      });
      return deferred.promise();
    },
    doCompare: function(selectedNodes) {
      var nodeCollection = new Backbone.Collection();
      nodeCollection.add(this.node);
      var secondNode = this.node?.collection.findWhere({
        id: selectedNodes.nodes[0].get("id")
      });
      if (!secondNode) {
        secondNode = selectedNodes.nodes[0];
      }
      nodeCollection.add(secondNode);
      var status = {
        nodes: nodeCollection,
        context: this.status.context
      };
      if (selectedNodes.buttonId === "compare-text") {
        this.compareText.execute(status);
      }
      if (selectedNodes.buttonId === "compare-graphical") {
        this.compareGraphical.execute(status);
      }
    },
    _displayContentAssist: function(status, nodeModel, title, includeBrowse, includeFavorites, globalSearch, container) {
      var me = this, deferred = $.Deferred(), compareText = nodeModel.actions.get({
        signature: "D2-CompareText"
      }), compareGraphical = nodeModel.actions.get({
        signature: "D2-CompareGraphical"
      });
      var compareTextButtonLabel = compareText ? compareText.get("actionProperties").name : this.compareText.get("name");
      var compareGraphicalButtonLabel = compareGraphical ? compareGraphical.get("actionProperties").name : this.compareGraphical.get("name");
      require([ "d2/dialogs/target.browse/target.browse.compare" ], function(NodePicker) {
        var pickerOptions = {
          dialogTitle: title,
          connector: nodeModel.connector,
          container: container,
          initialContainer: container,
          context: status.context,
          selectMultiple: false,
          includeBrowse: includeBrowse,
          globalSearch: globalSearch,
          includeFavorites: includeFavorites,
          nodeModel: nodeModel,
          selectType: "typeName",
          selectTypeValue: constants.Types.DOCUMENT,
          compareTextButtonLabel: compareTextButtonLabel,
          compareGraphicalButtonLabel: compareGraphicalButtonLabel,
          onSelectionChange: me.contentAssistSelectionChange.bind(me)
        };
        pickerOptions.storeContainer = true;
        pickerOptions.restoreContainer = true;
        pickerOptions.dataId = constants.StorageKey.COMPARE_WITH_COMMAND + constants.StorageKey.ANCESTOR_INFO;
        if (!pickerOptions.dialogTitle || pickerOptions.dialogTitle.length === 0) {
          pickerOptions.dialogTitle = lang.contentAssistDialogTitle;
        }
        pickerOptions.startLocations = [];
        if (pickerOptions.includeBrowse) {
          pickerOptions.startLocations.push("current.location");
        }
        if (pickerOptions.includeFavorites) {
          pickerOptions.startLocations.push("favorites");
        }
        var nodePicker = new NodePicker(pickerOptions);
        nodePicker.show().done(function(selectedNodes) {
          deferred.resolve(selectedNodes);
        }).fail(function() {
          deferred.reject("close");
        });
      }, deferred.reject);
      return deferred.promise();
    },
    contentAssistSelectionChange: function(options) {
      if (options.selection.length !== 0) {
        var nodeCollection = new Backbone.Collection();
        nodeCollection.add(this.node);
        nodeCollection.add(options.selection.models[0]);
        var status = {
          nodes: nodeCollection
        };
        var compareTextEnable = this.compareText.enabled(status);
        var compareGraphicalEnable = this.compareGraphical.enabled(status);
        compareTextEnable ? options.dialog.updateButton("compare-text", {
          disabled: false
        }) : options.dialog.updateButton("compare-text", {
          disabled: true
        });
        compareGraphicalEnable ? options.dialog.updateButton("compare-graphical", {
          disabled: false
        }) : options.dialog.updateButton("compare-graphical", {
          disabled: true
        });
        this.updateButtonClass(options, compareTextEnable, compareGraphicalEnable);
      } else {
        options.dialog.updateButton("compare-text", {
          disabled: true
        });
        options.dialog.updateButton("compare-graphical", {
          disabled: true
        });
        this.updateButtonClass(options, false, false);
      }
    },
    updateButtonClass: function(options, compareTextEnable, compareGraphicalEnable) {
      var buttonText = options.dialog.footerView.buttonsRegion.currentView.collection.get("compare-text");
      var buttonTextView = options.dialog.footerView.footerView.children.findByModel(buttonText);
      var buttonGraphical = options.dialog.footerView.buttonsRegion.currentView.collection.get("compare-graphical");
      var buttonGraphicalView = options.dialog.footerView.footerView.children.findByModel(buttonGraphical);
      if (compareTextEnable && compareGraphicalEnable) {
        buttonTextView.$el.removeClass("binf-btn-default").addClass("binf-btn-primary");
        buttonGraphicalView.$el.removeClass("binf-btn-primary").addClass("binf-btn-default");
      } else if (compareTextEnable && !compareGraphicalEnable) {
        buttonTextView.$el.removeClass("binf-btn-default").addClass("binf-btn-primary");
        buttonGraphicalView.$el.removeClass("binf-btn-primary").addClass("binf-btn-default");
      } else if (!compareTextEnable && compareGraphicalEnable) {
        buttonTextView.$el.removeClass("binf-btn-primary").addClass("binf-btn-default");
        buttonGraphicalView.$el.removeClass("binf-btn-default").addClass("binf-btn-primary");
      } else {
        buttonTextView.$el.removeClass("binf-btn-default binf-btn-primary");
        buttonGraphicalView.$el.removeClass("binf-btn-primary binf-btn-default");
      }
    }
  });
  return CompareWith;
});