/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette3", "hbs!smart/controls/app.header/panel/groups/groups.list/standalone/impl/group.standalone", "smart/themes/theming", "smart/controls/app.header/panel/groups/menu.items.icon.view" ], function($, _, Marionette, template, theming, IconView) {
  "use strict";
  let GroupStandaloneView = Marionette.View.extend({
    tagName: "li",
    template: template,
    className: function() {
      let activeClass = "";
      let isActiveFun = this.model.get("isActive");
      if (_.isFunction(isActiveFun)) {
        let isActive = this._checkForActiveModel(this.model), isBrightness = this.options?.panelView?.isBrightness;
        activeClass = isActive ? "smart-group-cards-list-active-item" : "";
        activeClass += isActive && isBrightness ? " smart-group-cards-list-dark-active-item" : "";
      }
      return "smart-group-menu-item-wrapper smart-group-menu-item-standalone smart-card-visible " + activeClass;
    },
    templateContext: function() {
      let isJATO = theming.isJATOTheme();
      let jatoIconLength = this?.model?.get("jatoIcon")?.length ?? 0;
      let CFIconLength = this?.model?.get("icon")?.length ?? 0;
      let groupIconLength = isJATO ? jatoIconLength : CFIconLength;
      let hideGroupIcon = this?.model?.get("hideIcon") || groupIconLength == 0;
      return {
        isJATO: isJATO,
        hideGroupIcon: hideGroupIcon
      };
    },
    regions: {
      headerIconRegion: ".smart-group-standalone-header-icon"
    },
    constructor: function GroupStandaloneView(options = {}) {
      this.model = options.model;
      Marionette.View.apply(this, arguments);
    },
    attributes: function() {
      let isActive = this._checkForActiveModel(this.model);
      var attr = {
        tabindex: 0,
        role: "menuitem",
        "aria-current": isActive
      };
      return attr;
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
      this._getIconView();
    },
    _getIconView: function() {
      let options = {};
      options.model = this?.model;
      options.isActiveFunc = _.bind(this._checkForActiveModel, this);
      options.panelView = this.options?.panelView;
      let iconview = new IconView(options);
      iconview.render();
      this.showChildView("headerIconRegion", iconview);
    },
    _checkForActiveModel: function(model) {
      let isActive = model.get("isActive")?.({
        menuItem: model,
        context: this.options?.originatingView?.options?.context ?? {}
      });
      return isActive;
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