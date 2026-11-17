/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "d2/widgets/metadata/utils/field.converter", "d2/widgets/metadata/utils/container.converter", "d2/utils/sort.utils", "i18n!d2/widgets/metadata/impl/nls/lang" ], function(_, FieldConverter, ContainerConverter, sortUtils, lang) {
  "use strict";
  var MetadataConverter = {
    convertConfig: function(formJSON, options) {
      options = _.extend({
        actionMode: undefined
      }, options);
      return {
        propertiesConfig: this.convertPropertiesConfig(formJSON, options),
        signOffConfig: this.convertSignOffConfig(formJSON, options)
      };
    },
    convertPropertiesConfig: function(formJSON, options) {
      var form = formJSON && formJSON.dialog && formJSON.dialog.content;
      options.propertyPageId = formJSON?.dialog?.d2_property_config;
      return this.processForm(form, formJSON, options);
    },
    convertSignOffConfig: function(formJSON, options) {
      var form = formJSON && formJSON.dialog && formJSON.dialog.dialog && formJSON.dialog.dialog.content;
      if (form) {
        var columnCount = formJSON.dialog.dialog.external_sign_off_required ? 1 : 2;
        var colForm = {
          order: 1,
          columns: {
            count: columnCount,
            order: 1
          }
        };
        _.extend(colForm["columns"], form);
        var signOffConfig = this.processForm(colForm, formJSON, _.extend({}, options, {
          isMassUpdate: false
        }))[0];
        _.extend(signOffConfig.schema, {
          title: "",
          id: "electronicSignOff"
        });
        _.extend(signOffConfig, {
          title: "",
          id: "electronicSignOff"
        });
        return signOffConfig;
      } else {
        return undefined;
      }
    },
    processForm: function(form, formJSON, options) {
      if (form) {
        var controlMap = {};
        form = this.collateFields(form);
        this.convertForm(form, controlMap, options);
        var formArray = this.createFormConfigs(controlMap, formJSON);
        this.includeNonFieldExpression(formArray, formJSON, options);
        this.generateFormModelConfig(formArray, options);
        this.addExpressionsForReinit(formArray);
        return formArray;
      } else {
        return undefined;
      }
    },
    generateFormModelConfig: function(formArray, options) {
      var keyPathMap = this.buildPropertyIdPathMap(formArray);
      _.each(formArray, function(form) {
        form._keyPathMap = keyPathMap;
        form.id = form.schema.id;
        form.title = form.schema.title;
        form.formType = form.schema.formType;
        if (options && options.initialFieldValueMap) {
          form.options.initialFieldValueMap = options.initialFieldValueMap;
        }
        if (options && options.isMassUpdate) {
          if (options.initialFieldMultiValueMap) {
            form.options.initialFieldMultiValueMap = options.initialFieldMultiValueMap;
          }
          if (!_.isUndefined(options.maxObjectThresholdReached)) {
            form.options.maxObjectThresholdReached = options.maxObjectThresholdReached;
          }
        }
        if (options && options.externalEsignOff) {
          form.options.externalEsignOff = options.externalEsignOff;
          form.options.externalAuditURL = options.externalAuditURL;
        }
        var formId = _.keys(form.options.fields)[0];
        var controlOpts = form.options.fields[formId];
        if (!_.isUndefined(controlOpts._d2Containertype)) {
          form.spyhidden = form.schema.formType === "d2column" || form.schema.formType === "d2grid";
          form.hidden = controlOpts.hidden;
          if (controlOpts._d2Containertype === "d2fieldset") {
            form.hideTabLinkConversion = true;
          }
        }
      });
    },
    addExpressionsForReinit: function(formArray) {
      var buildSetValueExpression = function(fieldId, reinitAttributes) {
        var reinitAttribs = reinitAttributes.split(",");
        _.each(reinitAttribs, function(reinitAttrib) {
          var keyPathObject = formArray[0]._keyPathMap[reinitAttrib];
          if (!_.isUndefined(keyPathObject)) {
            var foundForm = _.find(formArray, {
              id: keyPathObject.formId
            });
            var expressions = foundForm.expressions[foundForm._keyPathMap[reinitAttrib].fieldPath];
            if (Object.prototype.hasOwnProperty.call(expressions, "reInitialize")) {
              expressions["reInitialize"] = expressions["reInitialize"] + "||" + ("(getValue(" + fieldId + "))");
            } else {
              var expr = "(getValue(" + fieldId + "))";
              _.extend(expressions, {
                reInitialize: expr
              });
            }
          }
        });
      };
      var findFieldAndReplace = function(fields) {
        for (var fieldId in fields) {
          if (Object.prototype.hasOwnProperty.call(fields, fieldId)) {
            var field = fields[fieldId];
            if (field.reinitAttributes) {
              buildSetValueExpression(fieldId, field.reinitAttributes);
            }
            if (field.fields) {
              if (field._d2Containertype === "d2grid") {
                findFieldAndReplace(field.fields.item.fields);
              } else {
                findFieldAndReplace(field.fields);
              }
            }
          }
        }
      };
      _.each(formArray, function(form) {
        findFieldAndReplace(form.options.fields);
      });
    },
    buildPropertyIdPathMap: function(formResponse) {
      var keyPathMap = {};
      _.each(formResponse, function(formConfig) {
        var expressions = formConfig.expressions;
        _.each(_.keys(expressions), function(key) {
          var pathObj = {
            formId: formConfig.schema.id,
            fieldPath: key
          };
          keyPathMap[key.split(".").pop()] = pathObj;
        }, this);
      }, this);
      return keyPathMap;
    },
    createFormConfigs: function(controlMap, formJSON) {
      var newFormsArray = [];
      var genForm = this.fetchFormTemplate(this.getDefaultOptions(formJSON, lang.generalTabName, "general"));
      newFormsArray.push(genForm);
      var keys = _.keys(controlMap).sort(sortUtils.compareVersions);
      _.each(keys, function(key, index) {
        var control = controlMap[key];
        var formId = _.keys(control.options.fields)[0];
        var controlOpts = control.options.fields[formId];
        var type = controlOpts._d2Containertype;
        if (controlOpts._d2Containertype !== undefined) {
          if (controlOpts._d2Containertype === "d2tabgroup") {
            this.getTabForms(control, formJSON, newFormsArray);
          } else {
            var defaultOptions = this.getDefaultOptions(formJSON, controlOpts.containerLabel, formId, type);
            if (index === 0 && (controlOpts._d2Containertype === "d2column" || controlOpts._d2Containertype === "d2grid")) {
              defaultOptions = this.getDefaultOptions(formJSON, lang.generalTabName, "general");
            }
            var newForm = this.fetchFormTemplate(defaultOptions);
            this.addUIField(newForm, control);
            newFormsArray.push(newForm);
          }
        } else {
          this.addUIField(genForm, control);
        }
      }, this);
      _.each(newFormsArray, function(formArray) {
        this.hasAllChildHidden(formArray.options.fields, formArray);
      }, this);
      if (_.isEmpty(newFormsArray[0].schema.properties)) {
        newFormsArray.shift();
      }
      return newFormsArray;
    },
    hasAllChildHidden: function(fieldItems, form) {
      let hasAllHidden;
      for (let key in fieldItems) {
        let field = fieldItems[key];
        if (field.fields && !field.hidden) {
          return this.hasAllChildHidden(field.fields, form);
        }
        if (fieldItems[key].hiddenBySelf || _.contains([ "d2column", "d2fieldset", "d2tab", "d2tabgroup" ], fieldItems[key].type) && fieldItems[key].hidden === true) {
          hasAllHidden = true;
        } else {
          hasAllHidden = false;
          break;
        }
      }
      if (hasAllHidden) {
        if (form.schema.id === "general") {
          form.options["hideTab"] = hasAllHidden;
        } else {
          var fieldKeys = Object.keys(form.options.fields);
          form.options.fields[fieldKeys[0]]["hidden"] = hasAllHidden;
        }
      }
    },
    includeNonFieldExpression: function(forms, formJSON, options) {
      if (forms && forms.length > 0 && options) {
        var formButtons = formJSON?.dialog?.buttons?.button, form = forms[0];
        form.enableNonFieldExpression = options.enableNonFieldExpression = true;
        if (formButtons && formButtons.length > 0) {
          _.each(formButtons, formButton => {
            var buttonField = FieldConverter.fetchAlpacaControl(formButton, options.actionMode);
            this.updateButtonExpressionByMode(buttonField, formButton, options.actionMode, [ "Enabled", "Visible" ]);
            _.extend(form.expressions, buttonField.expressions);
          });
        }
      }
    },
    updateButtonExpressionByMode: function(buttonField, formButton, mode, conditionTypes) {
      _.each(conditionTypes, conditionType => {
        var conditionModeLabel = "condition_" + conditionType.toLowerCase() + "_" + mode, expressionKey = "set" + conditionType, conditionModeExpression = buttonField.expressions[formButton.id];
        if (!_.has(conditionModeExpression, expressionKey) && _.has(formButton, conditionModeLabel)) {
          buttonField.expressions[formButton.id][expressionKey] = formButton[conditionModeLabel];
        }
      });
    },
    fetchFormTemplate: function(defaultOptions) {
      var formTemplate = {
        data: {},
        multiFileData: {},
        schema: {
          properties: {}
        },
        options: {
          fields: {}
        },
        expressions: {}
      };
      return _.extend(formTemplate, defaultOptions);
    },
    getTabForms: function(tabgroup, formJSON, newFormsArray) {
      var tabFields = _.values(tabgroup.options.fields)[0].fields;
      var tabGroupId = _.keys(tabgroup.options.fields)[0];
      _.each(tabFields, function(field, tabKey) {
        var tabForm = this.fetchFormTemplate(this.getDefaultOptions(formJSON, field.containerLabel, tabKey));
        tabForm.data[tabKey] = tabgroup.data[tabGroupId][tabKey];
        tabForm.options.fields[tabKey] = tabgroup.options.fields[tabGroupId].fields[tabKey];
        tabForm.options.fields[tabKey].isSpyScrollContainer = true;
        tabForm.schema.properties[tabKey] = tabgroup.schema.properties[tabGroupId].properties[tabKey];
        var tabExp = {};
        _.each(tabgroup.expressions, function(tabgroupExp, expkey) {
          var keyAry = expkey.split(".");
          if (keyAry[1] === tabKey) {
            var tabFieldsExpPath = expkey.substr(expkey.indexOf(tabKey));
            tabExp[tabFieldsExpPath] = tabgroupExp;
          }
        });
        var uniqueKeys = _.union(_.keys(tabExp[tabKey]), _.keys(tabgroup.expressions[tabGroupId]));
        _.each(uniqueKeys, function(setterFunction) {
          var expOnTabGrp = tabgroup.expressions[tabGroupId][setterFunction] ? tabgroup.expressions[tabGroupId][setterFunction] : "";
          var expOnTab = tabExp[tabKey][setterFunction] ? tabExp[tabKey][setterFunction] : "";
          var finalExp = "";
          if (!_.isEmpty(expOnTabGrp) && !_.isEmpty(expOnTab)) {
            finalExp = "(" + expOnTabGrp + "&&" + expOnTab + ")";
          } else {
            finalExp = expOnTabGrp + expOnTab;
          }
          tabExp[tabKey][setterFunction] = finalExp;
        });
        tabForm.expressions = tabExp;
        newFormsArray.push(tabForm);
      }, this);
    },
    getDefaultOptions: function(formJSON, title, formId, type) {
      var defaultOptions = {
        schema: {
          properties: {},
          initial_invalid: formJSON.dialog.initial_invalid,
          auto_smartview_edit_mode: formJSON.dialog.auto_smartview_edit_mode || false,
          value_format: formJSON.dialog.value_format,
          title: title,
          id: formId === "general" ? formId : formId + "_form",
          formType: type
        }
      };
      return defaultOptions;
    },
    collateFields: function(form) {
      var fieldMap = {};
      for (var key in form) {
        if (Object.prototype.hasOwnProperty.call(form, key)) {
          if (form[key].order) {
            fieldMap[form[key].order] = {};
            fieldMap[form[key].order][key] = form[key];
          } else {
            for (var index in form[key]) {
              if (Object.prototype.hasOwnProperty.call(form[key], index)) {
                fieldMap[form[key][index].order] = {};
                fieldMap[form[key][index].order][key] = form[key][index];
              }
            }
          }
        }
      }
      var fieldOrder = 1;
      var fieldIndex = 1;
      while (fieldMap[fieldOrder]) {
        for (var fieldKey in fieldMap[fieldOrder]) {
          if (Object.prototype.hasOwnProperty.call(fieldMap[fieldOrder], fieldKey)) {
            if (FieldConverter.isField(fieldKey)) {
              fieldMap[fieldOrder][fieldKey].order = fieldIndex;
              fieldIndex += 1;
            }
            fieldOrder += 1;
          }
        }
      }
      fieldOrder = 1;
      var containerIndex = fieldIndex;
      while (fieldMap[fieldOrder]) {
        for (var containerKey in fieldMap[fieldOrder]) {
          if (Object.prototype.hasOwnProperty.call(fieldMap[fieldOrder], containerKey)) {
            if (ContainerConverter.isContainer(containerKey)) {
              fieldMap[fieldOrder][containerKey].order = containerIndex;
              containerIndex += 1;
            }
          }
        }
        fieldOrder += 1;
      }
      var newForm = {};
      for (var order in fieldMap) {
        if (Object.prototype.hasOwnProperty.call(fieldMap, order)) {
          for (var fieldMapKey in fieldMap[order]) {
            if (Object.prototype.hasOwnProperty.call(fieldMap[order], fieldMapKey)) {
              if (form[fieldMapKey].order) {
                newForm[fieldMapKey] = fieldMap[order][fieldMapKey];
              } else {
                newForm[fieldMapKey] = newForm[fieldMapKey] || [];
                newForm[fieldMapKey].push(fieldMap[order][fieldMapKey]);
              }
            }
          }
        }
      }
      newForm.order = form.order;
      return newForm;
    },
    addUIField: function(form, control) {
      _.extend(form.data, control.data);
      _.extend(form.multiFileData, control.multiFileData);
      _.extend(form.options.fields, control.options.fields);
      _.extend(form.schema.properties, control.schema.properties);
      _.extend(form.expressions, control.expressions);
    },
    convertForm: function(form, controlMap, options) {
      for (var key in form) {
        if (!options.isOtcForm && ContainerConverter.isContainer(key)) {
          var subForm = form[key];
          if (!_.isArray(subForm)) {
            subForm = [ subForm ];
          }
          _.each(subForm, function(f) {
            f.order = f.order ? form.order + "." + f.order : form.order;
            if (ContainerConverter.shouldConvertContainer(key, f)) {
              var alpacaField = ContainerConverter.convertContainer(key, f, options);
              if (!_.isUndefined(alpacaField) && !_.isEmpty(alpacaField)) {
                controlMap[f.order] = alpacaField;
              }
            } else {
              this.convertForm(f, controlMap, options);
            }
          }, this);
        } else if (FieldConverter.isField(key)) {
          var fields = form[key];
          if (!_.isArray(fields)) {
            fields = [ fields ];
          }
          _.each(fields, function(field) {
            var alpacaField = FieldConverter.convertField(key, field, options.actionMode, options);
            if (!_.isUndefined(alpacaField) && !_.isEmpty(alpacaField)) {
              field.order = field.order ? form.order + "." + field.order : form.order;
              controlMap[field.order] = alpacaField;
            }
          }, this);
        }
      }
      if (options.isOtcForm && options.maxFields) {
        const sortedKeys = _.sortBy(_.keys(controlMap), function(k) {
          return parseFloat(k);
        });
        const slicedKeys = sortedKeys.slice(0, options.maxFields), picked = _.pick(controlMap, slicedKeys);
        _.each(_.keys(controlMap), function(k) {
          delete controlMap[k];
        });
        _.extend(controlMap, picked);
      }
    }
  };
  return MetadataConverter;
});