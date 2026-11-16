/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "i18n", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "d2/widgets/metadata/utils/form.converter", "d2/widgets/metadata/general.panels/d2/d2.general.form.model", "d2/controls/form/d2.form.view", "d2/dialogs/mass.update/mass.update.flyout/mass.update.flyout.view", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "csui/behaviors/keyboard.navigation/tabables.behavior", "d2/utils/constants", "i18n!d2/dialogs/mass.update/impl/nls/lang", "hbs!d2/dialogs/mass.update/mass.update.options.dialog/impl/mass.update.options.dialog", "css!d2/dialogs/mass.update/mass.update.options.dialog/impl/mass.update.options.dialog" ], function(i18n, _, $, Marionette, FormConverter, D2GeneralFormModel, D2FormView, MassUpdateFlyoutView, PerfectScrollingBehavior, TabablesBehavior, constants, lang, template) {
  var DICT_MASSUPDATE_OPTIONS = Object.freeze({
    file: {
      text: lang.LabelFileProperties,
      value: constants.MassUpdateOptions.FILE_PROPERTIES
    },
    folder: {
      text: lang.LabelFolderProperties,
      value: constants.MassUpdateOptions.FOLDER_PROPERTIES
    }
  }), ONLY_FILES_MESAAGE = {
    text: lang.LabelOnlyFileProperties,
    value: constants.MassUpdateOptions.FILE_PROPERTIES
  }, INCLUDE_OPTIONS = Object.freeze({
    all_versions: {
      text: lang.LabelIncludeAllVersions,
      value: constants.MassUpdateOptions.ALL_VERSIONS
    },
    sub_folders: {
      text: lang.LabelIncludeSubFolders,
      value: constants.MassUpdateOptions.SUB_FOLDERS
    },
    files_in_sub_folders: {
      text: lang.LabelIncludeFilesSubFolders,
      value: constants.MassUpdateOptions.FILES_IN_SUB_FOLDERS
    },
    virtual_documents: {
      text: lang.LabelIncludeVD,
      value: constants.MassUpdateOptions.VIRTUAL_DOCUMENTS
    },
    virtual_documents_descendants: {
      text: lang.LabelIncludeVDDescendants,
      value: constants.MassUpdateOptions.VIRTUAL_DOCUMENTS_DESCENDANTS
    }
  });
  var MassUpdateDialogView = Marionette.LayoutView.extend({
    className: "d2-massupdate-dialog-view",
    template: template,
    regions: {
      Region: "#d2-massupdate-form-wrapper"
    },
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: "#d2-massupdate-form-wrapper",
        suppressScrollX: true
      },
      TabablesBehavior: {
        behaviorClass: TabablesBehavior,
        recursiveNavigation: true,
        containTabFocus: true
      }
    },
    constructor: function MassUpdateDialogView(options) {
      options || (options = {});
      this.options = options;
      this.context = options.context;
      Marionette.LayoutView.prototype.constructor.apply(this, options);
      this.listenTo(this, "hide-popover", this.hidePopover);
    },
    onRender: function() {
      this.$el.addClass("csui-top-align-label");
      this._loadDialogFormView();
      this.Region.show(this.formView);
    },
    onShow: function() {
      var me = this, resizeFn = _.bind(this._doResize, this);
      $(window).on("resize", resizeFn);
      this.once("before:destroy", function() {
        $(window).off("resize", resizeFn);
      });
      setTimeout(function() {
        resizeFn();
        me._parentLayoutView().$el.find(".binf-modal-footer button:visible").first().trigger("focus");
      }, 300);
    },
    _doResize: function() {
      if (this._parentLayoutView()) {
        var extHeight = this._parentLayoutView().$el.find(".binf-modal-header").outerHeight(true) + this._parentLayoutView().$el.find(".binf-modal-footer").outerHeight(true) + 60;
        this._parentLayoutView().$el.find(".binf-modal-body").css("max-height", this._parentLayoutView().$el.height() - extHeight + "px");
        var newHeight = this._parentLayoutView().$el.find(".binf-modal-content").outerHeight(true);
        if (this._parentLayoutView().$el.height() !== 0) {
          this._parentLayoutView().$el.find(".binf-modal-dialog").css("margin-top", (this._parentLayoutView().$el.height() - newHeight) / 2 - 60 + "px");
        } else {
          var pageHeight = this.$el.parent().parent().parent().parent().parent().outerHeight();
          this._parentLayoutView().$el.find(".binf-modal-dialog").css("margin-top", (pageHeight - newHeight) / 2 + "px");
        }
        this.$el.find("#d2-massupdate-form-wrapper").perfectScrollbar("update");
      }
    },
    _loadDialogFormView: function() {
      this.FormModel = new D2GeneralFormModel({
        id: "mass-update-form"
      });
      if (this.options.selectionHasFiles && !this.options.selectionHasFolders) {
        this.options["update-types"] = ONLY_FILES_MESAAGE;
      } else {
        this.options["update-types"] = DICT_MASSUPDATE_OPTIONS.folder.value;
      }
      var dataSourceCallback = function(cb) {
        if (_.isFunction(cb)) {
          cb([ DICT_MASSUPDATE_OPTIONS.file, DICT_MASSUPDATE_OPTIONS.folder ]);
        }
      };
      var formModel = this._getSchema(this.options);
      formModel["options"]["fields"]["update-types"]["dataSource"] = dataSourceCallback;
      this.FormModel.set(formModel);
      this.formView = new D2FormView({
        model: this.FormModel,
        mode: "create",
        context: this.context,
        className: "d2-mass-update",
        templateWrapperClassName: "d2-mass-update-form-wrapper",
        initialActivationWeight: 2
      });
      this.listenTo(this.formView, {
        "change:field": this._setValue,
        "render:form": this._setValue
      });
    },
    _createVersionPopup: function() {
      var descendantsLabel = this.formView.$el.find("[value=" + constants.MassUpdateOptions.VIRTUAL_DOCUMENTS_DESCENDANTS + "] ~ .d2-checkbox-item-container label");
      descendantsLabel.append('<div class="version-info-popup" tabindex="0"></div>');
      this.versionPopup = descendantsLabel.find(".version-info-popup");
      this.versionPopup.on("click", this.onClickInfoIcon.bind(this));
      this.versionPopup.on("keyup", this.onKeyupInfoIcon.bind(this));
    },
    onKeyupInfoIcon: function(event) {
      switch (event.which) {
       case 13:
       case 32:
        this.onClickInfoIcon(event);
        break;

       case 27:
        if (this.preventEscape) {
          event.stopPropagation();
          event.preventDefault();
          this.preventEscape = false;
        }
        break;
      }
    },
    onClickInfoIcon: function(event) {
      event.stopPropagation();
      event.preventDefault();
      if (this.flyout && !this.preventToggle) {
        if (!this.versionPopup.data("binf.popover") || !this.versionPopup.data("binf.popover").options.content) {
          this.versionPopup.binf_popover("destroy");
          this.versionPopup.binf_popover(this.popoverOptions);
        }
        this.versionPopup.binf_popover("toggle");
        this.versionPopup.data("binf.popover").tip().hasClass("binf-in") && this.flyout.setFocus();
      } else if (!this.preventToggle) {
        this.showPopover(event);
      }
    },
    showPopover: function() {
      if (!this.flyout) {
        this.flyout = new MassUpdateFlyoutView({
          items: [ lang.notIncludeAllVersions ],
          originatingView: this
        });
        this.flyout.render();
        this.popoverOptions = {
          content: this.flyout.$el,
          html: true,
          container: $(".binf-modal.d2-mass-update-form"),
          template: '<div class="binf-popover d2-mass-update-info-flyout" role="tooltip"><div class="binf-arrow"></div><div class="binf-popover-content"></div></div>',
          placement: this._getPopoverPlacement(),
          trigger: "manual"
        };
        this.versionPopup.binf_popover(this.popoverOptions);
        this.versionPopup.binf_popover("show");
        this.flyout.setFocus();
        this.flyout.trigger("ensure:scrollbar");
      } else {
        if (!this.versionPopup.data("binf.popover") || !this.versionPopup.data("binf.popover").options.content) {
          this.versionPopup.binf_popover("destroy");
          this.versionPopup.binf_popover(this.popoverOptions);
        }
        this.versionPopup.binf_popover("toggle");
        this.versionPopup.data("binf.popover").tip().hasClass("binf-in") && this.flyout.setFocus();
      }
    },
    hidePopover: function(event) {
      event.stopPropagation();
      event.preventDefault();
      event.type !== "focusout" && this.versionPopup.data("binf.popover") && this.versionPopup.data("binf.popover").tip().hasClass("binf-in") && this.versionPopup.trigger("focus");
      this.versionPopup.binf_popover("hide");
      event.type === "keydown" && (this.preventEscape = true);
    },
    _getPopoverPlacement: function() {
      var offset = this.versionPopup.offset(), infoWidth = this.versionPopup.outerWidth(), calc_width = $(window).width() - (offset.left + infoWidth);
      return i18n.settings.rtl ? offset.left > 260 ? "left" : "right" : calc_width > 260 ? "right" : "left";
    },
    _setValue: function() {
      this.options["update-types"] = this.formView.getValues()["update-types"];
      this.options["form-data"] = this.formView.getValues();
      var ds = this._updateDataSourceOptions();
      var alpControl = this.formView.getAlpacaControlByPath("include-options");
      alpControl.fieldView.model.attributes.options.dataSource = function(cb) {
        if (_.isFunction(cb)) {
          cb(ds);
        }
      };
      alpControl.refresh();
      if (_.contains(this.options["form-data"]["include-options"], constants.MassUpdateOptions.ALL_VERSIONS) && _.contains(this.options["form-data"]["include-options"], constants.MassUpdateOptions.VIRTUAL_DOCUMENTS_DESCENDANTS)) {
        if (this.$el.find(".version-info-popup").length) {
          this.$el.find(".version-info-popup").removeClass("binf-hidden");
        } else {
          this._createVersionPopup();
        }
      } else {
        this.versionPopup && this.versionPopup.addClass("binf-hidden");
      }
      this._doResize();
    },
    _updateDataSourceOptions: function() {
      var dataSource = [];
      if (this.options["update-types"] === DICT_MASSUPDATE_OPTIONS.folder.value) {
        this.options.selectionHasFolders && dataSource.push(INCLUDE_OPTIONS.sub_folders);
      } else {
        this.options.selectionHasFiles && dataSource.push(INCLUDE_OPTIONS.all_versions);
        this.options.selectionHasFolders && dataSource.push(INCLUDE_OPTIONS.files_in_sub_folders);
        (this.options.selectionHasFolders || this.options.selectionHasVD) && dataSource.push(INCLUDE_OPTIONS.virtual_documents_descendants);
      }
      return dataSource;
    },
    _getSchema: function(options) {
      var dataSource = this._updateDataSourceOptions();
      var form = {
        id: "mass-update-form",
        data: {
          "update-types": options["update-types"]
        },
        schema: {
          id: "mass-update-form",
          initial_invalid: true,
          properties: {
            "update-types": {
              title: lang.dropdownLabel,
              type: "string",
              required: true
            },
            dummy: {},
            "include-options": {
              enum: _.map(dataSource, function(d) {
                return d.value;
              }),
              items: {
                type: "string"
              },
              type: "array"
            }
          }
        },
        options: {
          fields: {
            "update-types": {
              label: lang.dropdownLabel,
              type: "d2combo",
              removeDefaultNone: true,
              isEditable: false,
              hideInitValidationError: false,
              useDataSourceAsEnum: true,
              hidden: !options.selectionHasFolders
            },
            dummy: {
              hidden: !(options.selectionHasFiles && !options.selectionHasFolders)
            },
            "include-options": {
              dataSource: function(cb) {
                cb(dataSource);
              },
              hideInitValidationError: true,
              removeDefaultNone: true,
              type: "d2checkbox",
              useDataSourceAsEnum: true,
              hidden: false,
              readonly: false
            }
          }
        },
        expressions: {
          "include-options": {}
        }
      };
      if (options.selectionHasFiles && !options.selectionHasFolders) {
        form.schema.properties["update-types"] = {
          type: "string",
          required: false
        };
        form.options.fields["update-types"] = {
          type: "d2label",
          isEditable: false,
          hidden: true
        };
        form.schema.properties["dummy"] = {
          type: "string",
          required: false
        };
        form.options.fields["dummy"] = {
          type: "d2label",
          isEditable: false
        };
        form.data["update-types"] = ONLY_FILES_MESAAGE.value;
        this.options["update-types"] = ONLY_FILES_MESAAGE.value;
        form.data["dummy"] = ONLY_FILES_MESAAGE.text;
      }
      FormConverter.generateFormModelConfig([ form ]);
      return form;
    }
  });
  return MassUpdateDialogView;
});