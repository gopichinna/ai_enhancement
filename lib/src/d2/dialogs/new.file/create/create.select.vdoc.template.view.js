/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "csui/controls/table/table.view", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "csui/controls/progressblocker/blocker", "csui/controls/table/cells/searchbox/searchbox.view", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/utils/constants", "d2/models/base.default.action.items", "d2/dialogs/new.file/create/vdoc.table.columns", "d2/dialogs/new.file/create/vdoc.templates", "i18n!d2/dialogs/new.file/create/impl/nls/lang", "hbs!d2/dialogs/new.file/create/impl/select.vdoc.template", "css!d2/dialogs/new.file/create/impl/select.vdoc.template" ], function($, _, Backbone, Marionette, LayoutViewEventsPropagationMixin, TableView, PerfectScrollingBehavior, BlockingView, SearchBoxView, WizardTabableRegionBehavior, constants, defaultActionItems, columns, VdocTemplateCollection, lang, template) {
  "use strict";
  var VDocTemplateTableView = TableView.extend({
    constructor: function VDocTemplateTableView() {
      this.behaviors = _.extend(this.behaviors, {
        TabableRegion: {
          behaviorClass: WizardTabableRegionBehavior
        }
      });
      TableView.prototype.constructor.apply(this, arguments);
    },
    ui: {
      row: ".csui-saved-item"
    },
    events: {
      "mousedown @ui.row": "onClick"
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
  var VdocTemplatesView = Marionette.LayoutView.extend({
    constructor: function VdocTemplatesView(options) {
      this.wizard = options.wizard;
      Marionette.LayoutView.prototype.constructor.call(this, options);
      this.propagateEventsToRegions();
      if (this.wizard) {
        BlockingView.delegate(this, this.wizard);
      } else {
        BlockingView.imbue(this);
      }
      this.nextButtonDisabled = true;
      this.vdocTemplates = this.options.node.vdocTemplates;
      this.vdocTemplates.sorting = {
        sort: [ "name" ]
      };
    },
    template: template,
    className: "d2-vdoc-templates-wrapper",
    ui: {
      searchSection: ".d2-vdoc-template-column-search",
      recentSection: ".d2-recent-vdoc-templates",
      presetSection: ".d2-preset-vdoc-templates",
      recentListTableView: ".d2-recent-vdoc-templates .d2-table .csui-table-view",
      presetListTableView: ".d2-preset-vdoc-templates .d2-table .csui-table-view"
    },
    regions: {
      searchRegion: "@ui.searchSection",
      recentListTableRegion: "@ui.recentListTableView",
      presetListTableRegion: "@ui.presetListTableView"
    },
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: ".d2-vdoc-template-body",
        suppressScrollX: true
      }
    },
    getTitle: function() {
      return lang.vdocTemplatesTitle;
    },
    templateHelpers: function() {
      return {
        presetTitle: lang.presetHeader,
        recentTitle: lang.recentHeader
      };
    },
    onRender: function() {
      this._setTableView();
    },
    validate: function() {
      if (this._vdocTemplate) {
        return true;
      }
      return false;
    },
    selectTemplate: function(selectTable) {
      var selectedRowsCount = selectTable.getSelectedChildren().length;
      if (selectedRowsCount > 0) {
        this._vdocTemplate = selectTable.getSelectedChildren()[0];
        this.nextButtonDisabled = false;
        this.options.wizard.refreshFooter();
      }
    },
    deselectTemplate: function(args) {
      if (args && args.sender) {
        this._vdocTemplate = undefined;
        this.nextButtonDisabled = true;
        this.options.wizard.refreshFooter();
      }
    },
    _setTableView: function() {
      var presetTableOptions = _.extend({
        tableColumns: columns,
        connector: this.options.node.connector,
        collection: this.options.node.vdocTemplates,
        columns: columns,
        columnsWithSearch: [ "name" ],
        actionItems: defaultActionItems,
        commands: this.commands,
        originatingView: this.options.wizard,
        selectRows: "single",
        customLabels: {
          emptySearchTable: lang.noResults,
          emptyTable: lang.noResults,
          zeroRecords: lang.noResults
        }
      }, this.options);
      this.presetTableView = new VDocTemplateTableView(presetTableOptions);
      this.presetTableView.enableEmptyViewText();
      this.presetListTableRegion.show(this.presetTableView);
      this.listenTo(this.presetTableView, "tableHeaderRendered", function() {
        if (this.presetTableView) {
          this.presetTableView.$el.find(".csui-table-cell-_select").html("");
        }
      }, this);
      this.listenTo(this.presetTableView, "tableRowSelected", function() {
        this.selectTemplate(this.presetTableView);
      }, this);
      this.listenTo(this.presetTableView, "tableRowUnselected", this.deselectTemplate);
    }
  });
  _.extend(VdocTemplatesView.prototype, LayoutViewEventsPropagationMixin);
  return VdocTemplatesView;
});