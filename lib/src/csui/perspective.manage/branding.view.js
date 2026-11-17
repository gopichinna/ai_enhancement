/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/utils/base", "csui/perspective.manage/pman.view.branding", "hbs!csui/perspective.manage/impl/branding", "i18n!csui/perspective.manage/impl/nls/lang" ], function(base, PmanBrandingView, template, lang) {
  let BrandingView = PmanBrandingView.extend({
    template: template,
    onClickSave: function() {
      this.applyHeaderChanges().done(() => {
        this.removePreviewBrandingStyleSheet();
        this._showMessage("success", lang.LblBrandingChanges);
        this._doCleanup();
      }).fail(error => {
        const err = new base.Error(error);
        this._showMessage("error", err.message);
        this.el.querySelector(".pman-icon-save").setAttribute("disabled", true);
        this.unblockActions();
      });
    },
    onClickClose: function() {
      this.options?.container[0]?.querySelector(".cs-perspective-panel").removeAttribute("style");
      this.removePreviewBrandingStyleSheet();
      this._doCleanup();
    },
    _triggerEditMode: function() {
      this.context.triggerMethod("enter:edit:perspective");
    },
    onRender: function() {
      const self = this;
      this.options.mode = "editNavigationHeader";
      document.body.classList.add("csui-pman-header-config", "perspective-editing");
      this._showHeader();
      this.listenTo(this.settingsRegion?.currentView, "change:settings", function() {
        self.el.querySelector(".pman-icon-save").removeAttribute("disabled");
      });
    },
    onShow: function() {
      this._setFocusOnFirstWidgetHeader();
    },
    onKeyDown: function(event) {
      let resetButton = event.target.classList?.contains("csui-header-config-reset-btn");
      if (!event.shiftKey && event.keyCode === 9 && resetButton) {
        this._setFocusOnFirstElementHeader(event);
      }
      if (!event.shiftKey && event.target.classList.contains("pman-cancel-edit") && event.keyCode === 9) {
        this._setFocusOnFirstWidgetHeader();
        return false;
      }
    },
    _prepareForEdit: function() {},
    _registerEventHandler: function() {},
    _onPmanRender: function() {},
    _getExistsWidgetTypes: function() {},
    _initializeWidgets: function() {},
    _savePerspective: function() {}
  });
  return BrandingView;
});