/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/widgets/metadata/metadata.properties.view", "d2/utils/creation.utils", "nuc/utils/base", "d2/utils/form.utils", "css!d2/dialogs/new.file/impl/profile.metadata.properties" ], function(_, $, WizardTabableRegionBehavior, D2MetadataPropertiesView, CreationsUtils, base, FormUtils) {
  "use strict";
  var ProfileMetadataPropertiesView = D2MetadataPropertiesView.extend({
    className: function() {
      return D2MetadataPropertiesView.prototype.className.call(this) + " profile-metadata-properties";
    },
    constructor: function ProfileMetadataPropertiesView(options) {
      this._validateOptions(options);
      this.parent = options.parent;
      this.operationType = options.operationType;
      this._initProfileMetadataProperties(options.node);
      options = _.extend({
        suppressAddProperties: true,
        blockingParentView: this.parent
      }, options);
      this.behaviors = _.extend({}, this.behaviors, {
        WizardTabableRegionBehavior: {
          behaviorClass: WizardTabableRegionBehavior
        }
      });
      D2MetadataPropertiesView.prototype.constructor.call(this, options);
      if (base.isIE11()) {
        this.keyboardBehavior.destroy();
      }
      this.allForms.layoutMode = this.getLayoutMode(this.options?.wizard?.options?.size);
      this.listenTo(this.options.node, "refresh:form:model", this._updatePropertiesSource).listenTo(this.allForms, "request", this._hideView).listenTo(this.allForms, "sync", this._showView).listenTo(this, "d2:metadata:formValidation", this.onValidateForm).listenTo(this, "d2:metadata:formFieldChange", this.onChangeFormField).listenTo(this, "render:forms", this.afterFormsRendered).listenTo(this, "multi.item:change", this._computeTablinkWidth);
    },
    afterFormsRendered: function() {
      this.getObjectNameField();
      this.triggerMethod("step:rendered");
      this.validateFormOnRender();
    },
    getObjectNameField: function() {
      var self = this;
      if (self.options.operationType === "import" && self.tabContent && self.tabContent.children) {
        self.tabContent.children.forEach(function(tabContentView) {
          var d2FormView = tabContentView.content;
          var sourceForm = d2FormView.getParentFormForControl("object_name");
          if (sourceForm && sourceForm._keyPathMap) {
            var keyPathMap = sourceForm._keyPathMap;
            if (_.has(keyPathMap, "object_name")) {
              var path = keyPathMap["object_name"].fieldPath;
              var objectNameControl = sourceForm.getAlpacaControlByPath(path);
              if (objectNameControl) {
                self.objectNameControl = objectNameControl;
                if (sourceForm.form && sourceForm.form.options && sourceForm.form.options.initialFieldValueMap && _.has(sourceForm.form.options.initialFieldValueMap, "object_name")) {
                  self.defaultObjectName = sourceForm.form.options.initialFieldValueMap["object_name"];
                }
                if (self.defaultObjectName !== self.getItemModel().get("name")) {
                  self.updateObjectName = true;
                }
              }
            }
          }
        });
      }
    },
    updateObjectNameFieldValue: function(value) {
      if (this.options.operationType === "import" && this.updateObjectName) {
        if (!value) {
          value = this.defaultObjectName;
        }
        if (this.objectNameControl && this.objectNameControl.fieldView) {
          this.objectNameControl.fieldView.setValue(value, true, true);
          if (this.objectNameControl.fieldView.ui && this.objectNameControl.fieldView.ui.writeField) {
            this.objectNameControl.fieldView.ui.writeField.val(value);
            this.objectNameControl.data = value;
            this.objectNameControl.fieldView.render();
          }
        }
      }
    },
    getAsyncFieldDefaultDataSourceObject: function(properties) {
      var asyncFieldDefaultDataSourceObject = {};
      var self = this;
      if (properties && self.options.operationType === "import" && self.tabContent && self.tabContent.children) {
        self.tabContent.children.forEach(function(tabContentView) {
          var d2FormView = tabContentView.content;
          for (var name in properties) {
            if (Object.prototype.hasOwnProperty.call(properties, name) && !_.has(asyncFieldDefaultDataSourceObject, name)) {
              var sourceForm = d2FormView.getParentFormForControl(name);
              if (sourceForm && sourceForm._keyPathMap) {
                var path = sourceForm._keyPathMap[name] && sourceForm._keyPathMap[name].fieldPath;
                var fieldControl = sourceForm.getAlpacaControlByPath(path);
                if (fieldControl) {
                  var propertyValue = properties[name], defaultDataSource;
                  if (_.isArray(fieldControl)) {
                    var asyncFieldDefaultDataSources = [];
                    _.each(fieldControl, function(field, index) {
                      defaultDataSource = self.getAsyncFieldDefaultDataSource(field, propertyValue[index]);
                      if (defaultDataSource) {
                        asyncFieldDefaultDataSources = asyncFieldDefaultDataSources.concat(defaultDataSource);
                      }
                    });
                    if (asyncFieldDefaultDataSources.length > 0) {
                      asyncFieldDefaultDataSourceObject[name] = asyncFieldDefaultDataSources;
                    }
                  } else {
                    defaultDataSource = self.getAsyncFieldDefaultDataSource(fieldControl, propertyValue);
                    if (defaultDataSource) {
                      asyncFieldDefaultDataSourceObject[name] = defaultDataSource;
                    }
                  }
                }
              }
            }
          }
        });
      }
      return asyncFieldDefaultDataSourceObject;
    },
    getDefaultObjectName: function() {
      return this.defaultObjectName;
    },
    getAsyncFieldDefaultDataSource: function(fieldControl, propertyValue) {
      if (propertyValue && fieldControl.options && fieldControl.options.ds && fieldControl.options.ds.async) {
        if (!_.isArray(propertyValue)) {
          propertyValue = [ propertyValue ];
        }
        var asyncFieldDefaultDataSource = _.select(fieldControl.selectOptions, function(item) {
          return _.contains(propertyValue, item.value);
        });
        return asyncFieldDefaultDataSource;
      }
    },
    onValidateForm: function(isValid) {
      if (this.parent) {
        this.parent.trigger("metadata:form:validation", isValid);
      }
    },
    onChangeFormField: function() {
      if (this.parent) {
        this.parent.trigger("metadata:form:field:change");
      }
    },
    onRenderValidation: function(isValid) {
      if (this.parent) {
        this.parent.trigger("metadata:form:render:validation", isValid);
      }
    },
    validateFormOnRender: function() {
      this.validateAllForms(false, true).done(function(isValid) {
        this.onRenderValidation(isValid);
      }.bind(this));
    },
    _validateOptions: function(options) {
      if (!options.parent) {
        throw Error("Parent View is undefined");
      }
      if (!options.node) {
        throw Error("Node Model is undefined");
      }
      if (!options.formMode) {
        throw Error("Form Mode is undefined");
      }
      if (!options.action) {
        throw Error("Action is undefined");
      }
      if (!options.operationType) {
        throw Error("Operation type is undefined");
      }
    },
    onBeforeShow: function() {
      this.refreshForms();
    },
    validate: function() {
      var deferred = $.Deferred();
      this.validateAllForms(true).done(function(isValid) {
        deferred.resolve(isValid);
      });
      return deferred;
    },
    getItemModel: function() {
      return this.options.node;
    },
    refreshForms: function() {
      if (this.propertiesSourceUpdated) {
        this.$el.removeClass("single-tab-hide");
        if (this.parent && this.parent.options) {
          CreationsUtils.updatePropertiesSourceInNode(this.options.node, this.operationType, this.parent.options.mode);
        } else {
          CreationsUtils.updatePropertiesSourceInNode(this.options.node, this.operationType);
        }
        this._fetchForms();
        this.propertiesSourceUpdated = false;
      } else if (this.options.node.propertiesForceFetch) {
        this.$el.removeClass("single-tab-hide");
        this._fetchForms();
      }
    },
    updateModelData: function() {
      var properties = {};
      var itemValueMap = this.getFormsValues();
      this._updatePropetiesMap(itemValueMap, properties);
      this.getItemModel().set("properties", properties);
    },
    fetchRequiredData: function() {
      var dfd = $.Deferred();
      dfd.resolve();
      return dfd.promise();
    },
    _showView: function() {
      if (this.$el.hasClass("binf-hidden")) {
        this.$el.removeClass("binf-hidden");
      }
    },
    _hideView: function() {
      this.$el.addClass("binf-hidden");
    },
    _updatePropetiesMap: function(map, properties) {
      var me = this;
      _.each(map, function(value, key) {
        if (_.isArray(value)) {
          if (!_.isObject(value[0])) {
            properties[key] = value;
          } else {
            var keys = _.keys(value[0]);
            FormUtils.removeEmptyRowsFromGridField(value);
            _.each(keys, function(k) {
              properties[k] = _.pluck(value, k);
            });
          }
        } else if (!_.isObject(value)) {
          properties[key] = value;
        } else {
          me._updatePropetiesMap(value, properties);
        }
      });
    },
    _initProfileMetadataProperties: function(nodeModel) {
      if (this.operationType === "create" || this.operationType === "import") {
        if (this.parent.options && this.parent.options.mode) {
          CreationsUtils.updatePropertiesSourceInNode(nodeModel, this.operationType, this.parent.options.mode);
        } else {
          CreationsUtils.updatePropertiesSourceInNode(nodeModel, this.operationType);
        }
      }
    },
    _updatePropertiesSource: function() {
      if (this.options.node) {
        this.propertiesSourceUpdated = true;
        this.options.node.propertiesForceFetch = false;
      }
    }
  });
  return ProfileMetadataPropertiesView;
});