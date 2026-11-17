/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "csui/behaviors/expanding/expanding.behavior" ], function(require, $, _, Backbone, Marionette, ExpandingBehavior) {
  "use strict";
  ExpandingBehavior.prototype.onExpand = function() {
    if (this.expanded) {
      return;
    }
    this.expanded = true;
    var self = this;
    var collection = this.view.completeCollection ? this.view.completeCollection.clone() : this.view.collection.clone();
    if (this.view.currentFilter !== undefined) {
      collection.setFilter(this.view.currentFilter, {
        fetch: false
      });
    }
    this.view.isSearchOpen() && this.view.searchClicked();
    var expandedViewValue = self.getOption("expandedView");
    var expandedViewClass = expandedViewValue;
    if (_.isString(expandedViewValue) !== true) {
      expandedViewClass = expandedViewValue.prototype instanceof Backbone.View ? expandedViewValue : expandedViewValue.call(self.view);
    }
    var requiredModules = [ "csui/controls/dialog/dialog.view" ];
    if (_.isString(expandedViewClass)) {
      requiredModules.push(expandedViewClass);
    }
    require(requiredModules, function(DialogView) {
      if (_.isString(expandedViewClass)) {
        expandedViewClass = arguments[1];
      }
      var expandedViewOptions = getOption(self.options, "expandedViewOptions", self.view);
      self.expandedView = new expandedViewClass(_.extend({
        context: self.view.options.context,
        collection: collection,
        orderBy: getOption(self.options, "orderBy", self.view),
        filterBy: self.view.currentFilter,
        limited: false
      }, expandedViewOptions));
      self.dialog = new DialogView({
        iconLeft: getOption(self.options, "titleBarIcon", self.view) || getOption(self.view.options, "titleBarIcon", self.view),
        actionIconLeft: getOption(self.options, "actionTitleBarIcon", self.view) || getOption(self.view.options, "actionTitleBarIcon", self.view),
        imageLeftUrl: getOption(self.options, "titleBarImageUrl", self.view),
        imageLeftClass: getOption(self.options, "titleBarImageClass", self.view),
        title: getOption(self.options, "dialogTitle", self.view),
        iconRight: getOption(self.options, "dialogTitleIconRight", self.view),
        className: getClassName(self.options, "dialogClassName", self.view),
        largeSize: true,
        view: self.expandedView,
        headerView: getOption(self.options, "headerView", self.view)
      });
      self.listenTo(self.dialog, "before:hide", self._expandOtherView).listenTo(self.dialog, "destroy", self._enableExpandingAgain);
      self._expandOtherView(false);
      self.dialog.show();
      self.expandedView.listenTo(self.expandedView.collection, "sync", function() {
        self.expandedView.unblockActions();
      });
      self.expandedView.listenTo(self.expandedView.collection, "error", function() {
        self.expandedView.unblockActions();
      });
    }, function() {
      self.expanded = false;
    });
  };
  function getOption(object, property, context) {
    if (object == null) {
      return void 0;
    }
    var value = object[property];
    return _.isFunction(value) ? object[property].call(context) : value;
  }
  function getClassName(options, property, context) {
    var className = getOption(options, property, context);
    if (className) {
      className += " csui-expanded";
    } else {
      className = "csui-expanded";
    }
    return className;
  }
});