/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "smart/behaviors/keyboard.navigation/smart.tabable.region.behavior", "hbs!smart/controls/side.panel/impl/header", "smart/themes/theming", "i18n!smart/controls/side.panel/impl/nls/lang", "smart/themes/jato.icons/smart.jato.action.icons", "css!smart/controls/side.panel/impl/side.panel", "smart/utils/otwc.loader", "smart/themes/carbonfiber/ot-icons/icons_smart_action" ], function(_, $, Marionette, TabableRegion, template, theming, lang, jatoIcons) {
  var SidePanelHeaderView = Marionette.ItemView.extend({
    template: template,
    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegion
      }
    },
    isTabable: function() {
      return this.$("*[tabindex]").length > 0;
    },
    currentlyFocusedElement: function(event) {
      var parent = this._parent._parent;
      if (parent._parent.options.layout.resize && parent._parent.ui.resizer.is(document.activeElement)) {
        return parent._parent.ui.resizer;
      }
      return this.$("*[tabindex]")[0];
    },
    onLastTabElement: function(shiftTab, event) {
      return shiftTab && event.target === this.$("*[tabindex]")[0];
    },
    className: "cs-header-control",
    ui: {
      title: ".csui-sidepanel-title .csui-sidepanel-heading",
      subTitle: ".csui-sidepanel-title .csui-sidepanel-subheading",
      closeBtn: ".csui-sidepanel-close"
    },
    triggers: {
      "click @ui.closeBtn": "close:click"
    },
    templateHelpers: function() {
      return {
        closeTooltip: lang.closeBtnTooltip,
        closeAria: lang.closeBtnTooltip,
        isJATO: theming.isJATOTheme(),
        closeIconSVGContent: jatoIcons.actionCloseSmall
      };
    },
    constructor: function SidePanelHeaderView(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.listenTo(this, "update:header", this.update);
    },
    update: function(slide) {
      this.ui.title.text(slide.title);
      this.ui.closeBtn.attr("arialabel", _.str.sformat(lang.closeBtnAria, slide.title));
      if (!!slide.subTitle) {
        this.ui.title.removeClass("csui-no-subheading");
        this.ui.subTitle.removeClass("binf-hidden");
        this.ui.subTitle.text(slide.subTitle);
      } else {
        this.ui.subTitle.addClass("binf-hidden");
        this.ui.title.addClass("csui-no-subheading");
      }
    }
  });
  return SidePanelHeaderView;
});