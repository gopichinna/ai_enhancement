/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "csui/models/form", "d2/widgets/metadata/utils/form.converter", "d2/controls/form/d2.form.view", "d2/controls/behaviors/wizard.tabable.region.behavior", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "d2/dialogs/viewer/publish/impl/publish.fields.constant", "i18n!d2/dialogs/viewer/publish/impl/nls/lang", "hbs!d2/dialogs/viewer/publish/impl/viewer.publish", "css!d2/dialogs/viewer/publish/impl/viewer.publish" ], function($, _, Marionette, FormModel, MetadataConverter, D2FormView, WizardTabableRegionBehavior, PerfectScrollingBehavior, PublishFieldsConstant, lang, formTemplate) {
  "use strict";
  return D2FormView.extend({
    behaviors: {
      TabableRegion: {
        behaviorClass: WizardTabableRegionBehavior
      },
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        suppressScrollX: true,
        scrollYMarginOffset: 15
      }
    },
    formTemplate: formTemplate,
    constructor: function PublishDialogView(options) {
      this.options = options || {};
      this.formRendered = false;
      this.isValidForm = false;
      var dialogJson = this._createDialogJson();
      this.formModel = MetadataConverter.convertConfig(dialogJson, {
        actionMode: "create",
        layoutMode: "singleCol",
        extendFieldOptions: this._extendFieldOptions.bind(this)
      });
      options.model = new FormModel(this.formModel.propertiesConfig[0]);
      options.model.attributes.data.option["folder-id"] = options.defaultLocationForNewFile;
      options.topAlignedLabel = true;
      options.mode = "create";
      D2FormView.prototype.constructor.call(this, options);
      this.listenTo(this, "change:field", this.updateForm.bind(this));
      this.listenTo(this, "valid:field", this.validateAndUpdateFooterButton.bind(this));
      this.listenTo(this, "invalid:field", this.validateAndUpdateFooterButton.bind(this));
    },
    _extendFieldOptions: function(field, alpControl) {
      if (field && alpControl) {
        var fieldId = field.id;
        if (fieldId === "folder-id") {
          _.extend(alpControl["options"]["fields"][fieldId], {
            subTypeFilters: [ "dm_folder" ],
            container: this.options.container
          });
        }
      }
    },
    updateForm: function(event) {
      var target = event.fieldView && event.fieldView.$el.find('input[type="checkbox"]:checked')[0];
      if (target && $(target).is(":checked")) {
        this._uncheckOtherCheckboxes(target);
      }
      this.isValidForm = this.options.wizard && this.validateForm();
      this.updateButtonLabel();
    },
    _uncheckOtherCheckboxes: function(target) {
      _.each(this.form.view.field.children[0].children, function(children) {
        var el = children.fieldView.$el;
        el.find('input[type="checkbox"]:checked').each(function() {
          if ($(this).is(":checked")) {
            this !== target && $(this).trigger("click", true);
          }
        });
      });
    },
    isValid: function() {
      return this.isValidForm;
    },
    validateForm: function() {
      var values = this.getValues();
      var isValid = false;
      if (values.option[PublishFieldsConstant.publishOptions.NEW_FILE]?.length > 0) {
        isValid = values.option[PublishFieldsConstant.publishFields.FOLDER] && values.option[PublishFieldsConstant.publishFields.FILE_NAME];
      } else if (values.option[PublishFieldsConstant.publishOptions.RENDITION]?.length > 0 || values.option[PublishFieldsConstant.publishOptions.VERSION]?.length > 0 || values.option[PublishFieldsConstant.publishOptions.DOWNLOAD]?.length > 0) {
        isValid = true;
      }
      return isValid;
    },
    validateAndUpdateFooterButton: function() {
      this.isValidForm = this.validateForm();
      this.trigger("valid:form", this.isValidForm);
    },
    updateButtonLabel: function() {
      var formValues = this.getValues();
      var newButtonLabel = lang.buttonLabelNewFile;
      if (formValues.option[PublishFieldsConstant.publishOptions.NEW_FILE]?.length > 0) {
        newButtonLabel = lang.LabelNewFile;
      } else if (formValues.option[PublishFieldsConstant.publishOptions.VERSION]?.length > 0) {
        newButtonLabel = lang.buttonLabelVersion;
      } else if (formValues.option[PublishFieldsConstant.publishOptions.RENDITION]?.length > 0) {
        newButtonLabel = lang.buttonLabelRendition;
      } else if (formValues.option[PublishFieldsConstant.publishOptions.DOWNLOAD]?.length > 0) {
        newButtonLabel = lang.buttonLabelDownload;
      }
      this.trigger("change:buttonLabel", newButtonLabel);
    },
    className: function() {
      var parentClassName = D2FormView.prototype.className || "";
      if (_.isFunction(parentClassName)) {
        parentClassName = parentClassName.apply(this, arguments);
      }
      return parentClassName + " d2-publish-dialog-body";
    },
    _createDialogJson: function() {
      const hiddenOptions = this.options.hideOption || [];
      let order = 3;
      const fieldset = {
        id: "option",
        label: "Options",
        order: 1,
        "list-checkbox": []
      };
      const isOptionVisible = key => !hiddenOptions.includes(key);
      const includeNewFile = isOptionVisible(PublishFieldsConstant.publishOptions.NEW_FILE);
      if (includeNewFile) {
        fieldset["list-checkbox"].push(this._createCheckboxOption(order++, PublishFieldsConstant.publishOptions.NEW_FILE, lang.LabelNewFile, true));
        fieldset["node-picker"] = [ this._createNodePickerOption(order++, PublishFieldsConstant.publishFields.FOLDER, lang.LabelSaveLocation) ];
        fieldset["text"] = [ this._createTextOption(order++, PublishFieldsConstant.publishFields.FILE_NAME, lang.LabelFileName) ];
      }
      const optionalCheckboxes = [ {
        key: PublishFieldsConstant.publishOptions.VERSION,
        label: lang.LabelVersion
      }, {
        key: PublishFieldsConstant.publishOptions.RENDITION,
        label: lang.LabelRendition
      }, {
        key: PublishFieldsConstant.publishOptions.DOWNLOAD,
        label: lang.LabelDownload
      } ];
      optionalCheckboxes.forEach(({
        key,
        label
      }) => {
        if (isOptionVisible(key)) {
          fieldset["list-checkbox"].push(this._createCheckboxOption(order++, key, label, false));
        }
      });
      return {
        dialog: {
          content: {
            fieldset: fieldset
          }
        }
      };
    },
    _createCheckboxOption: function(order, id, label, isChecked) {
      return {
        order: order,
        id: id,
        condition_enabled: true,
        condition_visible: true,
        o: [ {
          v: id,
          l: label,
          s: isChecked
        } ]
      };
    },
    _createNodePickerOption: function(order, id, label) {
      return {
        order: order,
        id: id,
        label: label,
        property_type: "string",
        condition_required: true,
        subTypeFilters: [ "dm_folder" ],
        condition_visible: "(getValue(new_file).equals('new_file'))",
        repeating: false
      };
    },
    _createTextOption: function(order, id, label) {
      return {
        order: order,
        id: id,
        type: "text",
        label: label,
        condition_required: true,
        condition_visible: "(getValue(new_file).equals('new_file'))",
        value: this.options.defaultFileName
      };
    },
    onRender: function() {
      this.formRendered = true;
    },
    isFormRendered: function() {
      return this.formRendered;
    }
  });
});