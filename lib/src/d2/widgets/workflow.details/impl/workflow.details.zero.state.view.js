/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "d2/widgets/task.details/impl/task.details.zero.state.view", "i18n!d2/widgets/workflow.details/impl/nls/lang" ], function(_, TaskDetailsZeroStateView, lang) {
  "use strict";
  var WFDetailsZeroStateView = TaskDetailsZeroStateView.extend({
    className: function() {
      var zuper = TaskDetailsZeroStateView.__super__, className = "d2-wfdetails-zero-state-view";
      var clazz = _.isString(zuper.className) ? zuper.className : _.isFunction(zuper.className) ? zuper.className.call(this, this.options) : "";
      className += " " + clazz;
      if (this.options && this.options.className) {
        className += " " + _.result(this.options, "className");
      }
      return className;
    },
    constructor: function WFDetailsZeroStateView(options) {
      options = options || {};
      this.model = options.model;
      options.state = TaskDetailsZeroStateView.STATES.UNAVAILABLE;
      TaskDetailsZeroStateView.prototype.constructor.call(this, options);
      this.options.message = lang.zeroStateMessage;
      this.options.instructionPrefix = _.str.sformat(lang.zeroStateInstructionPrefix, options.workflowListWidget["label_value"]);
    },
    setDefaultMessage: function() {},
    _setupActionsView: function() {},
    _renderActionToolbar: function() {}
  });
  return WFDetailsZeroStateView;
});