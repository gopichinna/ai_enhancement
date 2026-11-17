/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "csui/controls/progressblocker/blocker", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "dctmw/utils/client.location", "d2/utils/constants", "d2/utils/contexts/factories/savedsearch.factory", "d2/widgets/widgettable/widgettable.view", "d2/widgets/savedsearchestable/impl/savedsearch.toolbaritems", "hbs!d2/widgets/savedsearchestable/impl/contentView/savedsearch.content", "i18n!d2/widgets/savedsearchestable/impl/nls/lang" ], function(_, $, Marionette, BlockingView, LayoutViewEventsPropagationMixin, clientLocation, constants, SavedSearchCollectionFactory, D2WidgetTable, toolbarItems, template, lang) {
  "use strict";
  var SavedSearchTableView = D2WidgetTable.extend({
    constructor: function SavedSearchTableView(options) {
      options.toolbarItems = _.omit(toolbarItems, "headermenuItems");
      options.headermenuItems = {
        headerMenuToolbar: toolbarItems.headerMenuToolbar,
        inlineActionbar: toolbarItems.inlineActionbar,
        tableHeaderToolbar: toolbarItems.tableHeaderToolbar,
        rightToolbar: toolbarItems.rightToolbar
      };
      options.inlineRowActions = true;
      if (options.blockingParentView) {
        BlockingView.delegate(this, options.blockingParentView);
      } else {
        BlockingView.imbue(this);
      }
      D2WidgetTable.prototype.constructor.apply(this, arguments);
      this.listenTo(this.commandController, "after:execute:command", function(toolbarActionContext) {
        if (!toolbarActionContext || toolbarActionContext.cancelled) {
          return;
        }
        toolbarActionContext.commandSignature === "D2-DeleteSavedSearch" && this.clearAllSelectedNodes();
      }.bind(this));
    },
    initialize: function(options) {
      var collectionState = this._restoreCollectionOptionsFromViewState();
      options.orderBy = collectionState.orderBy || "name asc";
      if (collectionState.filter) {
        this.collection.filters = collectionState.filter;
      }
      this.container = this.options.collection.node;
      this.listenTo(this.container, "change:id", function() {
        var currentContainerId = this.container.get("id");
        if (currentContainerId !== this._lastContainerId) {
          this._lastContainerId = currentContainerId;
          this._changingContainer();
        }
      });
      D2WidgetTable.prototype.initialize.apply(this, arguments);
    },
    getWidgetTypeId: function() {
      return constants.WidgetId.SAVED_SEARCH;
    },
    getContainerNode: function() {
      return this.collection.node;
    },
    cancelTitleEdit: function() {
      this.tableToolbarView.captionView.nameView._toggleEditMode(false);
    }
  });
  var SavedSearchContentView = Marionette.LayoutView.extend({
    className: "d2-savedsearch-content-container",
    template: template,
    templateHelpers: {
      labelHome: lang.labelHome,
      instruction: lang.categoryMissingInformation,
      message: lang.categoryMissingMessage,
      hashString: clientLocation.modularizeFragment("#")
    },
    regions: {
      rgnTableView: ".saved-searches-data-view"
    },
    ui: {
      tableContentView: ".saved-searches-data-view",
      zeroStateView: ".d2-savedsearch-zero-state-container",
      message: ".d2-savedsearch-zero-message",
      instruction: ".d2-savedsearch-zero-instruction"
    },
    constructor: function SavedSearchContentView() {
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.propagateEventsToRegions();
    },
    initialize: function() {
      this._setupTableView();
    },
    onRender: function() {
      this.rgnTableView.show(this.tableView);
      var link = $("<a>", {
        class: "homeLink",
        title: lang.labelHome,
        "aria-label": lang.labelHome,
        text: lang.labelHome,
        href: clientLocation.modularizeFragment("#")
      });
      this.ui.instruction.html(_.str.sformat(lang.categoryMissingInformation, link.prop("outerHTML")));
    },
    _setupTableView: function() {
      this.tableView = new SavedSearchTableView(this.options);
    },
    toggleZeroStateView: function(showTable) {
      if (showTable) {
        this.ui.tableContentView.removeClass("binf-hidden");
        this.ui.zeroStateView.addClass("binf-hidden");
        this._tableHidden && this.tableView.trigger("dom:refresh");
      } else {
        this.ui.tableContentView.addClass("binf-hidden");
        this.ui.zeroStateView.removeClass("binf-hidden");
      }
      this._tableHidden = !showTable;
    }
  });
  _.extend(SavedSearchContentView.prototype, LayoutViewEventsPropagationMixin);
  return SavedSearchContentView;
});