/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/utils/log", "csui/utils/base", "i18n!csui/controls/perspective.actions/impl/nls/lang", "csui/utils/commands", "csui/controls/perspective.actions/perspective.action.dropdown.items", "hbs!csui/controls/perspective.actions/impl/perspective.action.dropdown", "smart/themes/theming", "csui/themes/csui.jato.action.icons" ], function(_, $, Backbone, Marionette, log, base, lang, commands, PerspectiveSettingDropdownItems, template, theming, jatoActionIcons) {
  "use strict";
  const PerspectiveSettingDropdown = Marionette.CompositeView.extend({
    className: "csui-perspective-actions-dropdown-view",
    template: template,
    childViewContainer: "ul.csui-top-ribbon-actions-dropdown-menu",
    constructor: function PerspectiveSettingDropdown(options) {
      if (!options) {
        throw new Error("options object is mandatory for PerspectiveSettingDropdown");
      }
      if (!options.view.options.originatingView) {
        throw new Error("options.originatingView is mandatory for PerspectiveSettingDropdown");
      }
      this.dropdownItems = options.view.options.originatingView.options?.dropdownItems;
      Marionette.CompositeView.prototype.constructor.call(this, options);
      this.useIconsForDarkBackground = options.useIconsForDarkBackground;
      this._setViewCollection(this.dropdownItems);
    },
    templateHelpers: function() {
      return {
        perspectiveActionsbarLabel: lang.PerspectiveActionsbarLabel,
        ButtonId: "csui-top-ribbon-actions-toggle" + _.uniqueId(),
        menuId: "csui-top-ribbon-actions-menu" + _.uniqueId(),
        isJATO: theming.isJATOTheme(),
        iconSVG: jatoActionIcons.actionMoreHorizontal
      };
    },
    getChildView: function() {
      return PerspectiveSettingDropdownItems;
    },
    childViewOptions: function() {
      return this.options;
    },
    ui: {
      dropdownToggle: ".csui-top-ribbon-actions-dropdown-toggle"
    },
    events: {
      "shown.binf.dropdown": "onKeyInActionsDropdown",
      "keydown @ui.dropdownToggle": "onKeyInActionsDropdown"
    },
    childEvents: {
      "change:selection": "performOptionChange",
      "selected:menuitem": "performOptionSelected"
    },
    initialize: function() {
      this.listenTo(this, "finish:serialize:welcomepage", this.onFinishSerializeWelcomePage);
    },
    performOptionChange: async function(itemView, eventData) {
      this.closeMenu();
      this.eventData = eventData;
      const selectionView = eventData.view;
      await this.executeCommandForEvent(selectionView, eventData);
      this._setViewCollection(this.dropdownItems);
    },
    performOptionSelected: async function(itemView, eventData) {
      this.closeMenu();
      await this.executeCommandForEvent(itemView, eventData);
    },
    closeMenu: function() {
      if (this.isRendered) {
        if (this.ui.dropdownToggle.parent().hasClass("binf-open")) {
          this.ui.dropdownToggle.binf_dropdown("toggle");
        }
        this.ui.dropdownToggle.attr("aria-expanded", "false");
      }
    },
    alignActionDropDown: function() {
      base.alignDropDownMenu({
        targetEl: $(this.ui.dropdownToggle),
        dropdownMenu: this.$childViewContainer,
        width: $(window).width() - 105
      });
    },
    onFinishSerializeWelcomePage: async function() {
      if (this.eventData.model.get("rerenderAfterSerialization")) {
        this.eventData.view.model?.trigger("finish:serialize:welcomepage");
      }
      await this.executeCommand(null, this.eventData);
    },
    executeCommandForEvent: async function(itemView, eventData) {
      if (eventData.model.get("serialize")) {
        const context = eventData.view.options.originatingView.context;
        context.triggerMethod("serialize:welcomepage", eventData.view.options.originatingView.perspective, eventData.model.get("actionName"), this, true);
      } else {
        await this.executeCommand(itemView, eventData);
      }
    },
    executeCommand: async function(itemView, eventData) {
      const signature = eventData.model.get("signature");
      const command = commands.get(signature);
      const status = this.status;
      const options = {
        eventData: eventData
      };
      try {
        if (typeof command.beforeExecute === "function") {
          await command.beforeExecute(status, options);
        }
        if (typeof command.execute === "function") {
          await command.execute(status, options);
        } else {
          throw new Error('Command "' + signature + '" not found.');
        }
      } catch (error) {
        log.warn('Executing the command "{0}" failed.\n{1}', command.get("signature"), error?.stack) && console.warn(log.last);
      } finally {
        if (typeof command.afterExecute === "function") {
          await command.afterExecute(status, options);
        }
      }
    },
    _setViewCollection: function(dropdownItems) {
      if (!Array.isArray(dropdownItems) || dropdownItems.length === 0) return;
      const tDropdownItems = dropdownItems.filter(el => {
        return commands.get(el.signature).enabled(this);
      });
      this.collection = new Backbone.Collection(tDropdownItems);
    },
    onKeyInActionsDropdown: function(event) {
      const originatingView = this.options?.view?.options?.originatingView;
      const dropdownStyles = this.$childViewContainer[0].style;
      const direction = Array.from(dropdownStyles).find(prop => [ "left", "right" ].includes(prop));
      event.data = {
        direction: direction
      };
      if (!originatingView?.isTopRibbonCarouselDisabled) {
        originatingView.trigger("toggle:carousel", event);
      }
      let focusableEle = this.$childViewContainer[0].querySelectorAll("otc-menuitem")[0];
      let nextbutton;
      let currentFocusedElement = this.options.view.model.collection.indexOf(this.options.view.model);
      if (!$(event.target).attr("aria-expanded")) {
        focusableEle.focus();
      }
      switch (event.key) {
       case "ArrowLeft":
        if (currentFocusedElement > 0) {
          this.setFocustoLayout("ArrowLeft", event);
        }
        event.preventDefault();
        break;

       case "ArrowRight":
        if (currentFocusedElement < this.options.view.model.collection.length - 1) {
          this.setFocustoLayout("ArrowRight", event);
        } else {
          nextbutton = this.options.view.options.originatingView.ui.nextButton[0];
          if (!nextbutton.disabled) {
            nextbutton.focus();
          } else {
            this.options.view.options.originatingView.ui.addPageBtn[0]?.focus();
          }
        }
        break;

       case "Tab":
        if (event.shiftKey && event.key === "Tab" && $(event.target).is(this.ui.dropdownToggle)) {
          this.options.view.el.querySelectorAll(".csui-top-ribbon-layout")[0].focus();
        }
        event.preventDefault();
        break;

       case "Escape":
        this.$el.parents(".csui-perspective-layout")[0].querySelector(".csui-top-ribbon-layout").focus();
        break;
      }
    },
    setFocustoLayout: function(direction, event) {
      this.options.view.options.originatingView.trigger("toggle:carousel", event);
      if (direction === "ArrowLeft") {
        this.$el.parents(".csui-top-ribbon-item").prev().find(".csui-top-ribbon-layout").focus();
      } else if (direction === "ArrowRight") {
        this.$el.parents(".csui-top-ribbon-item").next().find(".csui-top-ribbon-layout").focus();
      }
      event.preventDefault();
    }
  });
  return PerspectiveSettingDropdown;
});