/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/marionette", "csui/lib/handlebars", "csui/pages/start/start.page.view", "i18n!csui/perspective.manage/settings.panel/settings/icons.setting/impl/nls/lang", "hbs!csui/perspective.manage/settings.panel/settings/icons.setting/impl/icons.setting.view", "css!csui/perspective.manage/settings.panel/settings/icons.setting/impl/icons.setting.view" ], function(_, $, Marionette, Handlebars, StartPageView, lang, template) {
  "use strict";
  const THEMECODE = {
    DEFAULT: "default",
    DARK: "dark",
    LIGHT: "light"
  };
  var IconsSettingView = Marionette.ItemView.extend({
    className: "icon-settings-view",
    template: template,
    constructor: function IconsSettingView(options) {
      options = _.defaults(options, {
        theme: ""
      });
      this.options = options;
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    ui: {
      icons: ".icon-them-container"
    },
    events: {
      "change input": "onChangeTheme",
      "click @ui.icons": "onClickContainer",
      "keydown @ui.icons": "onClickContainer"
    },
    templateHelpers: function() {
      return {
        defaultLabel: lang.defaultLabel,
        darkLabel: lang.darkLabel,
        lightLabel: lang.lightLabel,
        themeCode: THEMECODE
      };
    },
    onShow: function() {
      let activeTheme = Object.keys(this.options?.linkColor).length ? this.options?.linkColor : this.options?.brandingSettingCodes?.iconThemes;
      this.setTheme(activeTheme);
    },
    onClickContainer: function(event) {
      if (event.type === "click" || event.keyCode === 13 || event.keyCode === 32) {
        this.setTheme($(event.currentTarget).attr("data-theme"), true);
      }
    },
    getValue: function() {
      return {
        theme: this.$el.find("input:checked").val()
      };
    },
    setTheme: function(theme, triggerEvent) {
      theme = theme || THEMECODE.DEFAULT;
      this.ui.icons.removeClass("binf-active");
      this.ui.icons.find("input").prop("checked", false);
      var active = this.ui.icons.filter("[data-theme='" + theme + "']");
      active.addClass("binf-active");
      active.find("input").prop("checked", true);
      triggerEvent && this.trigger("change", {
        theme: theme
      });
    },
    resetToDefault: function() {
      this.setTheme("", true);
      return $.Deferred().resolve(this.getValue());
    }
  });
  Handlebars.registerHelper("toLowerCase", function(str) {
    return str.toLowerCase();
  });
  return IconsSettingView;
});