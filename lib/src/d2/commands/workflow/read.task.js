/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "csui/utils/commandhelper", "i18n!d2/commands/nls/localized.strings", "d2/commands/node.progress.command", "d2/utils/task.utils" ], function(_, $, Backbone, CommandHelper, lang, NodeProgressCommand, taskUtils) {
  "use strict";
  return NodeProgressCommand.extend({
    defaults: {
      signature: "D2-ReadTask",
      command_key: "D2-ReadTask",
      name: lang.CommandNameReadTask,
      scope: "single"
    },
    preProcess: function(status, options) {
      _.extend(options, {
        suppressProgress: true,
        hideSuccessMessage: true,
        hideFailureMessage: false
      });
      return $.Deferred().resolve().promise();
    },
    doAction: function(task, options) {
      _.defaults(options, {
        read: true
      });
      return taskUtils.changeReadStatus(task, options);
    },
    handleResults: function(results, options) {
      var widgetConfig = {}, collection = options.originatingView && options.originatingView.collection || options.collection;
      if (collection && collection.options) {
        widgetConfig.widgetType = collection.widgetType;
        widgetConfig.widgetName = collection.options.widgetName;
      }
      var promises = _.compact(_.map(results, function(result) {
        if (result instanceof Backbone.Model) {
          var deferred = $.Deferred(), done = function() {
            result.trigger("d2:task:read:toggled");
            deferred.resolve(result);
          };
          if (options.suppressRefresh !== true) {
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
        oneFileFailure: lang.ReadOneTaskFailMessage
      };
    }
  });
});