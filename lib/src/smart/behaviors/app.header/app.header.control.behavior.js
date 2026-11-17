/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "smart/utils/smart.base", "smart/themes/theming" ], function($, _, Marionette, SmartBase, theming) {
  "use strict";
  const isJato = () => theming.isJATOTheme();
  var AppHeaderControlBehavior = Marionette.Behavior.extend({
    constructor: function AppHeaderControlBehavior(options = {}, view = {}) {
      this.options = options;
      Marionette.Behavior.prototype.constructor.apply(this, arguments);
      this.view = view;
      this.view.options.otcEl.addEventListener("click", _.bind(this._clickHandler, this));
      this.view.options.otcEl.addEventListener("keydown", _.bind(this._keyDownHandler, this));
      if (this.view?.options?.aside) {
        $(window).on("resize", _.bind(this._adjustChildView, this));
      }
      this.view.listenToOnce(this.view, "before:destroy", function() {
        $(window).off("resize", this._adjustChildView);
      });
    },
    onShow: function() {
      this._dataChanged();
      this.view.listenTo(this.view, "data:synced data:synched", _.bind(this._dataChanged, this));
      this.view.listenTo(this.view, "update:progress:values", _.bind(this._progressChange, this));
    },
    _adjustChildView: function() {
      const LEADING_VIEWS_WIDTH = 400;
      const LEADING_VIEWS_TOP = this.view?.options?.parentView?.el?.offsetHeight ?? 64;
      let childTag = this.view.options.otcElChild;
      childTag.style.width = LEADING_VIEWS_WIDTH + "px";
      childTag.style.top = LEADING_VIEWS_TOP + "px";
      childTag.style.position = "absolute";
      let el = this.view.options.otcEl;
      let left = el.offsetLeft;
      let targetLeft = left;
      let isRTL = SmartBase.isRTL();
      if (!isRTL) {
        let width = el.offsetWidth;
        targetLeft = left - LEADING_VIEWS_WIDTH + width;
      }
      childTag.style.left = targetLeft + "px";
    },
    _clickHandler: function(event) {
      let performClickAction = this?.view?.performClickAction ?? true;
      if (performClickAction) {
        if (this.view.options.aside) {
          this._adjustChildView();
        }
        this._delegateHandling(event);
      } else {
        event.preventDefault();
      }
    },
    _keyDownHandler: function(event) {
      if (this.view.options.aside) {
        this._adjustChildView();
      }
      event?.keyCode !== 9 && this._delegateHandling(event);
    },
    _delegateHandling: function(event) {
      let e = $.Event(event.type);
      e.keyCode = event.keyCode;
      this.view.$el.trigger(e);
    },
    _dataChanged: function() {
      let otcData = this?.view?.otcData ?? {};
      let attrs = {};
      let controlType = this.view.options.type;
      if (controlType) {
        let schema = this.view.options?.SCHEMA_ASSOSIATIONS[controlType];
        let attributes = Object.keys(schema?.attributes || {});
        attributes.forEach(attribute => {
          if (this.view.options.aside && attribute === "className" && otcData[attribute]) {
            this.view.options.child.setAttribute("class", otcData[attribute]);
          } else if ((attribute === "icon" || attribute === "svg") && (isJato() && otcData["jatoIcon"])) {
            attrs["svg"] = otcData["jatoIcon"] ?? schema.attributes["jatoIcon"];
          } else if (attribute === "overflowValue") {
            attrs["value"] = otcData[attribute];
          } else {
            attrs[attribute] = otcData[attribute] ?? schema.attributes[attribute];
          }
        });
      }
      if (isJato()) {
        delete attrs.headeritem;
      }
      if (controlType === "logo" && isJato()) {
        delete attrs.dark;
      }
      if (controlType === "menu" && isJato()) {
        let jatoProfileParent = this?.view?.options?.otcEl?.closest(".smart-jato-profile-avatar-parent");
        jatoProfileParent?.setAttribute("slot", attrs.slot);
        if (attrs?.id?.length > 0) {
          jatoProfileParent?.setAttribute("id", attrs.id);
        }
        jatoProfileParent?.setAttribute("arialabel", attrs.arialabel);
        delete attrs.slot;
        delete attrs.id;
      }
      if (controlType === "badge" && isJato()) {
        let iconEl = this?.view?.options?.otcEl?.querySelector(".smart-bellIcon");
        iconEl && iconEl.setAttribute("svg", attrs["svg"]);
        iconEl && delete attrs.svg;
      }
      let parentView = this?.view?.options?.parentView;
      attrs["iconappearance"] = parentView?.brandingConfig?.attributes?.brandingSettingCodes?.iconThemes ?? "";
      Object.keys(attrs).forEach(_.bind(function(key) {
        this.view.options.otcEl.setAttribute(key, attrs[key]);
      }, this));
      this.view.render();
    },
    _progressChange: function(progressValues) {
      this.view.options?.otcEl?.setAttribute("from", progressValues?.from);
      this.view.options?.otcEl?.setAttribute("to", progressValues?.to);
    }
  });
  return AppHeaderControlBehavior;
});