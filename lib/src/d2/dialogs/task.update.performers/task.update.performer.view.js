/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "nuc/lib/backbone", "nuc/utils/url", "csui/models/form", "csui/controls/form/pub.sub", "csui/controls/progressblocker/blocker", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/controls/form/d2.form.view", "d2/widgets/metadata/utils/form.converter", "dctmw/utils/utils", "d2/utils/task.utils", "d2/utils/combo.datasource.utils", "css!d2/dialogs/task.update.performers/impl/task.update.performer" ], function($, _, Marionette, Backbone, Url, FormModel, PubSub, BlockingView, PerfectScrollingBehavior, WizardTabableRegionBehavior, D2FormView, MetadataConverter, utils, taskUtils, ComboDataSourceUtils) {
  "use strict";
  var TaskUpdatePerformerView = D2FormView.extend({
    constructor: function TaskUpdatePerformerView(options) {
      this.updateCustomFieldId(options);
      this.node = options.task;
      var self = this, form = MetadataConverter.convertConfig(options.formResponse["page-content"], {
        actionMode: "create",
        layoutMode: "singleCol",
        extendFieldOptions: function(field, alpControl) {
          if (field && alpControl) {
            var fieldId = field.id, fieldOptions = {
              isExternal: field["is_external_alias"]
            };
            if (field["required_values_count_min"]) {
              fieldOptions["requiredMinCount"] = field["required_values_count_min"];
            }
            if (field["required_values_count_max"]) {
              fieldOptions["requiredMaxCount"] = field["required_values_count_max"];
            }
            _.extend(alpControl["options"]["fields"][fieldId], fieldOptions);
          }
          if (field && field["field_content_type"] && field["field_content_type"] === "USER_OR_GROUP" && (field["asynchronous"] || field["dependencies"])) {
            field["assistance_type"] = "custom";
            field.getDataSourceCallBack = function(attr, alpField) {
              var dfd = $.Deferred(), fieldOptions = alpField.options.ds, fieldView = alpField.fieldView, filter = fieldOptions && fieldOptions.filter || "", datasourceUrl = utils.buildLinkUrl(field);
              if (fieldOptions.dependencyOnControl.length && fieldOptions.view) {
                var dependenciesAsQueryStringMap = ComboDataSourceUtils.fetchDependencyMap(fieldOptions.dependencyOnControl, fieldOptions);
                datasourceUrl = Url.appendQuery(datasourceUrl, dependenciesAsQueryStringMap.join("&"));
              }
              taskUtils.getUserForTaskUpdatePerformer(options.task, datasourceUrl, filter).done(function(userResponse) {
                if (userResponse["has-more-records"]) {
                  fieldView.collection.hasMoreRecords = true;
                } else if (!filter) {
                  fieldView.allUserOptions = userResponse.options;
                  if (fieldOptions.dependencyOnControl.length === 0) {
                    field.asynchronous = false;
                    delete alpField.options.ds;
                  }
                }
                self.setUserData(userResponse.userData);
                dfd.resolve(fieldView.allUserOptions || userResponse.options);
              }).fail(dfd.reject);
              return dfd.promise();
            };
          }
        }
      });
      this.setUserData(options.formResponse["user-dump"]);
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
      return parentClassName + " d2-task-update-performers-form";
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
    isValidForm: function() {
      if (this.formRendered) {
        return this.formValidated;
      }
      return false;
    }
  });
  return TaskUpdatePerformerView;
});