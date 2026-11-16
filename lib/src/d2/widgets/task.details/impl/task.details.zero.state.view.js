/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "d2/controls/task.zero.state.view/task.zero.state.view", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "d2/controls/button.toolbar/button.toolbar.view", "i18n!d2/widgets/task.details/impl/nls/lang", "css!d2/widgets/task.details/impl/task.details.zero.state.view" ], function($, _, TaskZeroStateView, LayoutViewEventsPropagationMixin, PerfectScrollingBehavior, ButtonToolbarView, lang) {
  "use strict";
  var TaskDetailsZeroStateView = TaskZeroStateView.extend({
    className: function() {
      var zuper = TaskDetailsZeroStateView.__super__, className = "d2-taskdetails-zero-state-view";
      var clazz = _.isString(zuper.className) ? zuper.className : _.isFunction(zuper.className) ? zuper.className.call(this, this.options) : "";
      className += " " + clazz;
      if (this.options && this.options.className) {
        className += " " + _.result(this.options, "className");
      }
      return className;
    },
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        suppressScrollX: true,
        scrollYMarginOffset: 15
      }
    },
    constructor: function TaskDetailsZeroStateView(options) {
      this.widgetLabel = options.taskListWidget && options.taskListWidget["label_value"] || lang.defaultTaskCollectionWidgetLabel;
      this.options.instructionPrefix = _.str.sformat(lang.zeroStateInstructionPrefix, this.widgetLabel);
      TaskZeroStateView.prototype.constructor.call(this, options);
      this.listenToOnce(this, "render", this._renderActionToolbar);
      this.propagateEventsToRegions();
      this._setupActionsView();
    },
    _setupActionsView: function() {
      if (!this.actionToolbar) {
        var buttonsConfig = {
          center: [ {
            id: "goToTaskList",
            className: "binf-btn-primary",
            label: this.widgetLabel,
            showLabel: true,
            clickHandler: this._onGoToTaskListButtonClick.bind(this)
          } ]
        };
        this.actionToolbar = new ButtonToolbarView(buttonsConfig);
      }
    },
    _renderActionToolbar: function() {
      if (this.actionToolbar) {
        var el = $("<div>").addClass("d2-task-zero-state-action").appendTo(this.$(".d2-task-zero-state-view-content")), region = this.addRegion("d2-task-zero-state-action", {
          selector: el
        });
        region.show(this.actionToolbar);
      }
    },
    _onGoToTaskListButtonClick: function(e) {
      this.trigger("goto:task:list", e);
    },
    getMessageOptions: function() {
      return {
        aborted: lang.zeroStateMessageAborted,
        acquired: lang.zeroStateMessageAcquired,
        finished: lang.zeroStateMessageCompleted,
        delegated: lang.zeroStateMessageDelegated,
        paused: lang.zeroStateMessagePaused,
        unavailable: lang.zeroStateMessageUnavailable
      };
    },
    getFormattedMessage: function(stateMessage, subject, user) {
      return _.str.sformat(stateMessage, subject, user);
    }
  });
  _.extend(TaskDetailsZeroStateView.prototype, LayoutViewEventsPropagationMixin);
  return TaskDetailsZeroStateView;
});