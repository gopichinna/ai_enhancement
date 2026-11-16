/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "csui/models/command", "csui/utils/commandhelper", "i18n!d2/commands/nls/localized.strings", "d2/models/workflow/task", "d2/models/workflow/tasks" ], function(require, _, $, CommandModel, CommandHelper, lang, TaskModel, TaskCollection) {
  "use strict";
  return CommandModel.extend({
    defaults: {
      signature: "D2-OpenTask",
      command_key: "D2-OpenTask",
      name: lang.CommandNameOpenTask,
      scope: "single"
    },
    enabled: function(status, options) {
      var node = this.getTask(status, options);
      return node instanceof TaskModel;
    },
    getTask: function(status) {
      return CommandHelper.getJustOneNode(status) || status.nodes && status.nodes.at(0);
    },
    execute: function(status, options) {
      var deferred = $.Deferred(), me = this;
      status.suppressFailMessage = true;
      status.suppressSuccessMessage = true;
      require([ "d2/utils/contexts/factories/next.task" ], function(NextTaskModelFactory) {
        var context = status.context || options && options.context, nextTask = context.getModel(NextTaskModelFactory), task = me.getTask(status, options), taskInfo = {
          id: task.get("id"),
          replaceLastUrl: options && options.replaceLastUrl === true
        };
        _.defaults(taskInfo, me.getAdditionalContextParameters(task, status, options));
        nextTask.set("task_info", taskInfo);
        deferred.resolve(status, options);
      }, deferred.reject);
      return deferred.promise();
    },
    getAdditionalContextParameters: function(task, status, options) {
      var collection = task.collection || status && status.collection;
      return collection instanceof TaskCollection ? {
        tasksWidgetName: collection.options.widgetName,
        orderBy: collection.orderBy,
        filter: _.deepClone(collection.filters),
        top: collection.topCount,
        skip: collection.skipCount,
        facetFilters: _.deepClone(collection.taskFacets.filters),
        hasMoreRecords: collection.hasMoreRecords,
        hadMoreRecords: collection.hadMoreRecords,
        manageAttachments: options && options.manageAttachments
      } : {};
    }
  });
});