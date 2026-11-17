/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "smart/controls/list/simplelist.view" ], function(_, $, SmartSimpleListView) {
  "use strict";
  var SimpleListView = SmartSimpleListView.extend({
    constructor: function SimpleListView(options) {
      options || (options = {});
      options.data || (options.data = {});
      SmartSimpleListView.prototype.constructor.call(this, options);
      this.listenTo(this, "set:css", this._setCssItemSelected);
    },
    getItemIndex: function(element) {
      var index = -1;
      this.children.some(function(view, viewIndex) {
        if (view === element) {
          index = viewIndex;
          return true;
        }
      });
      return index;
    },
    selectAt: function(index) {
      if (index >= this.collection.length || index < 0) {
        return;
      }
      var $elem = this.selectedIndexElem(index);
      $elem && $elem.trigger("click");
    },
    selectedIndexElem: function(index) {
      if (isNaN(index) || index < 0) {
        return null;
      }
      var nthChildSel = _.str.sformat("div div :nth-child({0}) a", index + 1);
      var $item = this.$(nthChildSel);
      return $($item[0]);
    },
    getSelectedItem: function() {
      var selectedIndex = this.getSelectedIndex();
      var selectedItem = this.children.findByIndex(selectedIndex);
      return selectedItem;
    },
    getSelectedIndex: function() {
      var $selectedItem = this.$el.find("[data-csui-active]");
      var selectedIndex = this.$el.find(".cs-list-group>div").index($selectedItem);
      return selectedIndex;
    },
    setSelectedIndex: function(index) {
      if (isNaN(index) || index < 0) {
        return;
      }
      var nthChildSel = _.str.sformat("div div.smart-simplelist-item:nth-child({0})", index + 1);
      var $item = this.$(nthChildSel);
      this._setCssItemSelected($item);
      $item.first().trigger("focus");
      var $contentView = this.$(".cs-content");
    },
    _setCssItemSelected: function($item) {
      $item.cancelClick = $item?.cancelClick ?? false;
      if (!$item.cancelClick) {
        var active = this.el.querySelector("*[data-csui-active]");
        ($item.length === 1 || $item?.$el?.length === 1) && active !== null && $(active).removeClass("binf-active").removeAttr("data-csui-active").removeAttr("aria-current");
        if ($item.length === 1) {
          $item?.addClass("binf-active")?.attr("data-csui-active", "")?.attr("aria-current", "page");
        } else {
          $item?.$el?.addClass("binf-active")?.attr("data-csui-active", "")?.attr("aria-current", "page");
        }
      }
    },
    setSelectedElement: function(element) {
      var index = this.getItemIndex(element);
      if (index !== -1) {
        this.setSelectedIndex(index);
      }
    }
  });
  return SimpleListView;
});