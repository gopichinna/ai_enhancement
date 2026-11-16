/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/utils/url", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/utils/rest.linkrels", "dctmw/utils/utils", "d2/utils/form.utils", "d2/widgets/metadata/metadata.properties.view", "css!d2/dialogs/task.complete/impl/task.metadata.properties" ], function(_, Url, WizardTabableRegionBehavior, RestLinkrels, utils, FormUtils, D2MetadataPropertiesView) {
  "use strict";
  return D2MetadataPropertiesView.extend({
    className: function() {
      return D2MetadataPropertiesView.prototype.className.call(this) + " task-metadata-properties";
    },
    constructor: function TaskMetadataPropertiesView(options) {
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
      D2MetadataPropertiesView.prototype.constructor.call(this, options);
      this.allForms.layoutMode = "singleCol";
      this._updatePropertiesSource();
      this.listenTo(this, "render:forms", this.onRenderValidation).listenTo(this, "d2:metadata:formValidation", this.refreshButtons);
      this.options.wizard && this.options.wizard.blockActions();
    },
    onRenderForms: function() {
      if (utils.isMobile()) {
        this.$el.addClass("d2mobile-properties-wrapper");
        this.$el.find("div[role=tabpanel]").addClass("d2mobile-tabpanel d2mobile-tabpanel-edit");
      }
      if (D2MetadataPropertiesView.prototype.onRenderForms) {
        D2MetadataPropertiesView.prototype.onRenderForms.apply(this, arguments);
      }
    },
    _updatePropertiesSource: function() {
      if (!this.node) {
        return;
      }
      this.node.propertiesSource = {};
      this.node.propertiesSource.url = this.options.propertyPage;
    },
    _fetchForms: function() {
      var me = this;
      return this.allForms.fetch({
        success: function(metadataCollection) {
          _.each(me.allForms.models, function(model) {
            let fields = model.attributes.options.fields;
            me._setFormNodeIdsForFields(fields);
          });
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
    _setFormNodeIdsForFields: function(fields) {
      let me = this;
      _.each(Object.keys(fields), function(key) {
        let field = fields[key];
        if (field._d2Containertype) {
          me._setFormNodeIdsForFields(field.fields);
        } else {
          if (me?.options?.masterDocumentId && (field?.ds?.assistance_type === "dictionary" || field?.ds?.assistance_type === "dql" || field?.ds?.assistance_type === "java")) {
            field.d2FormNodeIds = [ me.options.masterDocumentId ];
          }
        }
        fields[key] = field;
      });
    },
    refreshButtons: function(isValid) {
      this.isFormValid = isValid;
      this.options.wizard.refreshFooter([ "next" ]);
    },
    onRenderValidation: function() {
      this.options.wizard && this.options.wizard.unblockActions();
      this.validateAllForms(false, true).done(function(isValid) {
        this.refreshButtons(isValid);
      }.bind(this));
    },
    isValid: function() {
      return this.isFormValid;
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
      var map = this.getFormsValues(), properties = {};
      this._updatePropertiesMap(map, properties);
      return properties;
    }
  });
});