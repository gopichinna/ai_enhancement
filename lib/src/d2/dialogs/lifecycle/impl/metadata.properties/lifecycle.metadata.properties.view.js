/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/utils/url", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/utils/rest.linkrels", "dctmw/utils/utils", "d2/widgets/metadata/metadata.properties.view", "d2/utils/form.utils", "i18n!d2/dialogs/lifecycle/impl/nls/lang", "css!d2/dialogs/lifecycle/impl/metadata.properties/lifecycle.metadata.properties" ], function(_, $, Url, WizardTabableRegionBehavior, RestLinkrels, utils, D2MetadataPropertiesView, FormUtils, lang) {
  "use strict";
  return D2MetadataPropertiesView.extend({
    className: function() {
      return D2MetadataPropertiesView.prototype.className.call(this) + " lifecycle-metadata-properties";
    },
    constructor: function LifecycleMetadataPropertiesView(options) {
      options = options || {};
      this.node = options.node;
      options.mode = "spy";
      options.action = "edit";
      options.formMode = "create";
      this.behaviors = _.extend({}, this.behaviors, {
        WizardTabableRegionBehavior: {
          behaviorClass: WizardTabableRegionBehavior
        }
      });
      if (this.node._changedFormValuesMap) {
        this.node._changedFormValuesMap.properties = {};
      }
      D2MetadataPropertiesView.prototype.constructor.call(this, options);
      this.allForms.layoutMode = this.getLayoutMode(this.options?.wizard?.options?.size);
      this.nextButtonDisabled = false;
      this._updatePropertiesSource();
      this.listenTo(this, "render:forms", this.onRenderValidation).listenTo(this, "d2:metadata:formValidation", this.onValidateForm);
      this.options.wizard && this.options.wizard.blockActions();
    },
    onRenderForms: function() {
      this._listenToFormValidationEvents();
      this.executePostRenderExpression();
      if (utils.isMobile()) {
        this.updateMobileTabsCss();
        this.$el.addClass("d2mobile-properties-wrapper");
        this.$el.find("div[role=tabpanel]").addClass("d2mobile-tabpanel d2mobile-tabpanel-edit");
      }
      var metadataPage = this.$el.closest(".cs-metadata");
      metadataPage.trigger("refresh:setcontainer");
    },
    _createEditModeView: function() {},
    _updatePropertiesSource: function() {
      if (!this.node) {
        return;
      }
      this.node.propertiesSource = {};
      this.node.propertiesSource.url = this.options.url;
      this.node.propertiesSource.body = {
        "object-ids": [ this.node.get("id") ],
        "property-page": this.options.propertyConfigName
      };
    },
    _fetchForms: function() {
      return this.allForms.fetch({
        success: function(metadataCollection) {
          var generalModel = metadataCollection.findWhere({
            id: "general"
          });
          if (generalModel) {
            var fields = generalModel.get("options") && generalModel.get("options").fields;
            if (fields && Object.keys(fields).length === 1 && Object.keys(fields)[0] === "queue_item_id") {
              metadataCollection.remove(generalModel);
            }
          }
        }
      });
    },
    onValidateForm: function(isValid) {
      if (isValid) {
        this.nextButtonDisabled = false;
        this.options.wizard && this.options.wizard.refreshFooter();
      } else {
        this.nextButtonDisabled = true;
        this.options.wizard.refreshFooter();
      }
    },
    onRenderValidation: function() {
      this.options.wizard && this.options.wizard.unblockActions();
      this.validateAllForms(false, true).done(function(isValid) {
        this.onValidateForm(isValid);
      }.bind(this));
    },
    validate: function() {
      var deferred = $.Deferred();
      this.validateAllForms(true).done(function(isValid) {
        if (isValid === false) {
          this.onValidateForm(isValid);
        }
        deferred.resolve(isValid);
      }.bind(this));
      return deferred.promise();
    },
    getItemModel: function() {
      return this.options.node;
    },
    isValid: function() {
      return !this.nextButtonDisabled;
    },
    getTitle: function() {
      if (this.options.wizard && this.options.wizard.data.status && this.options.wizard.data.status.isHomogeneousConfig) {
        return this.options.wizard.data.status.actionMenuLabel ? this.options.wizard.data.status.actionMenuLabel : lang.EditProperties_Title;
      } else {
        return this.options.node && this.options.node.lifeCycleStateConfig && this.options.node.lifeCycleStateConfig["menu-label"] ? _.str.sformat(lang.LCProperties_Title, this.options.node.lifeCycleStateConfig["menu-label"]) : lang.EditProperties_Title;
      }
    },
    _updatePropertiesMap: function(map, properties) {
      var me = this;
      _.each(map, function(value, key) {
        if (_.isArray(value)) {
          if (!_.isEmpty(value)) {
            if (!_.isObject(value[0])) {
              properties[key] = value;
            } else {
              var keys = _.keys(value[0]);
              FormUtils.removeEmptyRowsFromGridField(value);
              _.each(keys, function(k) {
                properties[k] = _.pluck(value, k);
              });
            }
          } else {
            properties[key] = [];
          }
        } else if (!_.isObject(value)) {
          properties[key] = value;
        } else {
          me._updatePropertiesMap(value, properties);
        }
      });
    },
    getFormValues: function() {
      var map = this.node._changedFormValuesMap.properties, properties = {};
      this._updatePropertiesMap(map, properties);
      return properties;
    }
  });
});