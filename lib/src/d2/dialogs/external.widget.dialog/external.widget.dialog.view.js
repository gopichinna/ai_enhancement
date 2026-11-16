/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/side.panel/side.panel.view", "nuc/utils/base", "dctmw/utils/authenticators/session", "d2/dialogs/external.widget.dialog/external.widget.view" ], function(_, $, Backbone, Marionette, SidePanelView, base, session, ExternalWidgetView) {
  "use strict";
  var HIGHLIGHT_CLASS_NAME = "csui-doc-preview-state";
  var ExternalWidgetDialogView = SidePanelView.extend({
    className: function() {
      var zuper = ExternalWidgetDialogView.__super__, className = "d2-doc-externalWidget";
      var clazz = _.isString(zuper.className) ? zuper.className : _.isFunction(zuper.className) ? zuper.className.call(this, this.options) : "";
      className += " " + clazz;
      if (this.options && this.options.className) {
        className += " " + _.result(this.options, "className");
      }
      return className;
    },
    constructor: function ExternalWidgetDialogView(options) {
      options = options || {};
      this.context = options.context;
      this.externalWidgetView = new ExternalWidgetView(options);
      this.externalWidgetView.layoutState = {};
      _.extend(options, {
        openFrom: "right",
        layout: {
          header: false,
          footer: false,
          mask: false,
          resize: true
        },
        thresholdWidth: 90,
        content: this.externalWidgetView,
        contentView: this.externalWidgetView
      });
      SidePanelView.prototype.constructor.call(this, options);
      this.isPreviewShowing = false;
      this.panelShrinkWidth = 0;
      this.listenTo(this, "before:show", function() {
        this.previousFocus = $(document.activeElement);
      }.bind(this)).listenTo(this, "after:show", function() {
        this.isPreviewShowing = true;
        $("body").removeClass("csui-sidepanel-open");
        this.externalWidgetView.trigger("after:show");
      }.bind(this)).listenTo(this, "before:hide", function() {
        this.isPreviewShowing = false;
        this.previousFocus && this.previousFocus.trigger("focus");
        this._removePreviewHighlight();
      }.bind(this)).listenTo(this.externalWidgetView, "external:widget:close", function(e) {
        e && e.preventDefault();
        this.destroy();
      }.bind(this)).listenTo(this, "before:destroy", this._onBeforeDestroy).listenTo(this.context, "change:perspective", this.hide).listenTo(this.context, "d2:objects:deleted", function() {
        this.hide();
      }.bind(this)).listenTo(session.get(), "end", function() {
        this.hide();
      });
      this._getStepperWizardEventChannel().vent.on("wizard:shown", this.hide, this);
    },
    _removePreviewHighlight: function() {
      $("." + HIGHLIGHT_CLASS_NAME).removeClass(HIGHLIGHT_CLASS_NAME);
    },
    _getStepperWizardEventChannel: function() {
      return Backbone.Wreqr.radio.channel("stepper_wizard");
    },
    _onBeforeDestroy: function() {
      this.miniviewer && this.miniviewer.destroy();
      this._getStepperWizardEventChannel().vent.off(null, null, this);
    },
    doDestroy: function(callback) {
      base.onTransitionEnd(this.$el, function() {
        _.isFunction(callback) && callback.call(this);
      }, this);
      this.$el.removeClass("csui-sidepanel-visible");
    },
    destroy: function() {
      this.hide(function() {
        Marionette.LayoutView.prototype.destroy.call(this);
      }.bind(this));
    }
  }, {});
  return ExternalWidgetDialogView;
});