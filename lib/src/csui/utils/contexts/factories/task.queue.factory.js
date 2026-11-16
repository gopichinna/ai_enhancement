/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/backbone", "csui/utils/contexts/factories/factory", "csui/utils/taskqueue" ], function(module, _, Backbone, ModelFactory, TaskQueue) {
  var TaskQueueFactory = ModelFactory.extend({
    propertyPrefix: "taskQueue",
    constructor: function TaskQueueFactory(options) {
      ModelFactory.prototype.constructor.apply(this, arguments);
      var taskQueue = this.options.taskQueue || {};
      if (!(taskQueue instanceof TaskQueue)) {
        var config = module.config();
        taskQueue = new TaskQueue(_.extend({}, taskQueue.options, config.options));
      }
      this.property = taskQueue;
    }
  });
  return TaskQueueFactory;
});