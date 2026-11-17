/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "d2/dialogs/task.delegate/task.delegate.view", "d2/utils/task.utils" ], function($, _, TaskDelegateView, TaskUtils) {
  var ChangeSupervisorView = TaskDelegateView.extend({
    className: function() {
      return TaskDelegateView.prototype.className.apply(this, arguments) + " change-wf-supervisor-form";
    },
    constructor: function() {
      TaskDelegateView.prototype.constructor.apply(this, arguments);
    },
    getUsers: function(filter, options) {
      var dfd = $.Deferred(), me = this;
      TaskUtils.getUsersForChangeSupervisor(options.node, filter, options).done(function(result) {
        var currentSupervisor = options.node.get("supervisor_name"), index = _.findIndex(result.options, function(user) {
          return user.value === currentSupervisor;
        });
        if (index > -1) {
          result.options.splice(index, 1);
          delete result.userData[currentSupervisor];
        }
        me.trigger("supervisor:user:list", result);
        dfd.resolve(result);
      }).fail(function() {
        dfd.reject();
      });
      return dfd.promise();
    }
  });
  return ChangeSupervisorView;
});