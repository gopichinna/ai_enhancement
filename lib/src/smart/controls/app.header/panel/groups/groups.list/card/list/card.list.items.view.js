/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette3", "hbs!smart/controls/app.header/panel/groups/groups.list/card/list/impl/card.item" ], function($, _, Marionette, itemTemplate) {
  "use strict";
  let CardListItemView = Marionette.View.extend({
    tagName: "li",
    template: itemTemplate,
    className: function() {
      let activeClass = "";
      let isActiveFun = this.model.get("isActive");
      if (_.isFunction(isActiveFun)) {
        let isActive = isActiveFun({
          menuItem: this.model,
          context: this.options?.originatingView?.options?.context ?? {}
        });
        let isBrightness = this.options?.panelView?.isBrightness;
        activeClass = isActive ? "smart-group-cards-list-active-item" : "";
        activeClass += isActive && isBrightness ? " smart-group-cards-list-dark-active-item" : "";
      }
      return "smart-group-cards-list-item smart-card-visible " + activeClass;
    },
    attributes: {
      tabindex: 0,
      role: "menuitem"
    },
    constructor: function GroupStandaloneView(options = {}) {
      this.model = options.model;
      Marionette.View.apply(this, arguments);
    },
    onRender: function() {
      this.$el.on("click", _.bind(function() {
        this.options.originatingView.trigger("close:burger:menu");
        let callbackFun = this.model.attributes.execute;
        if (_.isFunction(callbackFun)) {
          callbackFun({
            menuItem: this.model,
            context: this.options.originatingView.options.context
          });
        }
      }, this));
    },
    _applyFilter: function(key) {
      const toggleCurrentElement = _.bind(function(show = true) {
        let methodName = show ? "removeClass" : "addClass";
        this.$el[methodName]("binf-hidden");
      }, this);
      if (key === "") {
        toggleCurrentElement(true);
      } else {
        let name = this.model.get("name").toLowerCase();
        let flag = name.indexOf(key) > -1;
        toggleCurrentElement(flag);
      }
    }
  });
  let CardListItemsView = Marionette.CollectionView.extend({
    tagName: "ul",
    className: "smart-group-cards-list-items",
    childView: CardListItemView,
    childViewOptions: function(item) {
      let opts = {
        ...this.options
      };
      opts.model = item;
      return opts;
    },
    attributes: {
      role: "menu"
    },
    constructor: function CardListItemsView(options = {}) {
      this.collection = options.collection;
      Marionette.CollectionView.apply(this, arguments);
    }
  });
  return CardListItemsView;
});