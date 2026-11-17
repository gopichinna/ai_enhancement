/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "smart/controls/listitem/simpletreelistitem.view", "hbs!smart/controls/list/impl/simpletreelist" ], function(_, $, Marionette, SimpleTreeListItemView, treeListTemplate) {
  var SimpleTreeListView = Marionette.CollectionView.extend({
    constructor: function SimpleTreeListView(options) {
      options || (options = {});
      options.enableIcon = options?.enableIcon ?? true;
      Marionette.CollectionView.call(this, options);
    },
    ui: {},
    events: {},
    childEvents: {
      "click:item": "onClickItem",
      render: "_onChildRender"
    },
    className: "cs-simpletreelist smart-simpletreelist binf-panel binf-panel-default",
    template: treeListTemplate,
    childViewContainer: ".cs-list-group",
    childView: SimpleTreeListItemView,
    childViewOptions: function() {
      return {
        template: this.options.childViewTemplate,
        emptyGroupTextPlaceholder: this.options?.emptyGroupTextPlaceholder
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
      $active?.removeClass("binf-active")?.removeAttr("data-csui-active");
      $item.addClass("binf-active").attr("data-csui-active", "");
    }
  });
  return SimpleTreeListView;
});