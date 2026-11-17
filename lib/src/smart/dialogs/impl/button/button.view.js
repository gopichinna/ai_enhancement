/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/marionette", "nuc/lib/underscore", "nuc/lib/jquery", "smart/behaviors/keyboard.navigation/smart.tabable.region.behavior", "hbs!smart/dialogs/impl/button/button", "smart/themes/theming", "smart/utils/otwc.loader", "smart/themes/carbonfiber/ot-icons/icons_smart_action" ], (Marionette, _, $, TabableRegion, btnTemplate, theming) => {
  let ButtonView = Marionette.ItemView.extend({
    template: btnTemplate,
    templateHelpers: function() {
      let btnText = this.model.get("label") || "";
      return {
        btnText: btnText,
        isJATO: theming.isJATOTheme(),
        jatoIcon: this.model?.get("jatoIcon")
      };
    },
    tagName: "otc-button",
    className: function() {
      let _classNames = " " + (this.model?.get("classes") || this.model?.get("className") || "");
      _classNames += this.model?.get("default") ? " cs-add-button" : "";
      _classNames += this.model?.get("separate") ? " cs-separate" : "";
      return this._filterBINFBtnClassnames(_classNames);
    },
    attributes: function() {
      let variant = this.model?.get("variant") || "";
      variant = !!variant.length ? variant : this._getBtnType(this.model || "");
      let attrs = this.model?.attributes || {};
      let defAttrs = {
        variant: variant
      };
      if (attrs.id) {
        defAttrs.id = attrs.id;
      }
      if (attrs.disabled !== undefined) {
        defAttrs.disabled = attrs.disabled;
      }
      defAttrs.tabindex = 0;
      let attributes = {
        ...defAttrs,
        ...attrs
      };
      let updatedAttributes = {
        type: attributes.variant,
        tabindex: attributes.tabindex,
        arialabel: attributes.arialabel
      };
      if (attributes.id) {
        updatedAttributes.id = attributes.id;
      }
      if (!!attributes.disabled || attributes.disabled === "disabled") {
        updatedAttributes.disabled = "disabled";
      }
      if (attrs.toolTip) {
        updatedAttributes.title = attrs.toolTip;
      }
      if (attrs.icon || attrs.jatoIcon) {
        if (!theming.isJATOTheme()) {
          updatedAttributes.icon = attrs.icon;
        }
        delete updatedAttributes.type;
      }
      if (attrs.attributes?.title) {
        updatedAttributes.title = attrs.attributes?.title;
      }
      if (attrs.attributes && attrs.attributes["aria-label"]) {
        updatedAttributes.arialabel = attrs.attributes["aria-label"];
      }
      return updatedAttributes;
    },
    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegion
      }
    },
    triggers: {
      click: "click"
    },
    constructor: function ButtonView(options = {}) {
      this.behaviors = this.behaviors || {};
      if (!options.footerTabableRegionBehavior) {
        options.footerTabableRegionBehavior = {
          behaviorClass: TabableRegion
        };
      }
      this.behaviors = _.extend(this.behaviors, {
        TabableRegion: options.footerTabableRegionBehavior
      });
      this.options = options;
      Marionette.View.prototype.constructor.apply(this, arguments);
      this.listenTo(this, "dom:refresh", _.bind(this.onDomRefresh, this));
      this.listenTo(this.model, "change", function() {
        this.render();
      });
    },
    isTabable: function() {
      return this.$el.is(":not(:disabled)");
    },
    onRender: function() {
      let attributes = this.model?.attributes || {};
      this.updateButton(attributes);
    },
    updateButton: function(attributes = {}) {
      var _btn = this.el;
      if (attributes.hidden !== undefined) {
        if (attributes.hidden) {
          _btn.classList.add("binf-hidden");
        } else {
          _btn.classList.remove("binf-hidden");
        }
      }
      if (attributes.disabled !== undefined) {
        _btn.setAttribute("disabled", attributes.disabled);
      }
      if (attributes.disabled === false || attributes.disabled === "") {
        _btn.removeAttribute("disabled");
      }
      this.trigger("dom:refresh");
    },
    currentlyFocusedElement: function() {
      this.el && (this.el.attributes.tabindex = 0);
      return this.el;
    },
    onDomRefresh: function() {
      if (this.isTabable()) {
        this.currentlyFocusedElement();
      }
      if (!this._isActiveRegion()) {
        this.trigger("tabable:not");
      }
    },
    _isActiveRegion: function() {
      if (!this.isRendered || this.el?.classList?.contains("binf-hidden") || this.el?.disabled) {
        return false;
      }
      return true;
    },
    _filterBINFBtnClassnames: (btnClassNames = "") => {
      var classNames = btnClassNames.split(" ").filter(function(cl) {
        return cl.trim().length && cl.indexOf("binf-btn") === -1;
      });
      classNames = classNames.join(" ");
      return classNames;
    },
    _getBtnType: (model = {}) => {
      let classNames = model?.get("classes") || model?.get("className") || "";
      let type = "secondary", expectingBtnTypes = [ "primary", "secondary" ];
      expectingBtnTypes.forEach(expType => {
        classNames.split(" ").indexOf("binf-btn-" + expType) !== -1 && (type = expType);
      });
      !!model.get("default") && (type = "primary");
      return type === "default" ? "secondary" : type;
    }
  }, {
    BTN_TYPE_BACK: "back",
    BTN_TYPE_NEXT: "next",
    BTN_TYPE_CANCEL: "cancel",
    BTN_TYPE_ACTION: "action"
  });
  return ButtonView;
});