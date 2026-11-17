/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "d2/utils/contexts/factories/tasks.factory", "d2/utils/widget.constants", "d2/utils/constants", "d2/utils/server.query.utils", "d2/widgets/widgettable/widgettable.view", "d2/widgets/widgettable/toolbaritems", "d2/widgets/taskstable/task.toolbaritems", "d2/widgets/taskstable/task.toolbaritems.masks", "i18n!csui/widgets/nodestable/impl/nls/lang", "i18n!d2/widgets/taskstable/impl/nls/lang", "css!d2/widgets/taskstable/impl/taskstable" ], function($, _, Backbone, Marionette, TasksCollectionFactory, widgetConstants, constants, serverQueryUtils, D2WidgetTable, WidgetTableToolbarItems, TaskToolItems, TaskToolItemsMasks, csuiLang, lang) {
  "use strict";
  var TasksTableView = D2WidgetTable.extend({
    className: function() {
      return D2WidgetTable.prototype.className + " d2-tasks-table-view";
    },
    constructor: function TasksTableView(options) {
      options.d2collectionFactory = TasksCollectionFactory;
      options.selectRows = "none";
      options.inlineRowActions = true;
      options.showFacetPanelOnLoad = true;
      options.toolbarItemsMasks = new TaskToolItemsMasks();
      options.toolbarItems = _.extend({}, WidgetTableToolbarItems, {
        inlineActionbar: TaskToolItems.inlineActionbar,
        inlineRowActionbar: TaskToolItems.inlineRowActionbar,
        leftToolbar: TaskToolItems.tableViewLeftToolbar,
        rightToolbar: TaskToolItems.tableViewRightToolbar,
        filterToolbar: TaskToolItems.tableViewfilterToolbar
      });
      options.getTableRowClassName = function(model) {
        return model.get("is_read") ? "task-read" : "task-unread";
      };
      D2WidgetTable.prototype.constructor.apply(this, arguments);
    },
    initialize: function() {
      D2WidgetTable.prototype.initialize.apply(this, arguments);
      this.facetFilters = this.collection.taskFacets;
    },
    getTitle: function() {
      var widgetName = this.getViewStateWidgetName();
      var widgetConfig = serverQueryUtils.getWidgetConfig(widgetConstants.D2.TASKS, widgetName);
      return widgetConfig && widgetConfig.label_value || lang.dialogTitle;
    },
    getWidgetTypeId: function() {
      return constants.WidgetId.TASKS;
    },
    addFilterCommandAria: function() {
      if (this.tableToolbarView && this.tableToolbarView.filterToolbarView) {
        var toolItemEl = this.tableToolbarView.filterToolbarView.$el.find("li:not(.task-toolbar-back-button) a");
        toolItemEl.removeAttr("aria-expanded");
        if (this.ui.facetView instanceof Object && this.ui.facetView.hasClass("csui-facetview-hidden")) {
          toolItemEl.attr("aria-label", csuiLang.filterExpandAria);
          toolItemEl.attr("title", csuiLang.filterExpandTooltip);
        } else {
          toolItemEl.attr("aria-label", csuiLang.filterCollapseAria);
          toolItemEl.attr("title", csuiLang.filterCollapseTooltip);
        }
      }
    }
  });
  return TasksTableView;
});