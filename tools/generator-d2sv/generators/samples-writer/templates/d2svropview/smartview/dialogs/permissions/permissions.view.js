define([
  'nuc/lib/underscore',
  'nuc/lib/jquery',
  'nuc/lib/marionette',
  'd2/sdk/controls/mixins/layoutview.events.propagation.mixin',
  'd2/sdk/controls/behaviors/clientside.infinite.scrolling.behavior',
  'd2/sdk/controls/table/table.view',
  '<%= namespace %>/dialogs/permissions/impl/permission.collection',
  '<%= namespace %>/dialogs/permissions/impl/table.columns',
  'i18n!<%= namespace %>/dialogs/permissions/impl/nls/lang',
  'hbs!<%= namespace %>/dialogs/permissions/impl/permissions',
  'css!<%= namespace %>/dialogs/permissions/impl/permissions'
], function (_, $, Marionette, LayoutViewEventsPropagationMixin, InfiniteScrollingBehavior, TableView,
             PermissionCollection, tableColumns, lang, template) {
  'use strict';

  var InfiniteScrollingTableView = TableView.extend({
    constructor: function InfiniteScrollingTableView(/*options*/) {
      InfiniteScrollingTableView.__super__.constructor.apply(this, arguments);
    },

    ui: {
      row: '.csui-saved-item'
    },
    events: {
      'mousedown @ui.row': 'onRowClicked'
    },

    behaviors: {
      InfiniteScrolling: {
        behaviorClass: InfiniteScrollingBehavior,
        contentParent: '.permission-table-container',
        fetchMoreItemsThreshold: 80,
        fetchMoreItemLength: 10,
        content: '.csui-saved-item'
      }
    },

    onRowClicked: function (event) {
      event.stopPropagation();
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });

  var PermissionView = Marionette.LayoutView.extend({
    className: 'd2-permissions-view',

    template: template,

    regions: {
      rgnTable: '.permissions-container .d2-table .csui-table-view'
    },

    constructor: function PermissionView(options) {
      options = options || {};
      this.node = options.nodes[0];
      this.permissionCollection = PermissionCollection.createFrom(options.data);

      PermissionView.__super__.constructor.call(this, options);
      this.propagateEventsToRegions();
    },

    templateHelpers: function() {
      return {};
    },

    onRender: function() {
      this._setTableView();
    },

    _setTableView: function() {
      if(!this.tableView) {
        var args = _.extend({
          tableColumns: tableColumns,
          connector: this.node.connector,
          collection: this.permissionCollection,
          columns: tableColumns,
          thumbnailColumns: tableColumns,
          columnsWithSearch: ['perm_owner'],
          originatingView: this.options.wizard,
          selectedChildren: new PermissionCollection(),
          inlineBar: {options: {}},
          selectRows: 'none',
          enableSorting: false,
          customLabels: {emptySearchTable: lang.noResults, emptyTable: lang.noResults, zeroRecords: lang.noResults}
        }, this.options);

        this.tableView = new InfiniteScrollingTableView(args);
        this.rgnTable.show(this.tableView);
      }
    }
  });

  LayoutViewEventsPropagationMixin.mixin(PermissionView.prototype);

  return PermissionView;
});