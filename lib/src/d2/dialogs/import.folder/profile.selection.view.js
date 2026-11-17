/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "csui/lib/alpaca/js/alpaca.lite", "d2/dialogs/new.file/custom.profile.view", "d2/dialogs/new.file/impl/profile.form.view", "d2/models/folder.structure.configs", "d2/dialogs/new.file/impl/profile.form.util", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "csui/controls/progressblocker/blocker", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/widgets/metadata/general.panels/d2/d2.general.form.model", "hbs!d2/dialogs/import.folder/impl/profile.selection", "css!d2/dialogs/import.folder/impl/profile.selection", "i18n!d2/dialogs/import.folder/impl/nls/lang", "d2/utils/rest.linkrels", "d2/models/creation.profile" ], function($, _, Marionette, Alpaca, CustomProfileView, ProfileFormView, FolderStructureCollection, profileFormUtil, PerfectScrollingBehavior, BlockingView, WizardTabableRegionBehavior, D2GeneralFormModel, template, ProfileSeelctionCss, lang, RestLinkrels, CreationProfile) {
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
  return CustomProfileView.extend({
    className: "d2-import-folder-profile-selection",
    template: template,
    regions: {
      folderSelectionSection: ".folder_selection_section",
      folderStructureSelectionSection: ".folder_structure_selection_section",
      categorySection: ".category_selection_section",
      dataSection: ".data_section"
    },
    ui: {
      folderSelectionSection: ".folder_selection_section",
      folderStructureSelectionSection: ".folder_structure_selection_section",
      categorySection: ".category_selection_section",
      separator: ".separator",
      dataSection: ".data_section"
    },
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
    constructor: function ProfileSelectionView(options) {
      options.showCustomNameField = false;
      this.folderStructureModel = new ConnectionLessFormModel({
        id: profileFormUtil.getFormIDs().FOLDER_STRUCTURE_FORM
      });
      CustomProfileView.prototype.constructor.apply(this, arguments);
      this.folderStructureCollection = options.folderStructureCollection || new FolderStructureCollection(undefined, {
        connector: this.connector,
        mode: this._contentMode,
        inheritableSourceNode: options.inheritableSourceNode,
        container: options.container
      });
    },
    onRender: function() {
      CustomProfileView.prototype.onRender.apply(this, arguments);
      var formSchema = profileFormUtil.getFolderSelectionFormSchema(this.options.importFixedFile);
      formSchema.data["folderSelection"] = this.options.files;
      this.folderSelectionModel = new D2GeneralFormModel(formSchema);
      if (!this.folderSelectionView) {
        this.folderSelectionView = new ProfileFormView({
          el: this.ui.folderSelectionSection[0],
          model: this.folderSelectionModel,
          mode: "create",
          context: this.context,
          className: "d2-file_import-custom_profile_selection",
          templateWrapperClassName: "d2-profile-name-form-wrapper",
          initialActivationWeight: 2
        });
        this.listenTo(this.folderSelectionView, {
          "change:field": this.validate,
          "invalid:field": this.validate
        });
        this.folderSelectionView.render();
        this.folderSelectionSection.attachView(this.folderSelectionView);
      }
      if (!this.folderStructureView) {
        this.folderStructureView = new ProfileFormView({
          el: this.ui.folderStructureSelectionSection[0],
          model: this.folderStructureModel,
          mode: "create",
          context: this.context,
          className: "d2-file_import-custom_profile_selection",
          templateWrapperClassName: "d2-profile-name-form-wrapper",
          initialActivationWeight: 2
        });
        this.listenToOnce(this.folderStructureView, "render:form", this.onFolderStructureViewInitialRender);
        this.listenTo(this.folderStructureView, {
          "change:field:folderStructure": this.onFolderStructureFieldValueChange,
          "invalid:field": this.onFolderStructureFieldValueChange
        });
        this.folderStructureView.render();
        this.folderStructureSelectionSection.attachView(this.folderStructureView);
      }
    },
    onFolderStructureViewInitialRender: function() {
      if (!this.folderStructureCollection.fetched) {
        this.blockActions();
        this.folderStructureCollection.fetch().done(function() {
          this.populateFolderStructureForm(true);
        }.bind(this)).fail(this.unblockUIAndDisableFooter.bind(this));
      } else {
        this.populateFolderStructureForm(false);
      }
    },
    populateFolderStructureForm: function(isBlockedUI) {
      var categoryOptions = this.folderStructureCollection.map(function(model) {
        return {
          text: model.get("title"),
          value: model.get("id")
        };
      });
      var dataSourceCallback = function(cb) {
        if (_.isFunction(cb)) {
          cb(categoryOptions);
        }
      };
      var formSchema = profileFormUtil.getFolderStructureFormSchema(), singleOptionData = categoryOptions.length === 1 && categoryOptions[0].value;
      formSchema["options"]["fields"]["folderStructure"]["dataSource"] = dataSourceCallback;
      formSchema["options"]["originatingView"] = this;
      if (singleOptionData) {
        formSchema["data"]["folderStructure"] = singleOptionData;
      }
      this.listenToOnce(this.folderStructureView, "render:form", function() {
        if (isBlockedUI) {
          this.unblockActions();
        }
        if (singleOptionData) {
          this.selectFolderConfig(singleOptionData);
        }
        this.triggerMethod("render:form:folderStructure");
      }.bind(this));
      this.folderStructureModel.set(formSchema);
    },
    onFolderStructureFieldValueChange: function(event) {
      if (event && event.value && this.configCollection.profile && event.value === this.configCollection.profile.get("id")) {
        return;
      }
      this.selectFolderConfig(event && event.value);
    },
    selectFolderConfig: function(folderStructureConfigId) {
      if (folderStructureConfigId) {
        var model = this.folderStructureCollection.findWhere({
          id: folderStructureConfigId
        });
        this.profileData.folderSelectionModel = model;
        this.displayVdocMessage(model);
        var profileModel = new CreationProfile({
          links: model.get("links")
        });
        profileModel.fetch().done(function() {
          this.profileCollection.reset([ profileModel ]);
          this.profileCollection.fetched = true;
          this.populateProfileNameForm(false);
        }.bind(this)).fail(this.unblockUIAndDisableFooter.bind(this));
      }
    },
    onProfileNameViewInitialRender: function() {
      return;
    },
    displayVdocMessage: function(folderSelectionModel) {
      var folderStructureCombo = this.folderStructureView.form.childrenByPropertyId["folderStructure"];
      if (folderStructureCombo) {
        $(folderStructureCombo.getFieldEl()).children(".d2-vdoc-message").remove();
        if (folderSelectionModel.get("properties")["convert_to_vd"]) {
          var messageTemplateDescriptor = folderStructureCombo.view.getTemplateDescriptor("message");
          if (messageTemplateDescriptor) {
            var messageElement = Alpaca.tmpl(messageTemplateDescriptor, {
              id: "vdocMessage",
              message: lang.Vdoc_Conversion_Message,
              view: folderStructureCombo.view
            });
            messageElement.removeClass("alpaca-message").addClass("d2-vdoc-message").attr("role", "alert");
            $(folderStructureCombo.getFieldEl()).append(messageElement);
          }
        }
      }
    },
    validate: function() {
      var validationStatus = false;
      if (this.folderSelectionView) {
        validationStatus = this.folderSelectionView.validate();
      }
      if (validationStatus && this.folderStructureView) {
        validationStatus = this.folderStructureView.validate();
      }
      if (validationStatus) {
        validationStatus = CustomProfileView.prototype.validate.apply(this, arguments);
      }
      this.updateFooterButtonState(!validationStatus);
      if (validationStatus) {
        var fileList = this.folderSelectionView.form.childrenByPropertyId["folderSelection"].fieldView.getValue();
        this.options.node.set("files", fileList);
        this.options.profileData.set("folder-structure-config-id", this.options.profileData.folderSelectionModel.get("id"));
      }
      return validationStatus;
    }
  });
});