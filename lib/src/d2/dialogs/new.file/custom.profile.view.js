/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "csui/controls/progressblocker/blocker", "nuc/models/node/node.model", "d2/widgets/metadata/general.panels/d2/d2.general.form.model", "d2/dialogs/new.file/impl/profile.form.view", "d2/dialogs/new.file/impl/profile.form.util", "d2/models/creation.profiles", "d2/models/creation.profile.value.configs", "d2/utils/constants", "dctmw/server.adaptors/converters/node", "d2/utils/creation.utils", "d2/controls/behaviors/wizard.tabable.region.behavior", "hbs!d2/dialogs/new.file/impl/custom.profile", "hbs!d2/dialogs/new.file/impl/custom.profile.error.banner", "i18n!d2/dialogs/new.file/impl/nls/lang", "css!d2/dialogs/new.file/impl/custom.profile" ], function(_, $, Backbone, Marionette, PerfectScrollingBehavior, BlockingView, NodeModel, D2GeneralFormModel, ProfileFormView, profileFormUtil, ProfileCollection, ValueConfigCollection, constants, nodeConverter, creationUtil, WizardTabableRegionBehavior, viewTemplate, errorTemplate, lang) {
  "use strict";
  var ConnectionLessFormModel = D2GeneralFormModel.extend({
    defaults: {
      data: {},
      schema: {
        properties: {}
      },
      options: {
        fields: {}
      },
      expressions: {}
    },
    fetch: function() {
      return $.Deferred().resolve();
    }
  });
  let ValueConfigErrorBannerView = Marionette.ItemView.extend({
    className: "d2-value-config-form-error",
    template: errorTemplate,
    constructor: function ValueConfigErrorBannerView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    initialize: function() {
      this.listenTo(this.model, "change", this.shouldShowValueConfigError);
    },
    templateHelpers: function() {
      return {
        errorMessage: this.model.get("errorMessage")
      };
    },
    shouldShowValueConfigError: function() {
      if (!this.model.get("error")) {
        this.$el.addClass("binf-hidden");
      } else {
        this.$el.removeClass("binf-hidden");
      }
    },
    onRender: function() {
      this.shouldShowValueConfigError();
    }
  });
  var CustomProfileView = Marionette.LayoutView.extend({
    className: "d2-newfile-custom_profile",
    regions: {
      categorySection: ".category_selection_section",
      dataSection: ".data_section",
      errorBanner: ".custom-profile-view-error-banner"
    },
    ui: {
      categorySection: ".category_selection_section",
      separator: ".separator",
      dataSection: ".data_section"
    },
    template: viewTemplate,
    behaviors: {
      TabableRegion: {
        behaviorClass: WizardTabableRegionBehavior
      },
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: "> .profile-scroll-container",
        suppressScrollX: true,
        scrollYMarginOffset: 15
      }
    },
    templateHelpers: function() {
      return {};
    },
    constructor: function CustomProfileView(options) {
      options = options || {};
      this.options = options;
      this.context = options.context;
      this.connector = this.context.getObject("connector");
      this.wizard = options.wizard;
      this._editMode = false;
      this._contentMode = options.mode || "create";
      this.profileData = options.profileData;
      this.isNextButtonDisabled = true;
      this.isLinkedDoc = options.isLinkedDoc;
      this.preselectFromProfileData = _.isBoolean(options.preselectFromProfileData) ? options.preselectFromProfileData : false;
      this.showCustomNameField = _.isBoolean(options.showCustomNameField) ? options.showCustomNameField : true;
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.profileFormModel = new ConnectionLessFormModel({
        id: profileFormUtil.getFormIDs().PROFILE_NAME_FORM
      });
      this.valueConfigFormModel = new ConnectionLessFormModel({
        id: profileFormUtil.getFormIDs().VALUE_CONFIG_FORM
      });
      this.profileCollection = options.profileCollection || new ProfileCollection(undefined, {
        connector: this.connector,
        mode: this._contentMode,
        inheritableSourceNode: options.inheritableSourceNode
      });
      this.configCollection = options.configCollection || new ValueConfigCollection(undefined, {
        connector: this.connector,
        mode: this.profileCollection.mode
      });
      this._prepareValueConfigErrorModel();
      if (this.wizard) {
        BlockingView.delegate(this, this.wizard);
      } else {
        BlockingView.imbue(this);
      }
      if (this.options.container && this.options.container.get("id")) {
        this._container = this.options.container.get("id");
      }
    },
    _prepareValueConfigErrorModel: function() {
      this.valueConfigErrorModel = new Backbone.Model();
      this.valueConfigErrorModel.set({
        error: false,
        errorMessage: lang.valueConfigErrorMessage
      }, {
        silent: true
      });
    },
    onRender: function() {
      if (this.options.topAlignedLabel !== false) {
        this.$el.addClass("csui-top-align-label");
      }
      if (!this.profileNameView) {
        this.profileNameView = new ProfileFormView({
          el: this.ui.categorySection[0],
          model: this.profileFormModel,
          mode: "create",
          context: this.context,
          className: "d2-file_import-custom_profile_selection",
          templateWrapperClassName: "d2-profile-name-form-wrapper",
          initialActivationWeight: 2
        });
        this.listenToOnce(this.profileNameView, "render:form", this.onProfileNameViewInitialRender);
        this.listenTo(this.profileNameView, {
          "change:field:profile": this.onProfileFieldValueChange,
          "invalid:field": this.onProfileFieldValueChange
        });
        this.profileNameView.render();
        this.categorySection.attachView(this.profileNameView);
      }
      if (!this.valueConfigView) {
        this.valueConfigFormModel.attributes["options"]["fields"]["dummyField"] = {};
        this.valueConfigView = new ProfileFormView({
          el: this.ui.dataSection[0],
          model: this.valueConfigFormModel,
          mode: "create",
          context: this.context,
          className: "d2-file_import-value_config_selection",
          templateWrapperClassName: "d2-value-config-form-wrapper",
          initialActivationWeight: 2
        });
        this.listenTo(this.valueConfigView, {
          "change:field": this.validate,
          "invalid:field": this.validate
        });
        this.valueConfigView.render();
        this.dataSection.attachView(this.valueConfigView);
      }
    },
    onBeforeDestroy: function() {
      if (this.profileNameView) {
        this.profileNameView.destroy();
      }
      if (this.valueConfigView) {
        this.valueConfigView.destroy();
      }
    },
    onProfileNameViewInitialRender: function() {
      if (!this.profileCollection.fetched) {
        this.blockActions();
        this.profileCollection.fetch().done(function() {
          this.populateProfileNameForm(true);
        }.bind(this)).fail(this.unblockUIAndDisableFooter.bind(this));
      } else {
        this.populateProfileNameForm(false);
      }
    },
    modifySingleOptionDataForCreationProfile: function(formSchema, singleOptionData) {
      return singleOptionData;
    },
    populateCustomValueConfigFormSchema: function(valueConfigFormSchema) {
      return valueConfigFormSchema;
    },
    populateProfileNameForm: function(isBlockedUI) {
      var categoryOptions = this.profileCollection.map(function(model) {
        return {
          text: model.get("name"),
          value: model.get("id")
        };
      });
      var dataSourceCallback = function(cb) {
        if (_.isFunction(cb)) {
          cb(categoryOptions);
        }
      };
      var formSchema = profileFormUtil.getProfileNameFormSchema(this.showCustomNameField, this.isEditMode()), referenceProfile = this.getReferenceProfile(), refProfileApplicable = referenceProfile && this.hasProfile(referenceProfile), singleOptionData = categoryOptions.length === 1 ? categoryOptions[0].value : refProfileApplicable ? referenceProfile.get("id") : null;
      formSchema["options"]["fields"]["profile"]["dataSource"] = dataSourceCallback;
      formSchema["options"]["originatingView"] = this;
      if (singleOptionData) {
        formSchema["data"]["profile"] = singleOptionData;
      }
      if (this.showCustomNameField && refProfileApplicable) {
        formSchema["data"]["custom_name"] = referenceProfile.get("custom_name");
        this.originalCustomName = referenceProfile.get("custom_name");
      }
      singleOptionData = this.modifySingleOptionDataForCreationProfile(formSchema, singleOptionData);
      this.listenToOnce(this.profileNameView, "render:form", function() {
        if (isBlockedUI) {
          this.unblockActions();
        }
        if (singleOptionData) {
          this.selectProfile(singleOptionData);
        }
        this.triggerMethod("render:form:profile");
      }.bind(this));
      this.profileFormModel.set(formSchema);
    },
    onProfileFieldValueChange: function(event) {
      if (event && event.value && this.configCollection.profile && event.value === this.configCollection.profile.get("id")) {
        return;
      }
      this.selectProfile(event && event.value);
    },
    _setUpValueConfigErrorBanner: function() {
      this.valueConfigErrorView = new ValueConfigErrorBannerView({
        model: this.valueConfigErrorModel
      });
      this.errorBanner?.show(this.valueConfigErrorView);
    },
    setUpValueConfigForm: function() {
      if (this.configCollection.length > 0) {
        this.populateValueConfigForm(true);
      } else {
        this.valueConfigErrorModel.set({
          error: true
        });
        this._setUpValueConfigErrorBanner();
      }
    },
    selectProfile: function(profileId) {
      var model = this.profileCollection.findWhere({
        id: profileId
      });
      if (model) {
        var refProfile = this.getReferenceProfile();
        if (refProfile && profileId === refProfile.get("id")) {
          model = refProfile;
        }
        if (!this.configCollection.fetched || this.configCollection.profile && model.get("id") !== this.configCollection.profile.get("id")) {
          this.configCollection.profile = model;
          this.blockActions();
          this.configCollection.fetch().done(function() {
            this.setUpValueConfigForm();
          }.bind(this)).fail(this.unblockUIAndDisableFooter.bind(this));
        } else {
          this.configCollection.profile = model;
          this.setUpValueConfigForm();
        }
      } else {
        if (this.valueConfigView) {
          this.ui.separator.addClass("binf-hidden");
          this.listenToOnce(this.valueConfigView, "render:form", function() {
            this.validate();
            this.triggerMethod("render:form:valueconfig");
          }.bind(this));
          this.valueConfigView.unSubscribe();
          this.valueConfigFormModel.clear({
            silent: true
          });
          this.valueConfigFormModel.set(new ConnectionLessFormModel({
            id: profileFormUtil.getFormIDs().VALUE_CONFIG_FORM
          }).attributes);
        } else {
          this.validate();
        }
      }
    },
    populateValueConfigForm: function(isBlockedUI) {
      var valueConfigFormSchema = profileFormUtil.getValueConfigFormSchema(this.configCollection, this.getSourceContentNode(true), this._contentMode, this.isEditMode());
      valueConfigFormSchema["options"]["originatingView"] = this;
      var valueConfigRef = this.getReferenceValueConfig();
      if (this.hasValueConfig(valueConfigRef)) {
        valueConfigRef = this.configCollection.find({
          id: valueConfigRef.get("id")
        });
        valueConfigRef.dictionaries.each(function(dictModel) {
          var fieldName = profileFormUtil.getFieldNameForDictionary(dictModel), fieldValue = dictModel.get("column_value");
          valueConfigFormSchema.data[fieldName] = fieldValue;
        });
        var refProfileData = this.getReferenceProfileData(), refProfile = this.getReferenceProfile();
        if (refProfileData && !refProfile.get("inheritanceHidden")) {
          valueConfigFormSchema.data["source_content"] = refProfileData.get("inherited-id") || "";
        }
      }
      this.originalSourceContentId = valueConfigFormSchema.data["source_content"];
      if (this.valueConfigView) {
        this.valueConfigView.unSubscribe();
      }
      this.listenToOnce(this.valueConfigView, "render:form", function() {
        if (isBlockedUI) {
          this.unblockActions();
        }
        this.validate();
        this.triggerMethod("render:form:valueconfig");
      }.bind(this));
      this.ui.separator.removeClass("binf-hidden");
      this.valueConfigFormModel.clear({
        silent: true
      });
      valueConfigFormSchema = this.populateCustomValueConfigFormSchema(valueConfigFormSchema);
      this.valueConfigFormModel.set(valueConfigFormSchema);
    },
    getReferenceProfileData: function() {
      if (this.preselectFromProfileData) {
        return this.profileData;
      }
      return null;
    },
    getReferenceProfile: function() {
      var refProfileData = this.getReferenceProfileData();
      return refProfileData && refProfileData.data;
    },
    hasProfile: function(profile) {
      return profile && this.profileCollection && !!this.profileCollection.find(function(pModel) {
        return pModel.get("id") === profile.get("id");
      });
    },
    getReferenceValueConfig: function() {
      var profileRef = this.getReferenceProfile();
      return profileRef && profileRef.get("valueConfig");
    },
    hasValueConfig: function(valueConfig) {
      return valueConfig && this.configCollection && !!this.configCollection.find(function(vModel) {
        return vModel.get("id") === valueConfig.get("id");
      });
    },
    validate: function() {
      var validationStatus = false, data, isConfigCollectionPresent = this.configCollection.length > 0;
      if (this.profileNameView) {
        validationStatus = this.profileNameView.validate();
      }
      if (isConfigCollectionPresent && validationStatus) {
        data = this.configCollection.profile.clone();
        data.isEdited = false;
        data.set("custom_name", this.profileNameView.getValues()["custom_name"], {
          silent: true
        });
        if (this.showCustomNameField && data.get("custom_name") === this.originalCustomName) {
          data.isDefaultCustomName = true;
        }
        if (!this.valueConfigView) {
          validationStatus = false;
        }
      }
      if (isConfigCollectionPresent && validationStatus) {
        var valueConfigData = this.valueConfigView.getValues(), sampleDictionary = this.configCollection.at(0).dictionaries;
        if (sampleDictionary.length > 0) {
          var selectedConfigModel = this.configCollection.find(function(configModel) {
            return configModel.dictionaries.all(function(dictModel) {
              var fieldName = profileFormUtil.getFieldNameForDictionary(dictModel);
              var fieldValue = valueConfigData[fieldName];
              return fieldValue === dictModel.get("column_value");
            });
          });
          if (selectedConfigModel) {
            data.set("valueConfig", selectedConfigModel);
          } else {
            validationStatus = false;
            data.unset("valueConfig");
          }
        } else {
          data.set("valueConfig", this.configCollection.at(0));
        }
        var hiddenInheritance = data.get("inheritanceHidden"), bluePrints = profileFormUtil.getBluePrintDictionary(), fieldBluePrint = this.valueConfigFormModel.get("options")["fields"]["blueprint_selection"], blueprintOptions = null, sourceContentId = null;
        fieldBluePrint && fieldBluePrint.dataSource(function(options) {
          blueprintOptions = options;
        });
        blueprintOptions = _.pluck(blueprintOptions, "value");
        if (!hiddenInheritance) {
          sourceContentId = valueConfigData["source_content"];
          _.each(_.keys(bluePrints), function(bpType) {
            var blueprint = bluePrints[bpType];
            data.set(blueprint.modelAttribute, _.contains(valueConfigData["blueprint_selection"], blueprint.value));
            if (_.contains(blueprintOptions, blueprint.value) && data.get(blueprint.modelAttribute) !== this.configCollection.profile.get(blueprint.modelAttribute)) {
              data.isEdited = true;
            }
          }.bind(this));
        } else {
          var sourceContentNode = this.getSourceContentNode();
          sourceContentId = sourceContentNode && sourceContentNode.get("id");
          _.each(_.keys(bluePrints), function(bpType) {
            var blueprint = bluePrints[bpType];
            if (!_.contains(blueprintOptions, blueprint.value)) {
              data.set(blueprint.modelAttribute, false);
            }
          });
        }
        data.set("inherited-id", sourceContentId);
        if (!data.isEdited && !hiddenInheritance && data.get("modifyInheritance")) {
          data.isEdited = sourceContentId !== this.originalSourceContentId;
        }
        if (this.options.container && this.options.container.get("id") && !nodeConverter.isNonDCTMNode(this.options.container)) {
          data.set("link-id", this.options.container.get("id"));
        }
        creationUtil.mapProfileModelToProfileData(data, this.profileData);
      }
      this.updateFooterButtonState(!validationStatus);
      return validationStatus;
    },
    unblockUIAndDisableFooter: function() {
      this.unblockActions();
      this.disableFooterButtons();
    },
    disableFooterButtons: function() {
      this.updateFooterButtonState(true);
    },
    updateFooterButtonState: function(isNextDisabled) {
      this.isNextButtonDisabled = isNextDisabled;
      this.options.wizard && this.options.wizard.refreshFooter();
    },
    getSourceContentNode: function(initialSourceContent) {
      if (initialSourceContent) {
        return this.options.inheritableSourceNode;
      }
      var valueConfigRef = this.getReferenceValueConfig(), isValidValueRef = this.hasValueConfig(valueConfigRef);
      if (isValidValueRef && this.isEditMode()) {
        var refProfileData = this.getReferenceProfileData();
        if (refProfileData && refProfileData.get("inherited-id")) {
          var props = {
            id: refProfileData.get("inherited-id")
          };
          nodeConverter.setNodeType(props);
          return new NodeModel(props, {
            connector: this.connector
          });
        } else {
          return null;
        }
      }
      return this.options.inheritableSourceNode;
    },
    getTitle: function() {
      return this.isLinkedDoc ? lang.customProfileTitleModeCreateLink : lang.customProfileTitleModeCreate;
    },
    isEditMode: function() {
      return this._editMode;
    },
    hasPropertyPage: function() {
      var valueConfig = this.profileData.data.get("valueConfig");
      return valueConfig && valueConfig.get("property_config") !== "";
    },
    onStepBeforeInactive: function() {
      this.profileNameView && this.profileNameView.triggerMethod("tabable:not");
      this.valueConfigView && this.valueConfigView.triggerMethod("tabable:not");
    }
  });
  return CustomProfileView;
});