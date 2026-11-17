/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "d2/widgets/metadata/utils/form.converter", "d2/utils/rest.linkrels", "d2/controls/globalmessage/globalmessage", "dctmw/utils/utils", "d2/utils/constants", "hbs!d2/controls/form/otc.form/otc.form", "css!d2/controls/form/otc.form/otc.form" ], function($, _, Marionette, MetadataConverter, RestLinkrels, GlobalMessage, utils, constants, template) {
  "use strict";
  return Marionette.LayoutView.extend({
    template: template,
    ui: {
      otcFormContainer: ".otc-form-container"
    },
    constructor: function OTCFormView(options) {
      this.options = options || {};
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
    },
    _prepareFormSchema: function() {
      const formResponse = MetadataConverter.convertConfig(this.options.formContent, {
        isOtcForm: true
      });
      this.formSchema = formResponse.propertiesConfig[0];
    },
    _renderOTCFormView: function() {
      if (this.options.schema) {
        this.formSchema = this.options.schema;
      } else {
        this._prepareFormSchema();
      }
      this._setSchemaForFormView();
    },
    onShow: function() {
      this._renderOTCFormView();
    },
    getNativeFormInstance: function() {
      return document.querySelector(".otc-form-container");
    },
    checkAndConvertSchema: function(schema) {
      if (schema) {
        let readOnlyFields = [];
        Object.keys(schema.options.fields).forEach(field => {
          if (schema.options.fields[field].ds && schema.options.fields[field].ds.async === true) {
            readOnlyFields.push(field);
          } else if (!_.isEmpty(schema.expressions[field])) {
            readOnlyFields.push(field);
          }
        });
        if (readOnlyFields.length > 0) {
          readOnlyFields.forEach(field => {
            schema.schema.properties[field].readonly = true;
          });
        }
      }
      return schema;
    },
    fallBackIntoInitialValue: function() {
      this.ui.otcFormContainer.attr("schema", JSON.stringify(""));
      this.ui.otcFormContainer.attr("schema", JSON.stringify(this.formSchema));
    },
    _showErrorMessage: function(options) {
      const errorData = utils.parseAjaxError(options.xhr, options.textStatus, options.errorThrown);
      GlobalMessage.showMessage("error", errorData.message);
    },
    executeSave: function(formValue) {
      const dfd = $.Deferred(), self = this;
      $.ajax(this.options.connector.extendAjaxOptions({
        url: RestLinkrels.getLink(this.options.nodeLinks, RestLinkrels.EDIT),
        type: "POST",
        headers: {
          "Content-Type": constants.MediaTypes.DCTM_JSON
        },
        data: JSON.stringify({
          properties: formValue
        }),
        success: function() {
          self.formSchema.data = formValue;
          dfd.resolve();
        },
        error: function(xhr, textStatus, errorThrown) {
          self._showErrorMessage({
            xhr: xhr,
            textStatus: textStatus,
            errorThrown: errorThrown
          });
          self.fallBackIntoInitialValue();
          dfd.reject();
        }
      }));
      return dfd.promise();
    },
    getValueFromEnum: function(enumFieldData, optionLabels) {
      if (_.isArray(enumFieldData)) {
        if (enumFieldData.length === 1) {
          return optionLabels[enumFieldData];
        } else {
          enumFieldData.forEach((enumValue, index) => {
            const value = optionLabels[enumValue];
            if (value !== undefined) {
              enumFieldData[index] = value;
            }
          });
          return enumFieldData;
        }
      }
    },
    getFormData: function(otcFormData, schema) {
      const fieldKeys = Object.keys(otcFormData);
      fieldKeys.forEach(fieldKey => {
        if (schema.schema.properties[fieldKey].enum && schema.schema.properties[fieldKey].enum.length > 0) {
          const enumFieldValue = otcFormData[fieldKey].split(",");
          otcFormData[fieldKey] = this.getValueFromEnum(enumFieldValue, schema.options.fields[fieldKey].optionLabels);
        }
      });
      return otcFormData;
    },
    restrictFormResponsive: function() {
      this.getNativeFormInstance().form.classList.remove("otc-form--is-responsive");
    },
    _setSchemaForFormView: function() {
      const schema = this.checkAndConvertSchema(this.formSchema);
      this.ui.otcFormContainer.attr("schema", JSON.stringify(schema));
      this.ui.otcFormContainer.attr("mode", this.options.formMode || "edit");
      this.ui.otcFormContainer.attr("responsivecolumnwidth", "230");
      this.ui.otcFormContainer.on("update-completed", () => {
        this.options.forceStopFormResponsive && this.restrictFormResponsive();
        this.ui.otcFormContainer.change(event => {
          const otcFormData = event.originalEvent.detail.value;
          this.executeSave(this.getFormData(otcFormData, schema));
        });
      });
    }
  });
});