/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette3", "smart/themes/theming", "i18n!smart/controls/app.header/impl/nls/lang", "smart/themes/carbonfiber/ot-icons/icons_smart_action_header", "css!smart/controls/app.header/panel/impl/smart.panel", "smart/controls/icons.v2/icons.v2" ], function($, _, Marionette, theming, lang) {
  "use strict";
  let SmartPanelView = Marionette.View.extend({
    template: false,
    performClickAction: false,
    events: {
      keydown: "onKeyInView"
    },
    constructor: function SmartPanelView(options = {}) {
      Marionette.View.call(this, options);
    },
    onRender: function() {
      this.canOpen = false;
      $(this?.options?.otcEl).unbind("click").bind("click", _.bind(this._toggleLeftSidePanel, this));
    },
    _toggleLeftSidePanel: function() {
      this.otcData = this.options?.originatingView?.logoView?.otcData ?? {};
      this.options.otcData = this.otcData;
      if (this.sidePanelView) {
        this.sidePanelView.trigger("destroy");
      } else {
        require([ "smart/controls/side.panel/side.panel.view", "smart/controls/app.header/panel/groups/groups.view" ], _.bind(function(SidePanelView, GroupsView) {
          this.options.panelView = this;
          const groupsView = new GroupsView(this.options);
          var HamburgerMenuPanel = SidePanelView.extend({
            onSetFocus: function() {
              return false;
            }
          });
          this.sidePanelView = new HamburgerMenuPanel({
            openFrom: "left",
            sidePanelClassName: "smart-app-header-left-menu-panel",
            layout: {
              header: false,
              footer: false,
              mask: false,
              resize: false
            },
            content: groupsView,
            keyboard: true,
            title: lang.navigationAria
          });
          this.sidePanelView.show();
          this.listenTo(this.sidePanelView, "after:show", _.bind(function() {
            if (!theming.isJATOTheme()) {
              let bgColor = this.options.originatingView?.brandingConfig?.attributes?.brandingSettingCodes?.customBrandingBgColor ?? "";
              if (bgColor.length > 1) {
                let rgbColor = this.sidePanelView.el.querySelector(".smart-groups-wrapper")?.style?.backgroundColor ?? "";
                if (rgbColor.length) {
                  let rgbArray = rgbColor.replace("rgb(", "").replace(")", "").replaceAll(" ", "").split(",");
                  this.isBrightness = .2126 * rgbArray[0] + .7152 * rgbArray[1] + .0722 * rgbArray[2] >= 128;
                  this.isBrightness && this.sidePanelView.el.classList.add("smart-apply-invert-color-for-brightness");
                }
                this.sidePanelView.el.classList.add("smart-apply-invert-color");
              } else {
                this.sidePanelView.el.classList.remove("smart-apply-invert-color");
                this.sidePanelView.el.classList.remove("smart-apply-invert-color-for-brightness");
              }
            }
          }, this));
          this.listenTo(this.sidePanelView, "destroy", _.bind(function() {
            $(document).off("click." + this.cid);
            this.stopListening(this.sidePanelView, "destroy");
            this.sidePanelView.el = "";
            this.sidePanelView = undefined;
          }, this));
          $(document).off("click." + this.cid).on("click." + this.cid, _.bind(function(e) {
            const isClickedOutsideOfPanel = this.sidePanelView.$el.find(e.target).length === 0;
            if (isClickedOutsideOfPanel) {
              this.sidePanelView.trigger("destroy");
            }
          }, this));
          this.listenToOnce(this.options.originatingView, "close:burger:menu", _.bind(function() {
            this.sidePanelView?.trigger("destroy");
          }, this));
          this.listenTo(groupsView, "close:panel", function(event) {
            this.sidePanelView.trigger("destroy");
            if (groupsView?.isKeyEvent || groupsView?.panelHeaderView?.isKeyEvent) {
              $(this.options.otcEl).trigger("focus");
            }
          });
        }, this));
      }
    },
    onKeyInView: function(event) {
      var keyCode = event.keyCode;
      var retVal = true;
      switch (keyCode) {
       case 13:
       case 32:
        event.preventDefault();
        event.stopPropagation();
        retVal = false;
        break;

       default:
        return true;
      }
      return retVal;
    }
  });
  return SmartPanelView;
});