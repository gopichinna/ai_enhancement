/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette3", "hbs!smart/controls/app.header/panel/groups/groups.list/standalone/impl/group.standalone" ], function($, _, Marionette, template) {
  "use strict";
  let GroupStandaloneView = Marionette.View.extend({
    tagName: "li",
    template: template,
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
      return "smart-group-menu-item-wrapper smart-group-menu-item-standalone smart-card-visible " + activeClass;
    },
    constructor: function GroupStandaloneView(options = {}) {
      this.model = options.model;
      Marionette.View.apply(this, arguments);
    },
    attributes: {
      tabindex: 0,
      role: "menuitem"
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
      this.listenTo(this.options.parentView, "apply:filter", _.bind(this._applyFilter, this));
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
  return GroupStandaloneView;
});