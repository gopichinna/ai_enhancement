/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "csui/utils/commandhelper", "nuc/utils/url", "d2/commands/node.progress.command", "d2/models/workflow/workflow.audits", "d2/utils/rest.linkrels", "d2/utils/constants", "d2/utils/task.utils", "i18n!d2/commands/nls/localized.strings" ], function(require, $, _, Backbone, CommandHelper, Url, NodeProgressCommand, WorkflowAuditCollection, RestLinkrels, constants, taskUtils, lang) {
  "use strict";
  return NodeProgressCommand.extend({
    defaults: {
      signature: "D2-AcquireTask",
      command_key: "D2-AcquireTask",
      name: lang.CommandNameAcquireTask,
      scope: "single"
    },
    doAction: function(node, options) {
      var deferred = $.Deferred();
      taskUtils.acquireTask(node, _.extend({
        signature: this.get("signature")
      }, options)).done(function(response) {
        if (response && response.properties && response.properties.r_object_id) {
          node.set("_new_task_id", response.properties.r_object_id);
        }
        deferred.resolve();
      }).fail(deferred.reject);
      return deferred.promise();
    },
    handleResults: function(results, options) {
      var widgetConfig = {}, collection = options.collection || options.originatingView && options.originatingView.collection;
      if (collection && collection.options) {
        widgetConfig.widgetType = collection.widgetType;
        widgetConfig.widgetName = collection.options.widgetName;
      }
      if (collection instanceof WorkflowAuditCollection) {
        var successful = _.find(results, function(result) {
          return result instanceof Backbone.Model;
        });
        if (successful) {
          return collection.fetch({
            reload: true,
            reset: true
          });
        } else {
          return $.Deferred.resolve();
        }
      }
      var promises = _.compact(_.map(results, function(result) {
        if (result instanceof Backbone.Model) {
          var deferred = $.Deferred(), oldId = result.get("id"), newId = result.get("_new_task_id") || oldId, done = function() {
            result.trigger("d2:task:acquired", oldId, {
              id: newId,
              name: result.get("name")
            });
            deferred.resolve(result);
          };
          result.unset("_new_task_id");
          if (options.suppressRefresh !== true) {
            result.set("id", newId);
            CommandHelper.refreshNode(result, widgetConfig).done(done).fail(deferred.reject);
          } else {
            done();
          }
          return deferred.promise();
        }
      }));
      return $.whenAll.apply($, promises);
    },
    getMessageOptions: function() {
      return {
        oneFilePending: lang.AcquiringOneTask,
        oneFileSuccess: lang.AcquireOneTaskSuccessMessage,
        oneFileFailure: lang.AcquireOneTaskFailMessage
      };
    }
  });
});