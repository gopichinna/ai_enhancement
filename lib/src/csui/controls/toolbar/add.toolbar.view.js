/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/marionette", "csui/controls/item.title/impl/otcdropdown.menu/menu.toolitem.view", "csui/controls/item.title/impl/otcdropdown.menu/submenu.toolitem.view", "csui/utils/high.contrast/detector!", "smart/themes/theming", "hbs!csui/controls/toolbar/impl/add.toolbar", "css!csui/controls/toolbar/impl/toolbar" ], function(_, Marionette, MenuToolItemView, SubMenuToolItemView, highContrast, theming, template) {
  "use strict";
  const AddToolBarView = Marionette.CompositeView.extend({
    className: function() {
      const cssClassForNavigationBar = "binf-nav binf-nav-pills ";
      const cssClassForAlignment = "csui-align-left";
      return "csui-toolbar " + cssClassForNavigationBar + cssClassForAlignment;
    },
    template: template,
    templateHelpers: function() {
      return {
        isJATO: theming.isJATOTheme(),
        buttonID: _.uniqueId("dropdownMenuButton"),
        iconName: this.options.dropDownIconName,
        iconSVG: this.options.dropDownIconSVG,
        iconAppearance: this._useIconsForDarkBackground ? "light" : "dark",
        showMoreText: this.options.dropDownText
      };
    },
    attributes: function() {
      return {
        role: "none"
      };
    },
    ui: {
      dropdownButton: "otc-button",
      dropdownMenu: "otc-menu"
    },
    events: {
      "open @ui.dropdownMenu": "onMenuOpen"
    },
    childViewContainer: "otc-menu",
    getChildView: function(item) {
      return item.get("flyout") ? SubMenuToolItemView : MenuToolItemView;
    },
    childViewOptions: function(model) {
      return {
        toolbarCommandController: this.options.toolbarCommandController,
        toolbarItemsMask: this.options.toolbarItemsMask,
        originatingView: this.options.originatingView,
        blockingParentView: this.options.blockingParentView,
        noMenuRoles: this.options.noMenuRoles,
        useIconsForDarkBackground: this.options.useIconsForDarkBackground,
        collection: model.toolItems,
        command: this.collection.commands && this.collection.commands.findWhere({
          signature: model.get("signature")
        }),
        useIconsForDarkBackground: this._useIconsForDarkBackground
      };
    },
    constructor: function AddToolBarView(options = {}) {
      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
      this._useIconsForDarkBackground = options.useIconsForDarkBackground && highContrast !== 2 || highContrast === 1;
      this.listenTo(this.collection, "update reset", this.updateAddButton);
      this.listenTo(this, "render", this.updateAddButton);
    },
    onMenuOpen: function() {
      this.trigger("toolbar.show");
    },
    updateAddButton: function() {
      if (this.collection.length) {
        this.ui.dropdownButton.removeClass?.("binf-hidden");
      } else {
        this.ui.dropdownButton.addClass?.("binf-hidden");
      }
    },
    appendLazyActions: function() {
      const self = this;
      const existingChildViews = _.sortBy(self.children.toArray(), view => parseInt(view.cid.substring(4)));
      let index = 0;
      const actionItems = _.filter(self.collection.models, model => model);
      _.each(actionItems, function(model) {
        const existingChildView = existingChildViews[index];
        if (!(existingChildView && existingChildView.model.get("name") === model.get("name"))) {
          const childViewClass = model.get("flyout") ? SubMenuToolItemView : MenuToolItemView;
          self.addChild(model, childViewClass);
          existingChildView && self.removeChildView(existingChildView);
        } else {
          if (model.get("flyout") && model.toolItems.length !== existingChildView.model.toolItems.length) {
            existingChildView.collection.reset(model.toolItems.models);
          }
          index++;
        }
      });
    },
    startLazyLoading: function() {
      const loaderElement = document.createElement("li");
      loaderElement.setAttribute("role", "none");
      if (!theming.isJATOTheme()) {
        loaderElement.setAttribute("data-smart-theme", "light");
      }
      loaderElement.classList.add("csui-loading-parent-wrapper", "binf-disabled");
      const spanWrapper = document.createElement("span");
      spanWrapper.classList.add("csui-loading-dots-wrapper");
      for (let i = 0; i < 3; i++) {
        const dotElement = document.createElement("span");
        dotElement.classList.add("csui-loading-dot");
        spanWrapper.appendChild(dotElement);
      }
      loaderElement.appendChild(spanWrapper);
      loaderElement.style.alignSelf = "center";
      this.ui.dropdownMenu.append(loaderElement);
    },
    stopLazyLoading: function() {
      let blockingEle = this.$el.find(".csui-loading-parent-wrapper");
      blockingEle.remove();
    }
  });
  return AddToolBarView;
});