/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/marionette", "csui/models/form", "d2/controls/form/d2.form.view", "d2/widgets/metadata/utils/form.converter", "d2/utils/mass.update.utils", "d2/controls/table/cells/field.value.count/field.value.count.view", "hbs!d2/dialogs/mass.update/mass.update.property.page/impl/mass.update.field.correction.form", "i18n!d2/dialogs/mass.update/impl/nls/lang", "css!d2/dialogs/mass.update/mass.update.property.page/impl/mass.update.field.correction.form.css" ], function(_, Marionette, FormModel, D2FormView, MetadataConverter, MassUpdateUtils, FieldValueCountView, formTemplate, lang) {
  "use strict";
  return D2FormView.extend({
    formTemplate: formTemplate,
    className: function() {
      return D2FormView.prototype.className.apply(this, arguments) + " d2-mass-update-correction-form";
    },
    constructor: function MassUpdateErrorCorrectionFormView(options) {
      this.node = options.node;
      this.control = options.control;
      if (!options.originatingView) {
        options.originatingView = new Marionette.View();
      }
      if (!options.originatingView.isErrorMode) {
        options.originatingView.isErrorMode = function() {
          return false;
        };
      }
      options.topAlignedLabel = true;
      var dialog = this._createDialogJson(options);
      this.rendered = false;
      this.dialogView = options.dialogView;
      this.formmodel = MetadataConverter.convertConfig(dialog, {
        actionMode: "edit",
        layoutMode: "singleCol"
      });
      var form = _.extend({
        data: {},
        schema: {},
        options: {}
      }, this.formmodel.propertiesConfig[0]);
      options.model = new FormModel(form);
      options.mode = "create";
      D2FormView.prototype.constructor.call(this, options);
      this.listenTo(this, "valid:field", this._raiseValidChangeEvent);
      this.listenTo(this, "invalid:field", this._raiseInvalidChangeEvent);
    },
    onShow: function() {
      this.listenTo(this, "d2:change:formValidation", function() {
        this.validateForm(true).done(function(isValid) {
          this.isValid = isValid;
          this.refreshButtons();
        }.bind(this));
      }.bind(this));
      this.listenTo(this, "render:form", function() {
        this.validateForm(true).done(function(isValid) {
          this.isValid = isValid;
          this.refreshButtons();
        }.bind(this));
      }.bind(this));
    },
    updateRenderedForm: function() {
      D2FormView.prototype.updateRenderedForm.apply(this, arguments);
      var alpacaForm = this.$el.alpaca("get");
      if (alpacaForm) {
        var children = alpacaForm.children;
        _.each(children, function(control) {
          this.addCountToControl(control);
        }, this);
      }
    },
    addCountToControl: function(control) {
      var countData = this.options.control.options.multiFileCountData[control.propertyId];
      var countView = new FieldValueCountView({
        model: MassUpdateUtils.getCountDataModel(countData, this.options.control.options)
      });
      var labelEl = control.field.find("label").append('<span class="count-region"></span>');
      var countRegion = new Marionette.Region({
        el: labelEl.find(".count-region")
      });
      countRegion.show(countView);
    },
    refreshButtons: function() {
      if (this.options.wizard) {
        this.options.wizard.refreshFooter([ "next" ]);
      }
    },
    _createDialogJson: function(options) {
      var multiFileCountData = options.formModel.get("options").initialFieldMultiValueMap[this.control.propertyId];
      multiFileCountData = JSON.parse(JSON.stringify(multiFileCountData));
      var fieldSchema = this._findFieldSchema(options.pageContent.dialog.content, this.control);
      var dialogConfig = {
        dialog: {
          content: {
            combo: []
          }
        }
      };
      fieldSchema[fieldSchema.type] = _.omit(fieldSchema[fieldSchema.type], function(prop, key) {
        return key.startsWith("condition_") && !key.startsWith("condition_required") || key.startsWith("advancedView_");
      });
      var order = 1;
      _.each(_.keys(multiFileCountData), function(key) {
        var field = multiFileCountData[key];
        if (_.isString(field.category) && /Error/.test(field.category)) {
          var fldSchema = JSON.parse(JSON.stringify(fieldSchema))[fieldSchema.type];
          dialogConfig.dialog.content["combo"].push(fldSchema);
          fldSchema.id = key;
          fldSchema.label = _.str.sformat(lang.errorUpdateLabel, fldSchema.label);
          fldSchema.repeating = false;
          fldSchema.order = order++;
          var values = fldSchema.o;
          if (_.isObject(values) && !_.isArray(values)) {
            fldSchema.o = [ values ];
          }
          if (options.lastFormValues && _.has(options.lastFormValues, key)) {
            var selectedOption = _.findWhere(fldSchema.o, {
              v: options.lastFormValues[key]["value"]
            });
            if (selectedOption) {
              selectedOption["s"] = true;
            } else {
              if (!_.isEmpty(options.lastFormValues[key]["value"])) {
                fldSchema.o.push({
                  v: options.lastFormValues[key]["value"],
                  l: options.lastFormValues[key]["label"],
                  s: true
                });
              }
            }
          } else {
            fldSchema.o.push({
              v: field.value,
              l: field.label,
              c: field.category,
              s: true
            });
          }
          var toRemoveIndex = _.findIndex(fldSchema.o, function(value) {
            if (MassUpdateUtils.fieldHasMultipleValues(value.v)) {
              return true;
            }
          });
          fldSchema.o.splice(toRemoveIndex, 1);
        }
      }, this);
      return dialogConfig;
    },
    _findFieldSchema: function(content, control) {
      if (content && content.id === control.propertyId) {
        return content;
      } else if (_.isObject(content) || _.isArray(content)) {
        var matchField = null;
        _.find(content, function(field, key) {
          matchField = this._findFieldSchema(field, control);
          if (matchField && !matchField.type && _.isString(key)) {
            var object = {};
            object[key] = matchField;
            matchField = JSON.parse(JSON.stringify(object));
            matchField.type = key;
          }
          return matchField;
        }.bind(this));
        return matchField;
      }
      return false;
    }
  });
});