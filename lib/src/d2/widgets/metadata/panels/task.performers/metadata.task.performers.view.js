/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "csui/controls/tableactionbar/tableactionbar.view", "csui/utils/commands", "d2/widgets/table/table.inline.row.actions.mixin", "d2/widgets/metadata/panels/metadata.base.view", "d2/widgets/metadata/panels/task.performers/task.performer.collection", "d2/widgets/taskstable/task.toolbaritems", "d2/utils/constants", "css!d2/widgets/metadata/panels/task.performers/impl/metadata.task.performers" ], function(module, $, _, Marionette, TableActionBarView, commands, TableInlineRowActionsMixin, MetadataBaseTableView, TaskPerformersCollection, taskToolItems, constants) {
  "use strict";
  var config = module.config();
  _.defaults(config, {
    defaultPageSize: 30,
    defaultPageSizes: [ 30, 50, 100 ]
  });
  var MetadataTaskPerformersTableView = MetadataBaseTableView.extend({
    constructor: function MetadataTaskPerformersTableView(options) {
      _.defaults(options, {
        collectionClass: TaskPerformersCollection,
        commands: commands,
        pageSize: config.defaultPageSize,
        ddItemsList: config.defaultPageSizes,
        toolbarItems: {
          tableHeaderToolbar: taskToolItems.taskPerformersActionbar,
          inlineActionbar: taskToolItems.taskPerformersActionbar
        },
        selectRows: "none",
        columnsWithSearch: [ "performer_label", "performer_type", "d2_performer_value" ],
        inlineBar: {
          viewClass: TableActionBarView,
          options: {
            collection: taskToolItems.taskPerformersActionbar,
            inlineBarStyle: "csui-table-actionbar-bubble",
            forceInlineBarOnClick: false,
            showInlineBarOnHover: true
          }
        },
        parentView: this,
        staticActions: true
      });
      MetadataTaskPerformersTableView.__super__.constructor.call(this, options);
      this.listenTo(this.model, "d2:task:update:performers", this._onUpdatePerformers);
    },
    className: function() {
      return MetadataBaseTableView.prototype.className + " metadata-task-performers";
    },
    onRender: function() {
      MetadataBaseTableView.prototype.onRender.apply(this, arguments);
      this.listenTo(this, "table:view:initialized", () => {
        this.createInlineRowAction(this.tableView, this.options);
      });
      var resizeHandler = _.debounce(_.bind(this._onResize, this), 50);
      $(window).on("resize", {
        view: this
      }, resizeHandler);
      $(window).on("resize.tableview", {
        view: this
      }, resizeHandler);
      this.listenTo(this, "before:destroy", function() {
        $(window).off("resize", resizeHandler);
        $(window).off("resize.tableview", resizeHandler);
      });
    },
    _onResize: function() {
      if (this.tableView && this.$el.closest('div[role="tabpanel"]').hasClass("binf-active")) {
        this.tableView.trigger("dom:refresh");
      }
    },
    _onUpdatePerformers: function(taskPerformersAliasList) {
      this.collection.reset(taskPerformersAliasList);
    }
  }, {
    enabled: function(options) {
      return options.node.get("type") === constants.Types.TASK;
    }
  });
  _.extend(MetadataTaskPerformersTableView.prototype, TableInlineRowActionsMixin);
  return MetadataTaskPerformersTableView;
});