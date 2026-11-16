/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/controls/progressblocker/blocker", "csui/controls/tableactionbar/tableactionbar.view", "csui/widgets/metadata/metadata.view", "d2/utils/constants", "d2/utils/node.utils", "d2/commands/workflow/add.file.relations.as.attachments", "d2/widgets/metadata/panels/relations/metadata.relations.view" ], function(_, BlockingView, TableActionBarView, CSMetadataView, constants, nodeUtils, CommandAddFileRelationsAsAttachments, MetadataRelationsView) {
  "use strict";
  var cmdAddFileRelationsAsAttachments = new CommandAddFileRelationsAsAttachments();
  var CustomMetadataRelationsView = MetadataRelationsView.extend({
    constructor: function CustomMetadataRelationsView(options) {
      options = options || {};
      MetadataRelationsView.prototype.constructor.call(this, options);
      this.listenTo(this.commandController, "before:execute:command", this._beforeExecuteCommand);
    },
    _setTableRowSelectionToolbar: function() {
      MetadataRelationsView.prototype._setTableRowSelectionToolbar.apply(this, arguments);
      var toolItemsCollection = this._tableRowSelectionToolbarView._filteredToolItemsCollection;
      if (toolItemsCollection) {
        toolItemsCollection.updateStatus({
          container: this.options.container || this.collection.node
        });
      }
    },
    _beforeExecuteCommand: function(commandArgs) {
      if (commandArgs && commandArgs.status) {
        commandArgs.status.container = this.options.container || this.collection.node;
        if (commandArgs.commandSignature === cmdAddFileRelationsAsAttachments.get("signature")) {
          commandArgs.status.collection = this.options.containerCollection;
        }
      }
    }
  });
  var TaskFileMetadataView = CSMetadataView.extend({
    constructor: function TaskFileMetadataView(options) {
      options = options || {};
      CSMetadataView.prototype.constructor.call(this, options);
      if (this.options.blockingParentView) {
        BlockingView.delegate(this, this.options.blockingParentView);
      }
      var me = this, metaTabPanel = this.metadataTabView, fnOrigContentOptions = metaTabPanel.contentViewOptions, relationsTabModel = metaTabPanel.collection.findWhere({
        name: "relations"
      });
      if (relationsTabModel) {
        relationsTabModel.set("contentView", CustomMetadataRelationsView);
      }
      this.metadataTabView.contentViewOptions = function(tabModel) {
        var tabContentOptions = fnOrigContentOptions.call(metaTabPanel, tabModel);
        if (tabModel && tabModel.get("name") === "relations") {
          tabContentOptions = _.extend({}, tabContentOptions, {
            container: me.options.container,
            containerCollection: me.options.collection,
            commands: me.options.commands,
            toolbarItems: {
              tableHeaderToolbar: me.options.toolbarItems.relationsTableHeader
            },
            toolbarItemsMasks: me.options.toolbarItemsMasks.toolbars.relationsTableHeader,
            inlineBar: {
              viewClass: TableActionBarView,
              options: _.extend({
                collection: me.options.toolbarItems.relationsInlineActionBar,
                container: me.options.container,
                containerCollection: me.options.collection,
                inlineBarStyle: "csui-table-actionbar-bubble",
                forceInlineBarOnClick: false,
                showInlineBarOnHover: true,
                toolItemsMask: me.options.toolbarItemsMasks.toolbars.relationsInlineActionBar
              }, me.options.toolbarItems.relationsInlineActionBar.options)
            }
          });
        }
        return tabContentOptions;
      };
      var allowedMetaTabs = this.metadataTabView.collection.filter(function(tabModel) {
        return _.contains([ "properties", "relations", "locations", "versions" ], tabModel.get("name"));
      });
      this.metadataTabView.collection.reset(allowedMetaTabs);
      this.listenToOnce(this.metadataTabView, "render", function() {
        if (this.metadataTabView.tabLinks && this.metadataTabView.tabLinks.selected) {
          var me = this, showHideMiniviewerBasedOnTab = function(selectedTab) {
            if (selectedTab && selectedTab.get("name") !== "properties") {
              me._triggerMiniviewerVisibilityEvent(false);
            } else {
              const isEnabled = nodeUtils._showViewer(me.model);
              me._triggerMiniviewerVisibilityEvent(isEnabled);
            }
          };
          this.metadataTabView.tabLinks.selected.on("change:name", showHideMiniviewerBasedOnTab);
          showHideMiniviewerBasedOnTab(this.metadataTabView.tabLinks.selected);
        } else {
          this._triggerMiniviewerVisibilityEvent(true);
        }
      }.bind(this));
      this.listenTo(this, "d2:metadata:edit", function(editMode) {
        var $el = this.options.originatingView && this.options.originatingView.$el;
        $el && (editMode ? $el.addClass("metadata-edit") : $el.removeClass("metadata-edit"));
      }.bind(this));
      _.each(_.values(this.options.toolbarItemsMasks.toolbars), function(mask) {
        this.listenTo(mask, "update", this._onToolitemsMaskUpdate);
      }.bind(this));
    },
    onResolutionChange: function(resolutionData) {
      if (resolutionData.viewPortWidth <= constants.Resolution.MEDIUM) {
        this.metadataHeaderView.metadataItemNameView._applyToggle(resolutionData.showSideBar);
      } else {
        this.metadataHeaderView.metadataItemNameView._removeToggle();
      }
    },
    _triggerMiniviewerVisibilityEvent: function(isVisible) {
      this.trigger("change:miniviewer:visibiity", isVisible);
    },
    _onToolitemsMaskUpdate: function() {
      this.metadataHeaderView.rightbarView && this.metadataHeaderView.rightbarView.toolbarView && this.metadataHeaderView.rightbarView.toolbarView.trigger("dom:refresh");
    },
    prepareForDestroy: function() {
      this.stopListening(this.context.viewStateModel, "change:state");
    }
  });
  return TaskFileMetadataView;
});