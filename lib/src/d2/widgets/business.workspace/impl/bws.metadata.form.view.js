/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "d2/controls/form/otc.form/otc.form.view", "d2/widgets/metadata/utils/form.converter", "hbs!d2/widgets/business.workspace/impl/bws.metadata.form", "i18n!d2/widgets/business.workspace/impl/nls/lang", "i18n!d2/widgets/metadata/impl/nls/lang" ], function($, _, OTCFormView, MetadataConverter, template, lang, metadataLang) {
  "use strict";
  return OTCFormView.extend({
    constructor: function BWSMetadataHeaderFormView() {
      OTCFormView.prototype.constructor.apply(this, arguments);
    },
    template: template,
    ui: {
      ...OTCFormView.prototype.ui,
      expandCollapse: ".form-show-details-parent"
    },
    events: {
      "click @ui.expandCollapse": "onToggleMetadataContent"
    },
    templateHelpers: function() {
      return {
        showMore: lang.showMoreText
      };
    },
    _prepareFormSchema: function() {
      if (!this.formSchema) {
        const formResponse = MetadataConverter.convertConfig(this.options.formContent, {
          isOtcForm: true,
          actionMode: this.options.formMode,
          maxFields: this.getFieldsCount() || 0
        });
        this.formSchema = formResponse.propertiesConfig[0];
      }
    },
    initialize: function() {
      $(window).on("resize", this.onWindowReSize.bind(this));
      this.listenTo(this, "before:destroy", () => {
        $(window).off("resize");
      });
      this.listenTo(this, "on:minimize:metadata:content", this.onToggleMetadataContent);
      this.listenTo(this, "property:page:field:changed", model => {
        this._syncPropertyPage(model);
      });
    },
    _syncPropertyPage: function(model) {
      Object.keys(this.formSchema.data).forEach(data => {
        let type = this.formSchema.options.fields[data].type, value;
        if (data === "object_name") {
          value = model.get("name");
        } else if (type === "select") {
          value = this.formSchema.options.fields[data].optionLabels?.indexOf(model.get(data));
        } else if (type === "input" && this.formSchema.options.fields[data].inputType === "boolean") {
          value = model.get(data) === "false" || model.get(data) === "F" ? false : !!model.get(data);
          value = value ? metadataLang.valueTrue : metadataLang.valueFalse;
        } else {
          value = model.get(data);
        }
        this.formSchema.data[data] = value;
      });
      this._renderOTCFormView();
    },
    onShow: function() {
      this.listenTo(this, "dom:refresh", () => {
        OTCFormView.prototype.onShow.apply(this, arguments);
        const isFieldsTrimmed = this.checkIfFieldsAreTrimmed(this.options.formContent.dialog.content, this.getFieldsCount());
        if (isFieldsTrimmed) this.ui.expandCollapse.removeClass("binf-hidden");
        this._syncPropertyPage(this.options.model);
      });
    },
    onToggleMetadataContent: function() {
      this.trigger("ontoggle:metadata:content");
    },
    getFieldsCount: function() {
      const containerWidth = this.$el.find(".otc-form-container").width();
      const fieldWidth = 230;
      const count = Math.floor(containerWidth / fieldWidth);
      return Math.max(count, 1);
    },
    onWindowReSize: function() {
      this._renderOTCFormView();
    },
    checkIfFieldsAreTrimmed: function(dialogContent, fieldsCount) {
      const flattened = {};
      _.each(dialogContent, function(value, key) {
        if (_.isArray(value)) {
          _.each(value, function(item, index) {
            flattened[`${key}_${index}`] = item;
          });
        } else {
          _.isObject(value) && (flattened[key] = value);
        }
      });
      return _.keys(flattened).length > fieldsCount;
    }
  });
});