/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/lib/marionette", "csui/utils/base", "csui/perspective.manage/settings.panel/settings/settings", "csui/controls/form/form.view", "csui/dialogs/modal.alert/modal.alert", "i18n!csui/perspective.manage/impl/nls/lang", "hbs!csui/perspective.manage/settings.panel/impl/settings.panel", "hbs!csui/perspective.manage/settings.panel/impl/setting", "csui/perspective.manage/mixins/update.supportasset.branding.config.mixin", "csui/utils/commonconfig.util", "css!csui/perspective.manage/settings.panel/impl/settings.panel" ], function(_, $, Backbone, Marionette, base, allSettings, FormView, ModalAlert, lang, template, settingTemplate, UpdateSupportAssetBrandingConfigMixin, CommonConfigUtil) {
  var SettingView = Marionette.LayoutView.extend({
    template: settingTemplate,
    className: "pman-header-setting-container",
    ui: {
      accordionHeader: ".csui-accordion-header",
      accordionContent: ".csui-accordion-content",
      accordionHeaderIcon: ".csui-accordion-header .cs-icon"
    },
    regions: {
      contentRegion: "@ui.accordionContent"
    },
    events: {
      "click @ui.accordionHeader": "toggle",
      "keydown @ui.accordionHeader": "toggle"
    },
    templateHelpers: function() {
      return {
        settingTitle: this.model.get("title"),
        expandTab: lang.expand,
        collapseTab: lang.collapse
      };
    },
    initialize: function() {
      this.defaultbrandingSettingCodes = [];
      const data = this.model.getData(this.options.previewBranding.toJSON());
      if (this.model.hasOwnView()) {
        var options = _.defaults({
          context: this.options.context
        }, data);
        this.settingsView = new (this.model.get("view"))(options);
        this.settingsView.on("change", this._onChange, this);
      } else {
        var formModel = new Backbone.Model({
          schema: this.model.get("schema"),
          options: this.model.get("options"),
          data: data
        });
        this.formView = new FormView({
          mode: "create",
          model: formModel,
          context: this.options.context
        });
        this.formView.on("change:field", this._onChange, this);
      }
    },
    _onChange: function() {
      this.triggerMethod("change:setting", this.getSettingChange());
    },
    resetToDefault: function() {
      var self = this, deferred = $.Deferred();
      if (this.model.hasOwnView() && _.isFunction(this.settingsView.resetToDefault)) {
        this.settingsView.resetToDefault().then(deferred.resolve, deferred.reject);
      } else if (this.formView) {
        var defaultConfig = this.model.getDefaultConfig();
        this.formView.on("render:form", function() {
          deferred.resolve(self.getSettingChange());
        });
        this.formView.model.set("data", defaultConfig);
        this.formView.updateForm();
      } else {
        deferred.resolve({});
      }
      return deferred.promise();
    },
    onRender: function() {
      if (this.model.hasOwnView()) {
        this.contentRegion.show(this.settingsView);
      } else if (this.model.has("schema")) {
        this.contentRegion.show(this.formView);
      }
    },
    getSettingChange: function() {
      settingData = {}, settingChange = {};
      if (this.model.hasOwnView()) {
        settingData = this.settingsView.getValue();
      } else {
        settingData = this.formView.getValues();
      }
      settingChange = this.model.getConfigFromFormData(settingData);
      return settingChange;
    },
    toggle: function(event) {
      if (event.type === "click" || (event.keyCode === 13 || event.keyCode === 32)) {
        var isClosed = this.ui.accordionHeader.hasClass("csui-accordion-expand");
        this.ui.accordionHeader.toggleClass("csui-accordion-expand");
        var actionClass = !isClosed ? "addClass" : "removeClass";
        if (!isClosed) {
          this.ui.accordionContent.removeClass("binf-hidden");
          this.ui.accordionHeader[0].setAttribute("aria-label", `${lang.collapseTab} ${this.model.get("title")}`);
        } else {
          base.onTransitionEnd(this.ui.accordionContent, function() {
            if (!this.ui.accordionHeader.hasClass("csui-accordion-expand")) {
              this.ui.accordionContent.addClass("binf-hidden");
              this.ui.accordionHeader[0].setAttribute("aria-label", `${lang.expandTab} ${this.model.get("title")}`);
            }
          }, this);
        }
        setTimeout(_.bind(function() {
          this.$el[actionClass]("csui-accordion-visible");
          this.ui.accordionHeader[actionClass]("csui-accordion-expand");
          this.ui.accordionHeader[0].setAttribute("aria-label", `${lang.collapseTab} ${this.model.get("title")}`);
        }, this));
      } else if (event.type === "keydown" && event.keyCode === 9 && event.shiftKey && $(event.currentTarget).parent().index() === 0) {
        let self = this;
        setTimeout(function() {
          self.options.pmanBrandingView.$el.find("button.pman-cancel-edit").focus();
        }, 0);
      }
    }
  });
  var HeaderSettingsPanel = Marionette.CompositeView.extend({
    className: "pman-header-settings-panel csui-pman-panel csui-normal-scrolling csui-no-scroll-x",
    childView: SettingView,
    childViewContainer: ".csui-header-settings-list",
    childViewOptions: function() {
      return {
        context: this.options.context,
        previewBranding: this.options.previewBranding,
        pmanBrandingView: this.pmanBrandingView
      };
    },
    templateHelpers: function() {
      return {
        resetLabel: lang.resetToOriginalSettingLabel,
        resetTitle: lang.resetToOriginalSettingLabel
      };
    },
    template: template,
    childEvents: {
      "change:setting": "onChangeSetting"
    },
    events: {
      "click .csui-header-config-reset-btn": "onResetToDefault"
    },
    constructor: function HeaderSettingsPanel(options) {
      options.collection = allSettings;
      this.pmanBrandingView = options?.pmanBrandingView;
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
    },
    onChangeSetting: function(child, headerSettings) {
      this.trigger("change:settings", headerSettings, child.model.get("widgetId"));
    },
    onResetToDefault: function() {
      var self = this;
      ModalAlert.showWarning(function(confirmed) {
        confirmed && self.resetToDefaultSettings();
      }, lang.resetToDefaultAlertMessage, lang.resetToOriginalSettingLabel, {
        buttons: {
          showYes: true,
          labelYes: lang.resetLabel,
          showNo: false,
          showCancel: true
        }
      });
    },
    resetToDefaultSettings: function() {
      let defaultStyles = this.DEFAULT_BRAND_SETTINGS;
      if (!this?.options?.context?.brandingConfigData?.get("brandingSettingCodes")?.themes) {
        defaultStyles = {};
        Object.keys(this.options.context.previewBranding?.get("brandingSettingCodes")).forEach(item => {
          defaultStyles[item] = "";
        });
      }
      document.querySelector(".binf-widgets.perspective-editing .cs-perspective-panel")?.removeAttribute("style");
      this.options.context.previewBranding.set("brandLogoUri", "");
      this.options.context.previewBranding.set("brandLogoUri_id", "");
      this.options.context.previewBranding.set("brandingSettingCodes", defaultStyles);
      this.options.context.previewBranding.set("fileDetails", "");
      this.options.context.trigger("change:settings");
      this.options.context?.navigationHeaderView?.brandingConfigData?.set({
        brandingCSS: ""
      });
      this.removePreviewBrandingStyleSheet();
      this.options.context?.navigationHeaderView?.brandingConfigData?.trigger("change:branding");
      this.trigger("change:settings");
      this.children.map(function(c) {
        return c.resetToDefault();
      });
    }
  });
  UpdateSupportAssetBrandingConfigMixin.mixin(HeaderSettingsPanel.prototype);
  return HeaderSettingsPanel;
});