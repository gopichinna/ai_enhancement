/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/lib/jsonpath", "nuc/utils/url", "csui/models/form", "d2/controls/globalmessage/globalmessage", "d2/controls/form/d2.form.view", "d2/widgets/metadata/general.panels/d2/d2.general.form.model", "d2/widgets/metadata/metadata.properties.view", "d2/widgets/metadata/utils/form.converter", "d2/utils/rest.linkrels", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/utils/form.utils", "hbs!d2/dialogs/create.folder/impl/properties.step", "i18n!d2/dialogs/create.folder/impl/nls/lang", "css!d2/dialogs/create.folder/impl/properties.step" ], function(_, $, Backbone, Marionette, jsonPath, Url, FormModel, GlobalMessage, D2FormView, D2GeneralFormModel, D2MetadataPropertiesView, MetadataConverter, RestLinkrels, WizardTabableRegionBehavior, FormUtils, template, lang) {
  "use strict";
  var NAME_FIELD = "object_name", TYPE_FIELD = "r_object_type";
  var TypeSelectionView = D2FormView.extend({
    constructor: function TypeSelectionView(options) {
      options || (options = {});
      var form = MetadataConverter.convertConfig(options.dialog, {
        actionMode: "create",
        layoutMode: "singleCol"
      });
      options.topAlignedLabel = true;
      options.model = new FormModel(form.propertiesConfig[0]);
      options.model.get("schema")["initial_invalid"] = true;
      options.mode = "create";
      D2FormView.prototype.constructor.call(this, options);
    }
  });
  var CreateFolderPropertiesView = D2MetadataPropertiesView.extend({
    constructor: function CreateFolderPropertiesView(options) {
      options.collection = new Backbone.Collection(_.map(options.propertyPageData.propertiesConfig, function(form) {
        form.node = options.node;
        var formModel = new D2GeneralFormModel(form);
        formModel.get("schema").initial_invalid = true;
        return formModel;
      }));
      options.collection.fetched = true;
      options.context = options.node.context;
      options.formMode = "create";
      options.action = "create";
      options.suppressAddProperties = true;
      D2MetadataPropertiesView.prototype.constructor.call(this, options);
      this.behaviors = _.extend({
        TabableRegion: {
          behaviorClass: WizardTabableRegionBehavior
        }
      }, this.behaviors);
    }
  });
  return Marionette.LayoutView.extend({
    className: "d2-create-folder-dialog",
    template: template,
    regions: {
      folderTypeArea: "> .folder-type-area",
      propertyPageArea: "> .property-page-area"
    },
    ui: {
      folderTypeArea: "> .folder-type-area"
    },
    onShow: function() {
      if (this.options.folderTypes.length > 1) {
        var typeSelectionForm = this._createFolderTypeSelectionForm();
        this.folderTypeView = new TypeSelectionView({
          dialog: typeSelectionForm
        });
        this.listenTo(this.folderTypeView, "render:form change:field", function() {
          this.onFolderTypeChange();
        }, this);
        this.folderTypeArea.show(this.folderTypeView);
      } else {
        this.ui.folderTypeArea.addClass("binf-hidden");
        this.onFolderTypeChange({
          folderType: this.options.folderTypes[0].name
        });
      }
    },
    next: function() {
      this.propView.validateAllForms(true).done(function(isValid) {
        this.valid = isValid;
        var wizard = this.options.wizard;
        wizard.refreshFooter();
        if (this.valid) {
          var map = this.propertyPageArea.currentView.getFormsValues();
          this._updatePropetiesMap(map, wizard.data.properties);
          wizard.close();
        }
      }.bind(this));
    },
    onFolderTypeChange: function(options) {
      var me = this, folderTypeVal;
      if (this.folderTypeView) {
        folderTypeVal = this.folderTypeView.getValues()["r_object_type"];
      } else {
        folderTypeVal = options.folderType;
      }
      me.options.wizard.data.properties = {};
      me.options.wizard.data.properties[TYPE_FIELD] = folderTypeVal;
      if (folderTypeVal === "") {
        me.propertyPageArea.reset();
      } else {
        me._loadPropertyPageData(folderTypeVal).done(function(propertyPageData) {
          me._setObjectName(propertyPageData.propertiesConfig);
          var options = _.extend({}, me.options, {
            propertyPageData: propertyPageData
          });
          me.propView = new CreateFolderPropertiesView(options);
          me.propertyPageArea.show(me.propView);
          me.listenTo(me.propView, "d2:metadata:formValidation", function(isValid) {
            me.valid = isValid;
            me.options.wizard.refreshFooter();
          });
          me.listenTo(me.propView, "render:forms", function() {
            me.propView.validateAllForms(false, true).done(function(isValid) {
              me.valid = isValid;
              me.options.wizard.refreshFooter();
              me.triggerMethod("step:rendered");
            });
          });
        }).fail(function(error) {
          GlobalMessage.showMessage("error", error);
          me.options.wizard.cancel();
        });
      }
    },
    isValidForm: function() {
      if (this.propView) {
        return this.valid;
      }
      return false;
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
    _loadPropertyPageData: function(folderType) {
      var deferred = $.Deferred();
      if (this.options.folderTypes.length === 1 && this.options.propertyPageData) {
        deferred.resolve(this.options.propertyPageData);
      } else {
        var node = this.options.node, url = RestLinkrels.getLink(node.get("links"), RestLinkrels.D2_FOLDER_CREATION_PROPERTY_PAGE);
        url = Url.appendQuery(url, Url.combineQueryString({
          type: folderType
        }));
        $.ajax(node.connector.extendAjaxOptions({
          url: url,
          success: function(response) {
            var data = MetadataConverter.convertConfig(response["page-content"], {
              actionMode: "create",
              layoutMode: "singleCol"
            });
            _.each(data.propertiesConfig, function(form) {
              if (form.schema) {
                var nameField = jsonPath(form.schema.properties, "$.." + NAME_FIELD);
                if (_.isArray(nameField)) {
                  nameField[0].required = true;
                }
              }
              if (form.expressions) {
                for (var key in form.expressions) {
                  if (Object.prototype.hasOwnProperty.call(form.expressions, key) && key.match(new RegExp("[.]?" + NAME_FIELD + "$"))) {
                    delete form.expressions[key].setRequired;
                  }
                }
              }
            });
            deferred.resolve(data);
          },
          error: function(request, textStatus, error) {
            deferred.reject(error);
          }
        }));
      }
      return deferred.promise();
    },
    _setObjectName: function(forms) {
      var name = this.options.node.get("name");
      if (name) {
        _.each(forms, function(form) {
          if (form.schema) {
            var objNameField = jsonPath(form.data, "$..[?(@." + NAME_FIELD + "===null || @." + NAME_FIELD + ")]");
            if (!objNameField && !_.isUndefined(form.data[NAME_FIELD])) {
              objNameField = [ form.data ];
            }
            if (objNameField && objNameField.length > 0) {
              objNameField[0][NAME_FIELD] = name;
            }
          }
        });
      }
    },
    _createFolderTypeSelectionForm: function() {
      var defType = this.options.defaultType, folderTypeList = [];
      _.each(this.options.folderTypes, function(type) {
        folderTypeList.push({
          value: type.name,
          text: type.label,
          s: type.name === defType
        });
      });
      return {
        dialog: {
          content: {
            combo: {
              id: "r_object_type",
              type: "combo",
              label: lang.FolderTypeLabel,
              order: 1,
              o: folderTypeList,
              condition_required: true,
              condition_enabled: true,
              autoselect_single: true
            }
          }
        }
      };
    },
    behaviors: {
      TabableRegion: {
        behaviorClass: WizardTabableRegionBehavior
      }
    }
  });
});