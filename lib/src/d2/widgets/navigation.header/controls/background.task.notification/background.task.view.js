/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "d2/controls/stepper.wizard/impl/stepper.util", "i18n!d2/widgets/navigation.header/controls/background.task.notification/impl/nls/lang", "hbs!d2/widgets/navigation.header/controls/background.task.notification/impl/background.task", "css!d2/widgets/navigation.header/controls/background.task.notification/impl/background.task" ], function($, _, Backbone, Marionette, stepperUtil, lang, template) {
  "use strict";
  var instance = null;
  function addUniqueId(object) {
    return _.extend(object, {
      clientId: _.uniqueId("task_client")
    });
  }
  var BackgroundTaskView = Marionette.LayoutView.extend({
    className: "d2-toolbar-background-task-view",
    attributes: {
      tabindex: "-1"
    },
    template: template,
    ui: {
      notificationIcon: ".d2-toolbar-taskview-icon-container  > .d2-icon-toolbar-taskview",
      iconContainer: ".d2-toolbar-taskview-icon-container"
    },
    events: {
      "click @ui.iconContainer": "_onNotificationIconClick",
      keypress: "_onKeyPress"
    },
    constructor: function BackgroundTaskView() {
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      if (instance == null) {
        instance = this;
      }
      this.isBusy = false;
    },
    _onNotificationIconClick: function(event) {
      if (this === instance) {
        event && event.stopPropagation();
        event && event.preventDefault();
        this.triggerMethod("click", this._activeClientId, this._activePromise && this._activePromise.state() === "pending");
      }
    },
    _onKeyPress: function(event) {
      if (event && (event.keyCode === 13 || event.keyCode === 32)) {
        this._onNotificationIconClick(event);
      }
    },
    onShow: function() {
      this._hideView();
    },
    _showView: function(callback) {
      this.ui.iconContainer && this.ui.iconContainer.slideDown("fast", function() {
        this.$el.attr({
          "aria-hidden": false,
          tabindex: 0
        });
        if (_.isFunction(callback)) {
          callback();
        }
        this.trigger("notification:shown");
      }.bind(this));
    },
    _hideView: function(callback) {
      this.$el.attr({
        "aria-hidden": true,
        tabindex: -1
      });
      this.ui.iconContainer && this.ui.iconContainer.slideUp("fast", function() {
        if (_.isFunction(callback)) {
          callback();
        }
        this.trigger("notification:hidden");
      }.bind(this));
    },
    show: function(promise, notificationTooltip) {
      if (this.isBusy) {
        return false;
      }
      var client = addUniqueId({
        request: promise
      });
      this._setClientAndShowRunningState(client, notificationTooltip);
      return client;
    },
    _setClientAndShowRunningState: function(client, tooltip) {
      this._activePromise = client.request;
      this._activeClientId = client.clientId;
      this._showRunningState(tooltip);
    },
    _showRunningState: function(tooltip) {
      var pendingTooltip, completeTooltip;
      if (_.isObject(tooltip)) {
        pendingTooltip = tooltip.pendingTooltip;
        completeTooltip = tooltip.completeTooltip;
      } else if (_.isString(tooltip)) {
        pendingTooltip = tooltip;
        completeTooltip = tooltip;
      }
      if (!stepperUtil.isNonEmptyString(pendingTooltip)) {
        pendingTooltip = lang.deafultPendingTooltip;
      }
      if (!stepperUtil.isNonEmptyString(completeTooltip)) {
        completeTooltip = lang.defaultCompleteTooltip;
      }
      this.isBusy = true;
      this.ui.notificationIcon && this.ui.notificationIcon.addClass("pending");
      this.ui.iconContainer && this.ui.iconContainer.attr("title", pendingTooltip);
      this._showView(function() {
        this.$el.trigger("focus");
      }.bind(this));
      this._activePromise.always(function() {
        this.ui.notificationIcon && this.ui.notificationIcon.removeClass("pending");
        this.ui.iconContainer && this.ui.iconContainer.attr("title", completeTooltip);
      }.bind(this));
    },
    hide: function(promise) {
      if (this._activePromise === promise) {
        this._hideView(function() {
          this.isBusy = false;
          delete this._activePromise;
          delete this._activeClientId;
        }.bind(this));
      }
    },
    onBeforeDestroy: function() {
      if (instance === this) {
        instance = null;
      }
    }
  }, {
    getInstance: function() {
      return instance;
    }
  });
  return BackgroundTaskView;
});