/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/marionette", "d2/models/workflow/task", "hbs!d2/controls/task.zero.state.view/impl/task.zero.state", "css!d2/controls/task.zero.state.view/impl/task.zero.state" ], function(_, Marionette, TaskModel, template) {
  "use strict";
  var States = Object.freeze({
    ABORTED: "aborted",
    ACQUIRED: "acquired",
    COMPLETED: "finished",
    DELEGATED: "delegated",
    PAUSED: "paused",
    UNAVAILABLE: "unavailable"
  });
  var TaskZeroStateView = Marionette.LayoutView.extend({
    className: "d2-task-zero-state-view",
    template: template,
    templateHelpers: function() {
      return {
        iconClass: "state-" + this.options.state,
        message: this.options.message,
        instruction: this.options.instructionPrefix
      };
    },
    constructor: function TaskZeroStateView(options) {
      options = options || {};
      this.model = options.model;
      if (this.model instanceof TaskModel) {
        this.setDefaultMessage(options);
      }
      if (!_.contains(_.values(States), options.state)) {
        throw new Error("Invalid state parameter");
      }
      Marionette.LayoutView.prototype.constructor.call(this, options);
    },
    setDefaultMessage: function(options) {
      var msgOptions = this.getMessageOptions();
      var state = this.model.get("task_state"), subject = this.model.get("name"), deleteFlag = this.model.get("delete_flag"), user = "";
      switch (state) {
       case "acquired":
        if (deleteFlag === true) {
          options.state = States.DELEGATED;
          user = this.model.get("delegated_to");
        } else {
          options.state = States.ACQUIRED;
          user = this.model.get("dequeued_by") || this.model.get("assignee");
        }
        break;

       case "dormant":
        options.state = States.ACQUIRED;
        user = this.model.get("dequeued_by") || this.model.get("assignee");
        break;

       case "paused":
        if (deleteFlag === true) {
          options.state = States.ABORTED;
        } else {
          options.state = States.PAUSED;
        }
        break;

       default:
        options.state = state;
        break;
      }
      options.message = this.getFormattedMessage(msgOptions[options.state], subject, user);
    },
    getFormattedMessage: function() {
      return "";
    },
    getMessageOptions: function() {
      return {};
    }
  }, {
    STATES: States
  });
  return TaskZeroStateView;
});