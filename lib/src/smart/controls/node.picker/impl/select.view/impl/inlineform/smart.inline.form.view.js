/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/marionette3", "nuc/lib/backbone", "hbs!smart/controls/node.picker/impl/select.view/impl/inlineform/smart.inline.form", "hbs!smart/controls/node.picker/impl/select.view/impl/inlineform/smart.grid.inline.form", "smart/themes/theming", "smart/themes/jato.icons/smart.jato.action.icons", "i18n!smart/controls/node.picker/impl/nls/lang" ], function(_, Marionette, Backbone, baseTemplate, gridTemplate, theming, jatoActionIcons, lang) {
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
      inputContainer: ".smart-input-edit-container",
      input: ".smart-edit-input-name",
      smartInputEditTextBox: ".smart-input-edit-text-box",
      mlGlobeIcon: ".ot-input__action-icon"
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
        addNamePlaceholder: lang.addNamePlaceholder,
        gridFolderNameLabel: _.str.sformat(lang.gridFolderNameLabel, this.model?.get("type_name")),
        isJATOTheme: theming.isJATOTheme(),
        jatoActionGlobeicon: jatoActionIcons.actionLanguage,
        name_input_id: _.uniqueId("nameInp")
      };
    },
    constructor: function SmartInlineForm(options) {
      options || (options = {});
      Marionette.View.prototype.constructor.apply(this, arguments);
    },
    showErrorMessage: function() {
      let errorMessage = this.model.get("smartInlineFormErrorMessage");
      if (errorMessage) {
        this.ui.smartInputEditTextBox[0].setCustomValidity(errorMessage);
      } else {
        this.ui.smartInputEditTextBox[0].setCustomValidity("");
      }
      this.ui.smartInputEditTextBox[0].value = this.model.get("name");
      this.ui.smartInputEditTextBox[0].reportValidity();
    },
    onRender: function() {
      if (this.options?.isMlDataEnabled) {
        this._loadMLPopover();
      }
      const boundSaveClicked = this.saveClicked.bind(this), boundCancelClicked = this.cancelClicked.bind(this), boundMLIconClicked = this.globeIconClicked.bind(this);
      if (this.el) {
        this.el.removeEventListener("saved", boundSaveClicked);
        this.el.addEventListener("saved", boundSaveClicked);
        this.el.removeEventListener("cancelled", boundCancelClicked);
        this.el.addEventListener("cancelled", boundCancelClicked);
        this.el.removeEventListener("action-icon-clicked", boundMLIconClicked);
        this.el.addEventListener("action-icon-clicked", boundMLIconClicked);
      }
      this.showErrorMessage();
      this.ui.input[0]?.focus();
    },
    _loadMLPopover: function() {
      let inputElement = this.ui.smartInputEditTextBox;
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
    },
    saveClicked: function(e) {
      e.preventDefault();
      e.stopPropagation();
      const name = this.ui.input[0]?.value ?? e.detail.value;
      this.ui.inputContainer[0].value = name;
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
      this.options.masterView._dialog.canBeClosed = false;
      this.trigger("cancel:edit:form");
      this.cancel();
    },
    globeIconClicked: function(e) {
      this._showLanguagePopover();
    },
    onDomRefresh: function() {
      this.showErrorMessage();
      this.$el.find("otc-input")[0]?.focus();
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