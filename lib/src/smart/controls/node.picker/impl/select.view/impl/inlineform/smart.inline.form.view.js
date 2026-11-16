/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/marionette3", "nuc/lib/backbone", "hbs!smart/controls/node.picker/impl/select.view/impl/inlineform/smart.inline.form", "hbs!smart/controls/node.picker/impl/select.view/impl/inlineform/smart.grid.inline.form", "i18n!smart/controls/node.picker/impl/nls/lang" ], function(_, Marionette, Backbone, baseTemplate, gridTemplate, lang) {
  const SmartInlineForm = Marionette.View.extend({
    className: "smart-inline-editform",
    getTemplate: function() {
      return this.options?.masterView?.isGridView() ? gridTemplate : baseTemplate;
    },
    regions: {
      inlineFormRegion: {
        el: ".smart-inlineform-region",
        replaceElement: true
      }
    },
    ui: {
      input: ".smart-edit-input-name",
      cancelButton: ".smart-edit-cancel",
      saveButton: ".smart-edit-save",
      errorContainer: ".smart-inlineform-group-error",
      mlGlobeIcon: ".smart-multilingual-icon"
    },
    events: {
      "click @ui.saveButton": "saveClicked",
      "click @ui.cancelButton": "cancelClicked",
      "click @ui.mlGlobeIcon": "globeIconClicked",
      "input @ui.input": "onKeyInInput",
      keydown: "onKeyInView",
      keyup: "onKeyupInView"
    },
    templateContext: function() {
      return {
        errorMessage: this.model?.get("smartInlineFormErrorMessage"),
        saveEditTooltip: lang.saveEditTooltip,
        saveEditArialabel: _.str.sformat(lang.saveEditArialabel, this.model?.get("type_name")),
        editCancelTooltip: lang.editCancelTooltip,
        editCancelArialabel: _.str.sformat(lang.editCancelArialabel, this.model?.get("type_name")),
        isMlDataEnabled: this.options.isMlDataEnabled,
        multilingualTooltip: lang.multilingualTooltip,
        enterNamePlaceholder: lang.enterNamePlaceholder,
        addNamePlaceholder: lang.addNamePlaceholder
      };
    },
    constructor: function SmartInlineForm(options) {
      options || (options = {});
      Marionette.View.prototype.constructor.apply(this, arguments);
    },
    onRender: function() {
      if (this.options?.isMlDataEnabled) {
        this._loadMLPopover();
      }
      this._updateSaveBtnState();
      if (this.model.get("smartInlineFormErrorMessage")) {
        this.ui.errorContainer[0]?.querySelector(".smart-error-alert").setAttribute("title", this.model.get("smartInlineFormErrorMessage"));
        this.ui.errorContainer[0].querySelector(".smart-error-text").textContent = this.model.get("smartInlineFormErrorMessage");
        this.ui.errorContainer[0]?.classList.remove("binf-hidden");
        this.ui.input[0]?.classList.add("smart-inlineform-error");
      } else {
        this.ui.errorContainer[0]?.classList.add("binf-hidden");
      }
      this.ui.input[0]?.focus();
    },
    _loadMLPopover: function() {
      let inputElement = this.ui.input;
      inputElement.addClass("csui-multilingual-input");
      this.metadataLanguages = this.options.metadataLanguages;
      this.isMultilingualField = true;
      if (this.options.multiLingualPopoverMixin?.mixin) {
        this.options.multiLingualPopoverMixin.mixin(SmartInlineForm.prototype);
        const mlOptions = {
          parentView: this,
          targetElement: inputElement,
          mlGlobeIcon: this.ui.mlGlobeIcon,
          validationRequired: false,
          multilingualData: this.model.get("name_multilingual")
        };
        this._loadMultiLingualPopover(mlOptions);
        this.listenTo(this, "ml:value:updated", function(val) {
          this.onMultiLingualPopoverUpdated(val);
        });
      }
    },
    onMultiLingualPopoverUpdated: function(obj) {
      this.prevMultilingualVal = this.model.get("name_multilingual");
      this.model.set("name_multilingual", obj.value_multilingual, {
        silent: true
      });
      this.targetElement.val(obj.value);
      this.saveMldata = obj;
      this.model.set({
        validField: true,
        value: obj.value
      }, {
        silent: true
      });
      this._updateSaveBtnState();
    },
    _canSaveForm(e) {
      const target = e?.target || this.ui?.input[0];
      return target?.value?.trim()?.length > 0;
    },
    _updateSaveBtnState(e) {
      if (!this._canSaveForm(e)) {
        this._disableSave();
      } else {
        this._enableSave();
      }
    },
    saveClicked: function(e) {
      e.preventDefault();
      e.stopPropagation();
      const name = this.ui.input[0]?.value || "";
      this.model.set("name", name, {
        silent: true
      });
      if (this.model.get("smartInlineFormErrorMessage")) {
        this.model.unset("smartInlineFormErrorMessage", {
          silent: true
        });
      }
      this.options?.masterView?.trigger("save:form", this.model);
    },
    cancelClicked: function(e) {
      e.preventDefault();
      e.stopPropagation();
      this.trigger("cancel:edit:form");
      this.cancel();
    },
    globeIconClicked: function(e) {
      this._showLanguagePopover();
    },
    onKeyInView: function(e) {
      switch (e.keyCode) {
       case 13:
        if (this._canSaveForm() && document.activeElement === this.ui.input[0]) {
          this.saveClicked(e);
        }
        break;

       case 9:
        const focusables = this.el?.querySelectorAll("*[tabindex]:not([disabled])");
        if (e.target === focusables[0] && e.shiftKey) {
          focusables[focusables.length - 1]?.focus();
          e.preventDefault();
        } else if (e.target === focusables[focusables.length - 1] && !e.shiftKey) {
          focusables[0]?.focus();
          e.preventDefault();
        }
        break;
      }
    },
    onKeyupInView: function(e) {
      switch (e.keyCode) {
       case 27:
        if (document.activeElement.closest(".csui-has-inlineform")) {
          e.preventDefault();
          this.cancelClicked(e);
        }
        break;
      }
    },
    onKeyInInput: function(e) {
      this.ui.saveButton.attr("ariaLabel", _.str.sformat(lang.saveEditArialabel, this.model?.get("type_name"), this.ui.input.val()));
      this._updateSaveBtnState(e);
    },
    onDomRefresh: function() {
      this.ui.input[0]?.focus();
    },
    _enableSave: function() {
      this._isRendered && this.ui.saveButton[0]?.removeAttribute("disabled");
    },
    _disableSave: function() {
      this._isRendered && this.ui.saveButton[0]?.setAttribute("disabled", true);
    },
    cancel: function(options) {
      options || (options = {});
      this.destroy();
      if (this.model.get("id") === undefined) {
        this.model.destroy();
        this.model.trigger("destroy:form");
      } else {
        delete this.model.inlineFormView;
        this.model.set("smartInlineFormErrorMessage", "dummy", {
          silent: true
        });
        this.model.unset("smartInlineFormErrorMessage", {
          silent: options.silent
        });
      }
    }
  });
  return SmartInlineForm;
});