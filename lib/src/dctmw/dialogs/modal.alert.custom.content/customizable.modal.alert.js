/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "csui/controls/form/pub.sub", "csui/dialogs/modal.alert/modal.alert", "dctmw/utils/utils", "hbs!dctmw/dialogs/modal.alert.custom.content/impl/customizable.modal.alert", "css!dctmw/dialogs/modal.alert.custom.content/impl/customizable.modal.alert" ], function(_, $, Marionette, PubSub, CSModalAlert, utils, template) {
  "use strict";
  var CustomizableModalAlert = CSModalAlert.extend({
    className: function() {
      var zuper = CustomizableModalAlert.__super__;
      var className = _.isString(zuper.className) ? zuper.className : _.isFunction(zuper.className) ? zuper.className.call(this, this.options) : "";
      className += " dctm-alert-custom-content";
      if (this.options && this.options.className) {
        className += " " + _.result(this.options, "className");
      }
      return className;
    },
    getTemplate: function() {
      return template;
    },
    constructor: function CustomizableModalAlert(options) {
      options = options || {};
      this.options = options;
      if (options.className) {
        options.className = this.className();
      }
      options.hasCustomContent = options.contentView instanceof Marionette.View;
      options.isMobile = utils.isMobile();
      CSModalAlert.prototype.constructor.apply(this, arguments);
      if (this.options.hasCustomContent) {
        this.regionManager = new Marionette.RegionManager();
        this.regionManager._parent = this;
        this.customContentRegion = this.regionManager.addRegion("customContentRegion", {
          selector: ".custom-content-container",
          parentEl: _.partial(_.result, this, "el")
        });
      }
      this.options.message = options.message ? options.message : "";
    },
    onRender: function() {
      if (this.options.hasCustomContent) {
        var view = this.options.contentView;
        this.customContentRegion.show(view, {
          render: !view._isRendered
        });
        view.on("render", () => {
          $(view.$el).on("keydown", event => {
            if (event.keyCode === 27 || event.keyCode === 9) {
              return;
            }
            event.stopPropagation();
          });
        });
      }
      if (!utils.isMobile()) {
        this._renderFooter();
      }
    },
    onShown: function() {
      this.options.hasCustomContent && this.options.contentView.triggerMethod && this.options.contentView.triggerMethod("dom:refresh");
      CSModalAlert.prototype.onShown.apply(this, arguments);
      PubSub.trigger("dctm:custom:modal:alert:show");
    },
    onBeforeDestroy: function() {
      if (this.options.hasCustomContent) {
        this.regionManager.destroy();
      }
    },
    onKeyDown: function(event) {
      if (event.keyCode === 9) {
        this.trigger("modalalert:after:shown", event.shiftKey);
        return this.setTabFocus(event);
      } else {
        return CustomizableModalAlert.__super__.onKeyDown.call(this, event);
      }
    },
    setTabFocus: function(event) {
      var tabElements = this.$("*[tabindex]"), len = tabElements.length;
      if (event) {
        var firstEl = tabElements[0], lastEl = tabElements[len - 1];
        var lastTabEl = event.shiftKey ? firstEl : lastEl;
        if (event.target === lastTabEl) {
          var elToFocus = event.shiftKey ? lastEl : firstEl;
          $(elToFocus).trigger("focus");
          return false;
        }
      } else {
        $(tabElements[0]).trigger("focus");
      }
    }
  }, {
    _show: function(options) {
      var alert = new CustomizableModalAlert(options);
      return alert.show();
    }
  });
  return CustomizableModalAlert;
});