/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "csui/controls/table/table.view", "csui/controls/table/cells/select/select.view", "dctmw/controls/behaviors/clientside.infinite.scrolling.behavior", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "csui/controls/progressblocker/blocker", "d2/utils/constants", "d2/models/base.default.action.items", "d2/dialogs/digital.signature/supporting.document/table.columns", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/dialogs/new.file/edit/header.message.view", "i18n!d2/dialogs/digital.signature/supporting.document/impl/nls/lang", "hbs!d2/dialogs/digital.signature/impl/supporting.document.selection", "css!d2/dialogs/digital.signature/impl/supporting.document.selection" ], function(module, $, _, Backbone, Marionette, LayoutViewEventsPropagationMixin, TableView, SelectCellView, InfiniteScrollingBehavior, PerfectScrollingBehavior, TabableRegionBehavior, BlockingView, constants, defaultActionItems, columns, WizardTabableRegionBehavior, HeaderMessageView, lang, template) {
  "use strict";
  var InfiniteScrollingTableView = TableView.extend({
    constructor: function InfiniteScrollingTableView() {
      InfiniteScrollingTableView.__super__.constructor.apply(this, arguments);
    },
    ui: {
      row: ".csui-saved-item"
    },
    events: {
      "mousedown @ui.row": "onClick"
    },
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: ".d2-supporting-docs-body-wrapper",
        suppressScrollX: true
      },
      InfiniteScrolling: {
        behaviorClass: InfiniteScrollingBehavior,
        contentParent: ".d2-supporting-docs-body-wrapper",
        fetchMoreItemsThreshold: 80,
        fetchMoreItemLength: 10,
        content: ".csui-saved-item"
      }
    },
    onClick: function(event) {
      event.stopPropagation();
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!$(event.target).hasClass("csui-checkbox") && !$(event.target).parent().hasClass("csui-checkbox")) {
        $(event.target).closest(".csui-saved-item").find(".csui-checkbox").trigger("click");
      }
    }
  });
  var TaskSupportingDocsSelectionView = Marionette.LayoutView.extend({
    template: template,
    className: "d2-suppporting-wrapper",
    ui: {
      templateWrapper: ".d2-supporting-docs",
      listTableView: ".d2-supporting-docs .d2-table .csui-table-view",
      listView: ".d2-supporting-docs-container .d2-table",
      sectionTitle: ".d2-supporting-docs .template-title",
      headerMessageView: ".d2-supporting-docs-info"
    },
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: ".d2-supporting-docs-body"
      },
      InfiniteScrolling: {
        behaviorClass: InfiniteScrollingBehavior,
        contentParent: ".d2-supporting-docs-body",
        fetchMoreItemsThreshold: 80,
        fetchMoreItemLength: 10,
        content: ".csui-saved-item"
      },
      TabableRegion: {
        behaviorClass: WizardTabableRegionBehavior
      }
    },
    regions: {
      listTableRegion: "@ui.listTableView",
      headerRegion: "@ui.headerMessageView"
    },
    templateHelpers: function() {
      return {
        infoMessage: lang.infoMessage
      };
    },
    constructor: function TemplatesView(options) {
      TaskSupportingDocsSelectionView.__super__.constructor.call(this, options);
      this.collection = this.options.collection;
    },
    validate: function() {
      return false;
    },
    isValid: function() {
      return true;
    },
    onRender: function() {
      this._setTableView();
    },
    _setTableView: function() {
      this.options || (this.options = {});
      this.options.pageSize = 30;
      this.options.ddItemsList = [ 30, 60, 100 ];
      var noOfElements = this.collection.length;
      columns.each(function(column) {
        if (column.get("key") === "name") {
          column.set("title", _.str.sformat(lang.nameColumnHeader, noOfElements));
        }
      });
      this.collection.each(function(model) {
        model.set(SelectCellView.isSelectedModelAttributeName, true);
      });
      var args = _.extend({
        tableColumns: columns,
        connector: this.model.connector,
        collection: this.collection,
        columns: columns,
        thumbnailColumns: columns,
        columnsWithSearch: [],
        actionItems: defaultActionItems,
        commands: this.commands,
        originatingView: this.options.wizard,
        inlineBar: {
          options: {}
        },
        selectRows: "multiple",
        enableSorting: false,
        customLabels: {
          emptySearchTable: lang.noResults,
          emptyTable: lang.noResults,
          zeroRecords: lang.noResults
        }
      }, this.options);
      args.collections = this.collection;
      delete args.blockingParentView;
      this.tableView = new InfiniteScrollingTableView(args);
      this.tableView.enableEmptyViewText();
      var me = this;
      me.listenTo(me.tableView, "dom:refresh", function() {
        me.tableView.$el.find("th.csui-table-cell-type").remove();
      });
      this.listTableRegion.show(this.tableView);
      this.messageView = new HeaderMessageView({
        message: lang.infoMessage,
        mode: "info"
      });
      this.headerRegion.show(this.messageView);
    },
    getTitle: function() {
      return lang.supportingDocumentsTitle;
    },
    onShow: function() {
      this.tableView.trigger("dom:refresh");
      var me = this;
      this.listenTo(this, "dom:refresh", function() {
        var height = $(me.ui.templateWrapper).innerHeight() - ($(me.ui.headerMessageView).outerHeight() + 34);
        $(me.ui.listView).css({
          "max-height": height,
          height: height
        });
      });
    },
    getSelectedChildren: function() {
      var crit = {};
      crit[SelectCellView.isSelectedModelAttributeName] = true;
      return this.collection.where(crit);
    }
  });
  _.extend(TaskSupportingDocsSelectionView.prototype, LayoutViewEventsPropagationMixin);
  return TaskSupportingDocsSelectionView;
});