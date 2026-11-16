/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "d2/widgets/widgettile/widgettile.view", "d2/widgets/tasks/tileview.toolbaritems", "d2/widgets/tasks/impl/tasklistitem.view", "d2/widgets/taskstable/task.toolbaritems.masks", "d2/utils/contexts/factories/tasks.factory", "d2/utils/format.utils", "i18n!d2/widgets/tasks/impl/nls/lang", "css!d2/widgets/tasks/impl/tasks" ], function(_, WidgetTileView, tileViewToolbarItems, TaskListItemView, TaskToolItemsMasks, TaskCollectionFactory, formatUtils, lang) {
  "use strict";
  return WidgetTileView.extend({
    childView: TaskListItemView,
    childViewOptions: function() {
      var opts = WidgetTileView.prototype.childViewOptions.apply(this, arguments);
      opts.templateHelpers = function() {
        var dueDateData = formatUtils.formatDueDate(this.model.get("d2_task_due_date"));
        return {
          name: this.model.get("name"),
          unread: !this.model.get("is_read"),
          dueDate: dueDateData && dueDateData.display,
          overdue: dueDateData && dueDateData.overdue,
          enableIcon: true,
          showInlineActionBar: this.showInlineActionBar
        };
      };
      return opts;
    },
    constructor: function TasksView(options) {
      options = options || {};
      var toolbarItemsMasks = new TaskToolItemsMasks();
      _.each(tileViewToolbarItems, function(toolitemsFactory, toolItem) {
        if (toolbarItemsMasks && toolbarItemsMasks.toolbars && toolbarItemsMasks.toolbars[toolItem] && toolitemsFactory && toolitemsFactory.options) {
          toolitemsFactory.options = _.extend({
            toolItemsMask: toolbarItemsMasks.toolbars[toolItem]
          }, toolitemsFactory.options);
        }
      });
      _.extend(options, {
        orderBy: "date_sent desc",
        collectionFactory: TaskCollectionFactory,
        toolbarItems: tileViewToolbarItems,
        lang: lang,
        cssClass: "d2-tasks"
      });
      WidgetTileView.prototype.constructor.call(this, options);
    },
    getFactoryParam: function() {
      return "tasks";
    }
  });
});