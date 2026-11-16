/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/lib/marionette", "csui/utils/base", "csui/controls/listitem/simpletreelistitem.view", "csui/behaviors/default.action/default.action.behavior", "hbs!csui/controls/list/impl/simpletreelist", "css!csui/controls/list/impl/simpletreelist" ], function(_, $, Backbone, Marionette, base, SimpleTreeListItemView, DefaultActionBehavior, treeListTemplate) {
  var SimpleTreeListView = Marionette.CollectionView.extend({
    constructor: function SimpleTreeListView(options) {
      options || (options = {});
      Marionette.CollectionView.call(this, options);
    },
    ui: {},
    events: {},
    childEvents: {
      "click:item": "onClickItem",
      render: "_onChildRender"
    },
    className: "cs-simpletreelist binf-panel binf-panel-default",
    template: treeListTemplate,
    childViewContainer: ".cs-list-group",
    childView: SimpleTreeListItemView,
    childViewOptions: function() {
      return {
        template: this.options.childViewTemplate
      };
    },
    _onChildRender: function(childView) {
      var $item = childView.$el;
      if ($item.is("[data-csui-active]")) {
        $item.addClass("binf-active");
      }
    },
    onClickItem: function(src) {
      src.cancelClick = false;
      this.trigger("click:item", src);
      if (src.cancelClick === false) {
        this._setCssItemSelected(src.$el);
      }
    },
    _setCssItemSelected: function($item) {
      if (!($item instanceof $)) {
        return;
      }
      var $active = $item.siblings("[data-csui-active]");
      $active.removeClass("binf-active").removeAttr("data-csui-active");
      $item.addClass("binf-active").attr("data-csui-active", "");
    }
  });
  return SimpleTreeListView;
});