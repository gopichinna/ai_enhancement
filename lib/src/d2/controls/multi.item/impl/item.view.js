/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/utils/base", "csui/controls/node-type.icon/node-type.icon.view", "d2/utils/constants", "i18n!d2/controls/multi.item/impl/nls/lang", "hbs!d2/controls/multi.item/impl/item", "css!d2/controls/multi.item/impl/item" ], function(_, $, Backbone, Marionette, base, NodeTypeIconView, constants, lang, template) {
  "use strict";
  var ItemView = Marionette.LayoutView.extend({
    className: "list-item sub-item",
    template: template,
    ui: {
      item: ".item",
      itemInfo: ".item-info",
      itemStatusIcon: ".item-status-icon",
      itemParentInfo: ".parent-info",
      itemParentTitle: ".parent-title"
    },
    regions: {
      iconRegion: ".item-icon"
    },
    templateHelpers: function() {
      return {
        name: this.options.model.get("name"),
        ariaTitle: _.str.sformat(lang.nameTitleAria, this.options.model.get("name"), this.options.model.get("title"))
      };
    },
    constructor: function ItemView() {
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.listenTo(this.model, "change:itemState", this.updateViewBasedOnItemState.bind(this));
      if (this.options.enableReorder) {
        this.$el.attr("draggable", true);
      } else {
        this.$el.attr("draggable", false);
      }
      this.itemSelectView = this.options.itemSelectView;
      this.listenTo(this.model, "change", this.render);
    },
    onDestroy: function() {
      this.stopListening(this.model, "change:itemState");
    },
    events: {
      "click @ui.itemInfo": "_onClickItem",
      "keydown @ui.itemInfo": "_onKeyDown"
    },
    updateViewBasedOnItemState: function() {
      var itemState = this.model.get("itemState");
      this.ui.itemInfo.attr("itemState", this.model.get("itemState"));
      if (lang[itemState + "ToolTip"]) {
        $(this.ui.itemInfo.find(".item-status-icon")[0]).attr("title", lang[itemState + "ToolTip"]);
      }
    },
    _onClickItem: function() {
      if (this.model.get("itemState") === constants.ItemStates.NOT_VISITED) {
        return;
      }
      this.itemSelectView.trigger("childview:click", this);
    },
    _onKeyDown: function(event) {
      var item, index, currentIndex = this.collection.indexOf(this.model);
      var self = this;
      switch (event.keyCode) {
       case 13:
        self.ui.itemInfo.trigger("click");
        break;

       case 38:
        if (currentIndex > 0) {
          if (this.model.parentItem) {
            for (index = currentIndex - 1; index >= 0; index--) {
              item = self.itemSelectView.children.findByModel(this.collection.at(index));
              if (item.model.get("itemState") !== constants.ItemStates.NOT_VISITED) {
                item.ui.itemInfo.trigger("focus");
                break;
              }
            }
          } else {
            var previousIndex = currentIndex - 1;
            item = self.itemSelectView.children.findByModel(this.collection.at(previousIndex));
            item.ui.itemInfo.trigger("focus");
          }
        }
        break;

       case 40:
        if (currentIndex < this.collection.length - 1) {
          if (this.model.parentItem) {
            for (index = currentIndex + 1; index < this.collection.length; index++) {
              item = self.itemSelectView.children.findByModel(this.collection.at(index));
              if (item.model.get("itemState") !== constants.ItemStates.NOT_VISITED) {
                item.ui.itemInfo.trigger("focus");
                break;
              }
            }
          } else {
            var nextIndex = currentIndex + 1;
            item = self.itemSelectView.children.findByModel(this.collection.at(nextIndex));
            item.ui.itemInfo.trigger("focus");
          }
        }
        break;

       default:
        break;
      }
    },
    onRender: function() {
      this.ui.item.attr("data-d2-key", this.model.cid);
      this.ui.itemInfo.attr("tabindex", "-1");
      this.updateViewBasedOnItemState();
      this.updateParentDetails();
      var iconView = new NodeTypeIconView({
        node: this.model
      });
      this.iconRegion.show(iconView);
    },
    updateParentDetails: function() {
      var self = this;
      if (this.model.parentItem) {
        if (this.model.showParent) {
          this.ui.itemParentInfo.removeClass("binf-hidden");
          var parentItem = this.model.parentItem;
          this.ui.itemParentTitle.attr({
            title: parentItem.get("name"),
            "aria-label": _.str.sformat(lang.nameTitleAria, parentItem.get("name"), parentItem.get("title"))
          });
          this.ui.itemParentTitle.html(parentItem.get("name"));
        }
        if (this.itemSelectView) {
          var childItems = this.itemSelectView.collection.select(function(itemModel) {
            return itemModel.parentItem.cid === self.model.parentItem.cid;
          });
          this.$el.addClass("child-item");
          if (childItems[childItems.length - 1].cid === this.model.cid) {
            this.$el.addClass("last-item");
          }
        }
      }
    }
  });
  return ItemView;
});