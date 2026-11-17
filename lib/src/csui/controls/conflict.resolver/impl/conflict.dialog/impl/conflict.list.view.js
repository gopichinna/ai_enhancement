/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/utils/base", "csui/controls/list/simplelist.view", "csui/controls/conflict.resolver/impl/conflict.dialog/impl/conflict.item/conflict.item.view", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "csui/controls/conflict.resolver/impl/conflict.dialog/impl/conflict.list.navigation" ], function(_, $, base, SimpleListView, ConflictItemView, TabableRegionBehavior, KeyNavigation) {
  var ConflictListView = SimpleListView.extend({
    childView: ConflictItemView,
    childEvents: {
      resolved: "trackResolved",
      "item:focus": "setItemFocus"
    },
    events: {
      keydown: "onKeyInView",
      mouseenter: "clearTabFocus"
    },
    behaviors: {
      TabableRegionBehavior: {
        behaviorClass: TabableRegionBehavior
      }
    },
    constructor: function ConflictListView(options) {
      options || (options = {});
      this.options = options;
      SimpleListView.prototype.constructor.apply(this, arguments);
      this.notSingleUpload = options.totalNumFiles !== 1;
      this.removeItemList = [];
      this._onSetContaintListHeight = _.bind(this._setContainerListHeight, this);
      $(window).on("resize.app", this._onSetContaintListHeight);
    },
    childViewOptions: function() {
      return {
        selectedNodes: this.options.selectedNodes,
        notSingleUpload: this.notSingleUpload,
        connector: this.options.connector,
        parentId: this.options.parentId,
        removeItemList: this.options.removeItemList
      };
    },
    onDomRefresh: function() {
      this._setContainerListHeight();
    },
    onDestroy: function() {
      $(window).off("resize.app", this._onSetContaintListHeight);
    },
    trackResolved: function() {
      var resolved = arguments[1];
      this.options.trackResolved(resolved);
    },
    _setContainerListHeight: function() {
      var winHeight = $(window).height() * .9 - 100 - 60 - 130 + "px";
      this.$el.find(".cs-content").css("max-height", winHeight);
    },
    _getActiveIndex: function(tabItems) {
      var lastIndex = tabItems.length - 1;
      for (var i = 0; i <= lastIndex; i++) {
        if ($(tabItems[i]).hasClass(TabableRegionBehavior.accessibilityActiveElementClass)) {
          return i;
        }
      }
    }
  });
  _.extend(ConflictListView.prototype, KeyNavigation);
  return ConflictListView;
});