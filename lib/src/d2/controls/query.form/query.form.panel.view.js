/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/marionette", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/utils/log", "csui/models/form", "nuc/models/node/node.model", "csui/utils/commands", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "d2/controls/form/fields/listfieldview/d2listfield.view", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/widgets/metadata/utils/form.converter", "d2/widgets/metadata/general.panels/d2/d2.general.form.model", "d2/widgets/metadata/metadata.properties.view", "dctmw/utils/utils", "hbs!d2/controls/query.form/impl/query.form.panel" ], function(Marionette, _, $, Backbone, log, FormModel, NodeModel, commands, PerfectScrollingBehavior, D2ListFieldView, WizardTabableRegionBehavior, MetadataConverter, D2GeneralFormModel, D2MetadataPropertiesView, utils, formTemplate) {
  "use strict";
  var QueryFormPanelView = D2MetadataPropertiesView.extend({
    formTemplate: formTemplate,
    constructor: function QueryFormPanelView(options) {
      options = options || (options = {});
      options.node = new NodeModel(undefined, {
        connector: options.connector
      });
      var form = this.createFormConfig(options);
      this.ignoredControls = this.getExcludedControls(form);
      var formarr = [];
      for (var i = 0; i < form.propertiesConfig.length; i++) {
        form.propertiesConfig[i].node = options.node;
        var model = new D2GeneralFormModel(form.propertiesConfig[i]);
        model.get("schema")["initial_invalid"] = true;
        formarr.push(model);
      }
      this.rendered = false;
      var fcollection = new Backbone.Collection(formarr);
      fcollection.fetched = true;
      this.form = form;
      this.formFieldChanged = false;
      options.action = "queryform";
      options.collection = fcollection;
      options.formMode = "create";
      options["supressSingleTab"] = true;
      this.behaviors = _.extend({}, this.behaviors, {
        WizardTabableRegionBehavior: {
          behaviorClass: WizardTabableRegionBehavior
        }
      });
      D2MetadataPropertiesView.prototype.constructor.call(this, options);
      if (options.context.queryformdata && options.context.queryformdata[options.savedSearchId] && options.fromSearchResults) {
        _.each(form.propertiesConfig, function(config) {
          this.setValues(config.data, options.context.queryformdata[options.savedSearchId]);
        }, this);
      }
      this.keyboardBehavior.destroy();
      this.listenTo(this, "query:form:search", this._search);
      this.listenTo(this, "query:form:clear", this.clear);
      this.listenTo(this, "d2:metadata:formFieldChange", this.checkIfFormFieldChanged);
    },
    checkIfFormFieldChanged: function(args) {
      if (args && !(args.value === args.model.get("data")[args.targetField.name] || args.value === "" && args.model.get("data")[args.targetField.name] === null)) {
        this.formFieldChanged = true;
        this.refreshButtons(this.isValid);
      }
    },
    onShow: function() {
      this.listenTo(this, "d2:metadata:formValidation", function(isValid) {
        this.isValid = isValid;
        me.refreshButtons(isValid);
      });
      var me = this;
      this.listenTo(this, "render:forms", function() {
        me.rendered = true;
        me.validateAllForms(false, true).done(function(isValid) {
          me.isValid = isValid;
          me.refreshButtons(me.isValid);
        }.bind(this));
      });
    },
    refreshButtons: function(isValid) {
      if (this.options.parent && this.formFieldChanged) {
        this.options.parent.triggerMethod("query:form:validate", isValid);
      } else if (this.options.wizard) {
        this.options.wizard.refreshFooter([ "next" ]);
      }
    },
    executeQueryFormSearch: function() {
      if (this.options.context.queryform) {
        _.extend(this.options.context.queryform, this.getForm());
      } else {
        this.options.context.queryform = this.getForm();
      }
      !this.options.context.queryformdata && (this.options.context.queryformdata = {});
      this.options.context.queryformdata[this.options.savedSearchId] = this.getFormValues();
      if (!utils.isMobile()) {
        this.options.wizard.close();
      }
      var executeQueryFormSearchCommand = commands.get("D2-ExecuteQueryFormSearch");
      executeQueryFormSearchCommand.execute({
        savedSearchId: this.options.savedSearchId,
        context: this.options.context
      });
    },
    createFormConfig: function(options) {
      return MetadataConverter.convertConfig(options.data.get("page-content"), {
        actionMode: "edit",
        layoutMode: "singleCol"
      });
    },
    _updatePropetiesMap: function(map, properties) {
      var me = this;
      _.each(map, function(value, key) {
        if (_.isArray(value)) {
          if (!_.isEmpty(value)) {
            if (!_.isObject(value[0])) {
              properties[key] = value;
            } else {
              _.each(_.keys(value[0]), function(k) {
                properties[k] = _.pluck(value, k);
              });
            }
          } else {
            properties[key] = [];
          }
        } else if (!_.isObject(value)) {
          properties[key] = value;
        } else {
          me._updatePropetiesMap(value, properties);
        }
      });
    },
    setValues: function(theObject, map) {
      if (theObject instanceof Array) {
        for (var i = 0; i < theObject.length; i++) {
          this.setValues(theObject[i], map);
        }
      } else {
        for (var prop in theObject) {
          if (Object.prototype.hasOwnProperty.call(theObject, prop)) {
            if (Object.prototype.hasOwnProperty.call(map, prop)) {
              const context = this.options?.context;
              const queryformData = context?.queryformdata;
              if (queryformData && queryformData[this.options.savedSearchId]) {
                const selectedModels = queryformData[this.options.savedSearchId] || [];
                const selectedModel = selectedModels[prop];
                if (selectedModel && typeof selectedModel !== "string") {
                  if (Array.isArray(selectedModel)) {
                    theObject[prop] = _.isObject(selectedModel[0]) ? _.pluck(selectedModel, "name") : map[prop];
                  } else {
                    theObject[prop] = selectedModel.name || selectedModel.value?.data;
                  }
                } else {
                  theObject[prop] = map[prop];
                }
              } else {
                theObject[prop] = map[prop];
              }
            }
          }
          if (theObject[prop] instanceof Array && !Object.prototype.hasOwnProperty.call(map, prop)) {
            theObject[prop] = [];
          } else if (theObject[prop] instanceof Object || theObject[prop] instanceof Array) {
            this.setValues(theObject[prop], map);
          } else {
            if (!Object.prototype.hasOwnProperty.call(map, prop) && !(theObject instanceof Array) && $.type(theObject) !== "string" && this.ignoredControls.indexOf(prop) === -1) {
              theObject[prop] = null;
            }
          }
        }
      }
    },
    getFormValues: function() {
      var map = this.getFormsValues();
      var properties = {};
      this._updatePropetiesMap(map, properties);
      var propertiesConfig = this.form.propertiesConfig;
      var me = this, fieldValue, fieldsValue = {};
      function getControl(path) {
        var ctrl;
        me.tabContent.children.every(function(childView) {
          var generalFormView = childView.content;
          var control = generalFormView.getAlpacaControlByPath(path);
          if (control) {
            ctrl = control;
          }
          return !ctrl;
        });
        return ctrl;
      }
      function loadFieldWithDQLAsync(control) {
        if (control.options?.ds?.assistance_type === "dql" && control.options?.ds?.async) {
          if (!fieldsValue[me.options.savedSearchId]) {
            fieldsValue[me.options.savedSearchId] = [];
          }
          if (control.fieldView instanceof D2ListFieldView) {
            fieldValue = [];
            control.fieldView.selectedCollection.models.forEach(selectedModel => {
              fieldValue.push({
                id: selectedModel.get("id"),
                name: selectedModel.get("name")
              });
            });
          } else {
            fieldValue = control.fieldView.model.toJSON();
          }
          fieldsValue[me.options.savedSearchId].push({
            label: control.propertyId,
            value: fieldValue
          });
        }
      }
      for (var i = 0; i < propertiesConfig.length; i++) {
        var config = propertiesConfig[i];
        var keypathobj = config._keyPathMap;
        var ignoreTypes = [ "d2column", "d2fieldset", "d2label", "richtext", "d2nodepicker", "d2singlearray", "d2tab" ];
        _.each(keypathobj, function(value, key) {
          var control = getControl(value.fieldPath);
          if (control) {
            ignoreTypes.indexOf(control.type) === -1 && loadFieldWithDQLAsync(control);
            if (control.type && ignoreTypes.indexOf(control.type) === -1 && !properties[key]) {
              properties[key] = control.getValue();
            }
            if (control.type && ignoreTypes.indexOf(control.type) !== -1) {
              delete properties[key];
            }
          }
        });
      }
      !_.isEmpty(fieldsValue) && fieldsValue[this.options.savedSearchId].forEach(fieldValue => {
        if (fieldValue.label in properties) {
          properties[fieldValue.label] = fieldValue.value;
        }
      });
      return properties;
    },
    getExcludedControls: function(form) {
      var propertiesConfig = form.propertiesConfig;
      var controls = [];
      function checkFields(fields) {
        _.each(fields, function(field, key) {
          if (!field.fields) {
            if (field.type && field.type === "richtext") {
              controls.push(key);
            }
          } else {
            if (field.fields) {
              checkFields(field.fields);
            }
          }
        });
      }
      _.each(propertiesConfig, function(content) {
        if (content.options && content.options.fields) {
          checkFields(content.options.fields);
        }
      });
      return controls;
    },
    getForm: function() {
      var properties = this.getFormValues();
      var formCopy = this.createFormConfig(this.options);
      for (var i = 0; i < formCopy.propertiesConfig.length; i++) {
        var config = formCopy.propertiesConfig[i];
        this.setValues(config.data, properties);
      }
      return formCopy;
    },
    isValidForm: function() {
      if (this.rendered) {
        return this.isValid;
      }
    },
    validate: function() {
      return this.validateAllForms(false, true);
    },
    clear: function() {
      var properties = this.getFormValues();
      var originalForm = this.createFormConfig(this.options, true);
      var formarr = [];
      for (var i = 0; i < originalForm.propertiesConfig.length; i++) {
        originalForm.propertiesConfig[i].node = this.options.node;
        formarr.push(new D2GeneralFormModel(originalForm.propertiesConfig[i]));
      }
      var formFieldChanged = false;
      for (var key in properties) {
        if (properties[key]) {
          formFieldChanged = true;
          break;
        }
      }
      if (formFieldChanged) {
        this.formFieldChanged = true;
      }
      this.collection.reset(formarr);
      this.collection.fetched = true;
    }
  });
  return QueryFormPanelView;
});