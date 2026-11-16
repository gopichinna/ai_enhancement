/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "nuc/utils/base" ], function(_, $, Marionette, base) {
  "use strict";
  var VisibilityDetectionBehavior = Marionette.Behavior.extend({
    constructor: function VisibilityDetectionBehavior() {
      Marionette.Behavior.prototype.constructor.apply(this, arguments);
      this.uid = _.uniqueId("vdb_");
      var selectorFromOptions = this.getBehaviorOption("containerSelector");
      var containerSelector = _.isString(selectorFromOptions) ? selectorFromOptions : ".module-d2-view";
      var containerElementFromOptions = this.getBehaviorOption("containerElement");
      this.$containerElement = $(containerElementFromOptions || containerSelector);
      this.listenToOnce(this.view, "dom:refresh", this._checkAndAttachVisibilityObserver);
    },
    _checkAndAttachVisibilityObserver: function() {
      var isVisible = base.isVisibleInWindowViewport(this.view.el);
      this._raiseVisibilityChangeEvent(isVisible);
      if (!isVisible) {
        var visibilityHandler = _.throttle(function() {
          this._raiseVisibilityChangeEvent(base.isVisibleInWindowViewport(this.view.el));
        }.bind(this), 300);
        this.$containerElement.off("scroll." + this.uid).on("scroll." + this.uid, visibilityHandler);
        $(window).on("resize." + this.uid, visibilityHandler);
      }
    },
    _raiseVisibilityChangeEvent: function(isVisible) {
      this.view && this.view.triggerMethod("visibility:changed", isVisible);
    },
    _removeVisibilityObservers: function() {
      this.$containerElement.off("scroll." + this.uid);
      $(window).off("resize." + this.uid);
    },
    onVisibilityChanged: function(isVisible) {
      if (isVisible === true) {
        this._removeVisibilityObservers();
      }
    },
    onBeforeDestroy: function() {
      this._removeVisibilityObservers();
    },
    getBehaviorOption: function(property) {
      var value = this.getOption(property);
      return _.isFunction(value) ? value.call(this.view) : value;
    }
  });
  return VisibilityDetectionBehavior;
});