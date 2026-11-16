/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/behaviors/keyboard.navigation/tabables.behavior", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "d2/controls/behaviors/wizard.tabable.region.behavior", "hbs!d2/controls/button.toolbar/impl/button.toolbar", "hbs!d2/controls/button.toolbar/impl/svg.button", "css!d2/controls/button.toolbar/impl/button.toolbar", "csui/controls/icons.v2" ], function(_, $, Backbone, Marionette, TabablesBehavior, LayoutViewEventsPropagationMixin, WizardTabableRegionBehavior, tmplToolbar, tmplsvgbtn) {
  "use strict";
  var observedButtonAttributes = [ "hidden", "disabled", "className", "label", "tooltip", "tooltipSelected" ];
  var ButtonView = Marionette.ItemView.extend({
    tagName: "div",
    attributes: {
      type: "button",
      tabindex: -1
    },
    className: "binf-btn",
    template: false,
    modelEvents: {
      change: "onModelChange"
    },
    events: {
      click: "onClick",
      keyup: "onKeyUp"
    },
    constructor: function ButtonView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.isToggleButton = this.model.get("type") === "toggle";
      this.toggleStateSelected = this.model.get("isSelected") === true;
    },
    onRender: function() {
      this.adjustViewState();
      if (this.model.get("contentView") instanceof Marionette.View) {
        this.$el.html(this.model.get("contentView").$el);
      }
    },
    adjustViewState: function() {
      var attrs = {
        title: this.getTooltip(),
        disabled: this.model.get("disabled") === true
      }, handler = this.model.get("clickHandler");
      var classNames = this.className + " " + (this.model.get("className") || "");
      if (this.model.get("hidden") === true) {
        classNames += " binf-hidden";
        attrs["aria-hidden"] = true;
      } else {
        attrs["aria-hidden"] = false;
      }
      attrs["class"] = classNames;
      if (this.isToggleButton) {
        attrs["aria-selected"] = this.toggleStateSelected;
        handler = handler || this.model.get("toggleHandler");
      }
      if (!_.isFunction(handler)) {
        this.$el.removeAttr("tabindex");
      } else {
        attrs["tabindex"] = 0;
      }
      this.$el.attr(attrs);
      if (this.model.get("showLabel") === true && !(this.model.get("contentView") instanceof Marionette.View)) {
        this.$el.text(this.model.get("label"));
      }
    },
    getTooltip: function() {
      if (this.isToggleButton) {
        return this.toggleStateSelected ? this.model.get("tooltipSelected") : this.model.get("tooltip");
      } else {
        return this.model.get("tooltip") || this.model.get("label");
      }
    },
    onModelChange: function() {
      if (_.any(_.keys(this.model.changed), function(key) {
        return _.includes(observedButtonAttributes, key);
      })) {
        this.adjustViewState();
      }
    },
    _toggleSelectedState: function() {
      this.toggleStateSelected = !this.toggleStateSelected;
      this.$el.attr({
        "aria-selected": this.toggleStateSelected,
        title: this.getTooltip()
      });
      this.model.set("isSelected", this.toggleStateSelected);
    },
    onClick: function(e) {
      if (!this.model.get("disabled")) {
        var clickHandler = this.model.get("clickHandler") || _.noop;
        _.isFunction(clickHandler) && clickHandler(e, this);
        if (this.isToggleButton && !e.isDefaultPrevented()) {
          this._toggleSelectedState();
          var toggleHandler = this.model.get("toggleHandler") || _.noop;
          _.isFunction(toggleHandler) && toggleHandler(e, this.toggleStateSelected, this);
          if (e.isDefaultPrevented()) {
            this._toggleSelectedState();
          }
        }
      }
    },
    onKeyUp: function(e) {
      var keyCode = e.keyCode;
      if (keyCode === 13 || keyCode === 32) {
        this.onClick(e);
      }
    }
  });
  var SvgButtonView = ButtonView.extend({
    template: tmplsvgbtn,
    templateHelpers: function() {
      var iconV2Name = this.model.get("iconName") || "";
      var iconState = this.model.get("isSelected") ? this.model.get("isSelected") : false;
      return {
        iconName: iconV2Name,
        iconState: iconState
      };
    },
    constructor: function SvgButtonView() {
      ButtonView.prototype.constructor.apply(this, arguments);
      this.listenTo(this.model, "change:isSelected", function() {
        this.render();
      });
    }
  });
  var ButtonModel = Backbone.Model.extend({
    defaults: {
      order: 1,
      viewClass: ButtonView
    },
    constructor: function ButtonModel(attributes) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      if (attributes.iconName) {
        this.set("viewClass", SvgButtonView);
      }
    }
  });
  var ButtonSetView = Marionette.CollectionView.extend({
    className: "d2-button-set",
    getChildView: function(item) {
      return _.isFunction(item.get("viewClass")) ? item.get("viewClass") : ButtonView;
    },
    constructor: function ButtonSetView() {
      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
      this.listenTo(this.collection, "reset update", this._adjustVisibility);
    },
    _adjustVisibility: function() {
      if (this.collection.length) {
        this.$el.removeClass("binf-hidden");
      } else {
        this.$el.addClass("binf-hidden");
      }
    },
    onBeforeRender: function() {
      this.$el.addClass(this.className);
      this._adjustVisibility();
    }
  });
  var ButtonToolbarView = Marionette.LayoutView.extend({
    className: function() {
      var className = "d2-button-toolbar";
      if (this.options && this.options.clazzName) {
        className += " " + _.result(this.options, "clazzName");
      }
      return className;
    },
    template: tmplToolbar,
    behaviors: {
      TabableRegion: {
        behaviorClass: WizardTabableRegionBehavior,
        initialActivationWeight: 0
      }
    },
    regions: {
      rgnLeft: ".region-left",
      rgnCenter: ".region-center",
      rgnRight: ".region-right"
    },
    ui: {
      btnSetLeft: ".region-left",
      btnSetCenter: ".region-center",
      btnSetRight: ".region-right"
    },
    constructor: function ButtonToolbarView(options) {
      options = options || {};
      if (options.className) {
        options.clazzName = options.className;
        delete options.className;
      }
      this.options = options;
      var colOptions = {
        model: ButtonModel,
        comparator: "order"
      };
      this.leftButtons = new Backbone.Collection([], colOptions);
      this.centerButtons = new Backbone.Collection([], colOptions);
      this.rightButtons = new Backbone.Collection([], colOptions);
      this.parseButtonConfigs(options);
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.currentlyFocusedElement = function(event) {
        var tabElements = this.$(TabablesBehavior.focusablesSelector).filter(":visible:not([disabled])").filter(":not(.svg-toolbar-buttons)");
        if (tabElements.length) {
          tabElements.prop("tabindex", 0);
        }
        if (!!event && event.shiftKey) {
          return tabElements[tabElements.length - 1];
        } else {
          return tabElements[0];
        }
      };
      this.listenTo(this.leftButtons, "change", this._onButtonCollectionModelChange).listenTo(this.centerButtons, "change", this._onButtonCollectionModelChange).listenTo(this.rightButtons, "change", this._onButtonCollectionModelChange);
    },
    parseButtonConfigs: function(options) {
      options = options || {};
      var lButtons = _.isArray(options.left) ? options.left : [], cButtons = _.isArray(options.center) ? options.center : [], rButtons = _.isArray(options.right) ? options.right : [];
      this.leftButtons.reset(lButtons);
      this.centerButtons.reset(cButtons);
      this.rightButtons.reset(rButtons);
    },
    onRender: function() {
      if (!this.leftButtonSetView || this.leftButtonSetView && this.leftButtonSetView.isDestroyed === true) {
        this.leftButtonSetView = new ButtonSetView({
          el: this.ui.btnSetLeft[0],
          collection: this.leftButtons
        });
        this.leftButtonSetView.render();
      }
      if (!this.centerButtonSetView || this.centerButtonSetView && this.centerButtonSetView.isDestroyed === true) {
        this.centerButtonSetView = new ButtonSetView({
          el: this.ui.btnSetCenter[0],
          collection: this.centerButtons
        });
        this.centerButtonSetView.render();
      }
      if (!this.rightButtonSetView || this.rightButtonSetView && this.rightButtonSetView.isDestroyed === true) {
        this.rightButtonSetView = new ButtonSetView({
          el: this.ui.btnSetRight[0],
          collection: this.rightButtons
        });
        this.rightButtonSetView.render();
      }
      this.rgnLeft.attachView(this.leftButtonSetView);
      this.rgnCenter.attachView(this.centerButtonSetView);
      this.rgnRight.attachView(this.rightButtonSetView);
    },
    getButtonById: function(id) {
      if (id) {
        return _.first(_.compact(_.invoke([ this.leftButtons, this.centerButtons, this.rightButtons ], "findWhere", {
          id: id
        })));
      }
      return null;
    },
    _onButtonCollectionModelChange: function() {
      this.triggerMethod("dom:refresh");
    }
  });
  _.extend(ButtonToolbarView.prototype, LayoutViewEventsPropagationMixin);
  return ButtonToolbarView;
});