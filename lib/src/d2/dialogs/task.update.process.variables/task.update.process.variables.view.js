/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "csui/models/form", "csui/controls/form/pub.sub", "csui/controls/progressblocker/blocker", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/controls/form/d2.form.view", "d2/widgets/metadata/utils/form.converter", "dctmw/utils/utils", "css!d2/dialogs/task.update.process.variables/impl/task.update.process.variables" ], function($, _, Marionette, FormModel, PubSub, BlockingView, PerfectScrollingBehavior, WizardTabableRegionBehavior, D2FormView, MetadataConverter, utils) {
  "use strict";
  var TaskUpdateProcessVariablesView = D2FormView.extend({
    constructor: function TaskUpdatePerformerView(options) {
      this.updateCustomFieldId(options);
      this.node = options.task;
      var pageContent = this.node.get("process_variables")["page-content"];
      var form = MetadataConverter.convertConfig(pageContent);
      this.nextButtonDisabled = true;
      options.topAlignedLabel = true;
      this._updateOptions(options);
      options.model = new FormModel(form.propertiesConfig[0]);
      options.model.get("schema")["initial_invalid"] = true;
      options.mode = "create";
      if (!options.supressBehavior) {
        _.extend(this.behaviors, {
          TabableRegion: {
            behaviorClass: WizardTabableRegionBehavior
          },
          PerfectScrolling: {
            behaviorClass: PerfectScrollingBehavior,
            suppressScrollX: true,
            scrollYMarginOffset: 15
          }
        });
      }
      D2FormView.prototype.constructor.call(this, options);
      _.extend(this.options, {
        dialogView: this
      });
      this.listenTo(this, "valid:field", this._raiseValidChangeEvent);
      this.listenTo(this, "invalid:field", this._raiseInvalidChangeEvent);
      this.listenTo(this, "d2:change:form:field", this.onFormFieldChange);
      this.listenTo(this, "d2:change:formValidation", this.onFormFieldChangeValidate);
      this.listenTo(this, "render:form", this.onFormRender);
      this.once("render:form", function() {
        this.unblockActions();
      });
      if (this.options.wizard) {
        BlockingView.delegate(this, this.options.wizard);
      } else {
        BlockingView.imbue(this);
      }
      this.blockActions();
    },
    className: function() {
      var parentClassName = D2FormView.prototype.className || "";
      if (_.isFunction(parentClassName)) {
        parentClassName = parentClassName.apply(this, arguments);
      }
      return parentClassName + " d2-task-update-process-variables-form";
    },
    getFormValueMap: function() {
      var formMap = this.getValues(), flatFormMap = this.getFlatFormValueMap(formMap);
      this.loookupCustomFieldId(flatFormMap);
      return flatFormMap;
    },
    getFlatFormValueMap: function(map) {
      var me = this, properties = {};
      _.each(map, function(value, key) {
        if (_.isArray(value)) {
          if (!_.isObject(value[0])) {
            properties[key] = value;
          } else {
            _.each(_.keys(value[0]), function(k) {
              properties[k] = _.pluck(value, k);
            });
          }
        } else if (!_.isObject(value)) {
          properties[key] = value;
        } else {
          _.extend(properties, me.getFlatFormValueMap(value));
        }
      });
      return properties;
    },
    updateCustomFieldId: function(options) {
      this.customFieldIdMap = {};
      var formDialog = options && options.formResponse && options.formResponse["page-content"] && options.formResponse["page-content"].dialog;
      if (formDialog) {
        this.updateFieldIds(formDialog);
      }
    },
    updateFieldIds: function(formObject) {
      if (formObject) {
        if (_.isArray(formObject)) {
          _.each(formObject, function(item) {
            this.updateFieldIds(item);
          }, this);
        } else if (_.isObject(formObject)) {
          _.each(formObject, function(value, key) {
            if (value) {
              if (key === "o") {
                return;
              } else if (key === "id" && _.isString(value)) {
                if (value.indexOf(".") >= 0) {
                  var customFieldId = value.replace(/\./g, "_");
                  formObject[key] = customFieldId;
                  this.customFieldIdMap[customFieldId] = value;
                }
              } else if ((key === "condition_enabled" || key === "condition_visible" || key === "condition_required" || key === "condition_validation") && _.isString(value)) {
                var regex = /(getValue\()([\.\w\-]*)(\))/g;
                formObject[key] = value.replace(regex, function(matchT) {
                  if (matchT.indexOf(".") >= 0) {
                    matchT = matchT.replace(/\./g, "_");
                  }
                  return matchT;
                });
              } else {
                this.updateFieldIds(value);
              }
            }
          }, this);
        }
      }
    },
    loookupCustomFieldId: function(formMap) {
      if (this.customFieldIdMap) {
        _.each(this.customFieldIdMap, function(value, key) {
          if (_.has(formMap, key)) {
            formMap[value] = formMap[key];
            delete formMap[key];
          }
        });
      }
    },
    onFormRender: function() {
      this.formRendered = true;
      this.onFormFieldValidate({
        refreshState: false,
        validateOnlyRequiredFields: true
      });
    },
    onFormFieldChange: function() {
      if (!this.options.ignoreFormChange) {
        this.formChanged = true;
        this.updateFooterButton();
      }
    },
    onFormFieldChangeValidate: function() {
      this.onFormFieldValidate({
        refreshState: false,
        validateOnlyRequiredFields: true
      });
    },
    onFormFieldValidate: function(options) {
      options = options || {};
      var dfd = $.Deferred(), refreshState = !!options.refreshState, validateOnlyRequiredFields = !!options.validateOnlyRequiredFields;
      this.validateForm(refreshState, validateOnlyRequiredFields).done(function(isValid) {
        this.formValidated = isValid;
        if (options.skipUpdateFooter !== true) {
          this.updateFooterButton();
        }
        if (isValid) {
          dfd.resolve();
        } else {
          dfd.reject();
        }
      }.bind(this));
      return dfd.promise();
    },
    updateFooterButton: function() {
      this.nextButtonDisabled = !((this.options.ignoreFormChange || this.formChanged) && this.formValidated);
      if (utils.isMobile()) {
        PubSub.trigger("d2:validate:update");
      }
      this.options.wizard && this.options.wizard.refreshFooter();
    },
    setUserData: function(usersDump) {
      if (usersDump && _.keys(usersDump).length > 0) {
        if (!this.userData) {
          this.userData = {};
        }
        _.extend(this.userData, usersDump);
      }
    },
    _updateOptions: function(options) {
      if (!options.originatingView) {
        options.originatingView = new Marionette.View();
      }
      if (!options.originatingView.isErrorMode) {
        options.originatingView.isErrorMode = function() {
          return false;
        };
      }
    },
    getAllFormValues: function() {
      var values = {};
      values["process_variables"] = this.getFormValueMap();
      return values;
    },
    isValid: function() {
      return this.isValidForm();
    },
    isValidForm: function() {
      if (this.formRendered) {
        return this.formValidated;
      }
      return false;
    }
  });
  return TaskUpdateProcessVariablesView;
});