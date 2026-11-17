/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/utils/url", "nuc/models/node/node.model", "csui/controls/form/fields/booleanfield.view", "d2/controls/globalmessage/globalmessage", "csui/utils/contexts/perspective/perspective.context", "d2/widgets/metadata/utils/form.converter", "d2/widgets/metadata/general.panels/d2/d2.general.form.model", "d2/controls/form/d2.form.view", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/dialogs/zipanddownload/zip.download.error.list/zip.download.error.layout.view", "dctmw/utils/utils", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "dctmw/server.adaptors/converters/node", "i18n!d2/dialogs/zipanddownload/impl/nls/lang", "hbs!d2/dialogs/zipanddownload/impl/zip.validation.dialog", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "css!d2/dialogs/zipanddownload/impl/zip.validation.dialog" ], function(_, $, Backbone, Marionette, Url, NodeModel, ToggleSwitchView, GlobalMessage, PerspectiveContext, FormConverter, D2GeneralFormModel, D2FormView, WizardTabableRegionBehavior, ZipErrorLayoutView, utils, RestResources, RestLinkrels, nodeConvertor, lang, template, PerfectScrollingBehavior) {
  "use strict";
  var ZipValidationDialogView = Marionette.LayoutView.extend({
    className: "d2-zip-validation-dialog-view",
    template: template,
    behaviors: {
      TabableRegionBehavior: {
        behaviorClass: WizardTabableRegionBehavior
      },
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: ".d2-zip-dialog-body-wrapper"
      }
    },
    regions: {
      formContainer: ".d2-zip-form-wrapper",
      subFolderSwitchControl: ".enable-sub-folder-switch",
      validationListContainer: ".d2-zip-error-list-container"
    },
    ui: {
      subFolderContainer: ".enable-sub-folder",
      subFolderSelectionControl: ".enable-sub-folder-switch",
      validationProgressContainer: ".d2-zip-validation-progress-container",
      downloadContainer: ".d2-zip-validation-download-container",
      validationListContainer: ".d2-zip-error-list-container",
      genericErrorContainer: ".d2-zip-generic-error-container",
      genericErrorMessage: ".generic-error-message",
      allFileDownloadBtn: ".d2-zip-validation-download-btn"
    },
    events: {
      "click @ui.allFileDownloadBtn": "_intiateDownload"
    },
    templateHelpers: function() {
      return {
        includeSubFolderLabel: lang.ZipIncludeSubFolder,
        folderInfoMessage: lang.FolderInfoMessage,
        labelProcessing: lang.labelProcessing,
        allFilesDownloaded: lang.allFilesDownloaded,
        download: lang.ZipSubmitStepLabel
      };
    },
    constructor: function ZipValidationDialogView(options) {
      Marionette.LayoutView.prototype.constructor.call(this, options);
      this.isValidForm = false;
      this.partialDownload = false;
      this._setupChildViews();
      this.listenTo(this, "step:active", _.bind(this._setFocus, this));
      this.listenTo(this, "refresh", _.bind(this._triggerChangeMethod, this));
      this.subfolderselection = this.options.folderLength === this.options.status.nodes.length;
      this.enableSubFolder = this.options.folderLength !== 0;
      this.validationRunning = false;
      this.statusNode = null;
    },
    _setFocus: function() {},
    _setupChildViews: function() {
      this._setupFormView();
      this._setupEnableSubFolder();
      this._setSubTitle();
    },
    _setupFormView: function() {
      var formModel = this._getFormSchema(this.options);
      this.FormModel = new D2GeneralFormModel({
        id: "d2-zip-form",
        actionMode: "edit",
        layoutMode: "singleCol"
      });
      this.FormModel.set(formModel);
      this.formView = new D2FormView({
        model: this.FormModel,
        mode: "create",
        context: this.context,
        topAlignedLabel: true,
        templateWrapperClassName: "d2-zip-form-wrapper",
        initialActivationWeight: 2
      });
      this.listenTo(this.formView, "change:field", function() {
        this.formView.validateForm(false, true).done(function(isValid) {
          this.isValidForm = isValid;
          this.refreshButtons();
        }.bind(this));
      }.bind(this));
      this.listenTo(this.formView, "render:form", function() {
        this.formView.validateForm(false, true).done(function(isValid) {
          this.isValidForm = isValid;
          this.refreshButtons();
        }.bind(this));
      }.bind(this));
    },
    _setupEnableSubFolder: function() {
      this.enableSubFolder = this.options.folderLength !== 0;
      this.subfolderselection = this.options.folderLength === this.options.status.nodes.length;
      if (this.enableSubFolder) {
        this.createSwitchView(this.subfolderselection, "enable_sub_folder", "error");
      }
    },
    _triggerChangeMethod: function() {
      this._setSubTitle();
      this._setupFormView();
      this._setupEnableSubFolder();
      this.onShow();
    },
    onShow: function() {
      this.ui.validationProgressContainer.hide();
      this.ui.genericErrorContainer.hide();
      this.ui.downloadContainer.hide();
      this._showChildViews();
      this._clearError();
      this.validateObjects(true, this.subfolderselection);
    },
    _showChildViews: function() {
      this.formContainer.show(this.formView);
      if (this.enableSubFolder) {
        this.subFolderSwitchControl.show(this.switchView);
      } else {
        this.ui.subFolderContainer.hide();
      }
    },
    isValid: function() {
      return this.isValidForm && this.partialDownload;
    },
    _setSubTitle: function(data) {
      var subTitle = data ? _.str.sformat(data["file-size"] > 1 ? data["file-count"] > 1 ? lang.stepSubTitleMB : lang.stepSubTitleSingleFileMB : data["file-count"] > 1 ? lang.stepSubTitleKB : lang.stepSubTitleSingleFileKB, data["file-count"], data["file-size"] > 1 ? data["file-size"] : data["file-size"] * 1024) : "";
      this.options.wizard.steps["zip_validation"].subTitle = subTitle;
      this.options.wizard.headerView.triggerMethod("dom:refresh");
    },
    _clearError: function() {},
    setError: function() {},
    _getFormSchema: function() {
      var defaultName = this.options.defaultName;
      defaultName = defaultName ? defaultName : lang.DefaultZipFileName;
      var form = {
        id: "d2-zip-form",
        data: {
          default_name: defaultName + ".zip"
        },
        schema: {
          id: "d2-zip-form",
          initial_invalid: true,
          properties: {
            default_name: {
              title: lang.ZipFileName,
              type: "string",
              required: true
            },
            encrypt_passphrase: {
              title: lang.ZipPassphrase,
              type: "string",
              required: false
            }
          }
        },
        options: {
          fields: {
            default_name: {
              label: lang.ZipFileName,
              type: "text",
              removeDefaultNone: true,
              isEditable: true,
              hideInitValidationError: false,
              title: lang.ZipPassphrase
            },
            encrypt_passphrase: {
              title: lang.ZipPassphrase,
              type: "d2password",
              isEditable: true,
              hideInitValidationError: false,
              placeholder: lang.ZipPassphrasePlaceholder,
              showOrHidePassword: true
            }
          }
        },
        expressions: {}
      };
      FormConverter.generateFormModelConfig([ form ]);
      return form;
    },
    refreshButtons: function() {
      if (this.options.wizard) {
        this.options.wizard.refreshFooter([ "next" ]);
      }
    },
    createSwitchView: function(switchData, key) {
      var self = this, switchModel = new Backbone.Model({
        data: switchData
      });
      this.switchView = new ToggleSwitchView({
        id: _.uniqueId(key),
        model: switchModel
      });
      this.listenTo(switchModel, "change:data", function(model, value) {
        self.onSwitchChange(value);
      });
    },
    onSwitchChange: function(value) {
      var self = this;
      self.validateObjects(false, value);
    },
    isMinimizable: function() {
      return this.validationRunning && this.options.wizard.isMinimizable();
    },
    minimize: function() {
      if (this.options.wizard && this.pendingDfd) {
        var defaultName = this.options.defaultName;
        defaultName = (defaultName ? defaultName : lang.DefaultZipFileName) + ".zip";
        var itemType = this.enableSubFolder ? this.subfolderselection ? "Folders" : "Items" : "Files";
        this.options.wizard.minimize({
          promise: this.pendingDfd.promise(),
          ProcessingHeaderTitle: _.str.sformat(lang["Processing" + itemType + "HeaderTitle"], defaultName),
          CompletedHeaderTitle: _.str.sformat(lang["Completed" + itemType + "HeaderTitle"], defaultName)
        });
      }
    },
    fetchErrorNodeModelData: function(errorNodes) {
      this.errorNodeCollection = new Backbone.Collection();
      let batchPayload = [], connector = this.options.status.nodes.first().connector, dfd = $.Deferred();
      if (errorNodes) {
        errorNodes.forEach(node => {
          batchPayload.push({
            id: "zip-download-error-nodes" + node.r_object_id,
            request: {
              method: "GET",
              uri: Url.combine(RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.SELF), "objects", node.r_object_id)
            }
          });
        });
        utils.makeBatchAjaxCall({
          connector: connector,
          operations: batchPayload
        }).done((successful, failed) => {
          if (failed && failed.length > 0) {
            dfd.reject();
          } else {
            _.each(successful, operation => {
              const data = operation.output;
              const nodeModel = new NodeModel(nodeConvertor.convertNode(data), {
                connector: connector
              });
              this.errorNodeCollection.add(nodeModel);
            });
            dfd.resolve();
          }
        });
      } else {
        dfd.resolve();
      }
      return dfd.promise();
    },
    validateObjects: function(firstTime, includeSubFolders) {
      var me = this;
      function parseValidateZipObjects(data) {
        me.statusNode = new Backbone.Model(data);
        me._setSubTitle(data);
        me.validationRunning = false;
        me.ui.validationProgressContainer.hide();
        me.partialDownload = !!data.warnings;
        me.isValidForm = data["file-count"] > 0;
        me.options.wizard.refreshFooter();
        if (!me.partialDownload && data["file-count"] > 0) {
          me.ui.downloadContainer.show();
        } else {
          if (me.partialDownload) {
            me.ui.downloadContainer.hide();
            me.showErrorList(data);
          }
        }
        if (!data.warnings && data["file-count"] === 0) {
          me._showGenericError(lang.emptyDownload, includeSubFolders);
        }
      }
      !firstTime && this.ui.subFolderSelectionControl.addClass("enable-sub-folder-disabled");
      this.validationRunning = true;
      me.ui.validationProgressContainer.show();
      this.ui.genericErrorContainer.hide();
      this.ui.downloadContainer.hide();
      me.hideErrorList();
      me.partialDownload = false;
      me.options.wizard.refreshFooter();
      var deferred = $.Deferred();
      var validationOptions = {};
      if (includeSubFolders) {
        validationOptions = {
          include_subfolders: includeSubFolders
        };
      }
      me.options.wizard.refreshFooter();
      this.pendingDfd = $.Deferred();
      this.options.dialog.validateZipDownloadObjects(validationOptions).always(function() {
        me.ui && me.ui.subFolderSelectionControl && me.ui.subFolderSelectionControl.removeClass("enable-sub-folder-disabled");
        me.pendingDfd.resolve();
      }).done(function(data) {
        me.fetchErrorNodeModelData(data.warnings).done(() => {
          parseValidateZipObjects(data);
          deferred.resolve();
        }).fail(() => {
          deferred.reject();
        });
      }).fail(function(error) {
        me._setSubTitle();
        me.validationRunning = false;
        me.ui.validationProgressContainer.hide();
        if (error.status === 400) {
          me._showGenericError(error.responseJSON.message, includeSubFolders);
        } else {
          GlobalMessage.showMessage("error", error.responseJSON.message, error.responseJSON.details);
        }
        me.options.wizard.refreshFooter();
        deferred.reject(error);
      });
      return deferred.promise();
    },
    _showGenericError: function(message, disableFolderSelection) {
      this.ui.genericErrorContainer.show();
      this.ui.genericErrorMessage.html(message);
      disableFolderSelection && this.ui.subFolderSelectionControl.addClass("enable-sub-folder-disabled");
    },
    showErrorList: function(data) {
      data = data || {};
      data.errorNodeModels = this.errorNodeCollection.models;
      var errorView = new ZipErrorLayoutView(data);
      this.validationListContainer.show(errorView);
      this.ui.validationListContainer.show();
    },
    hideErrorList: function() {
      this.ui.validationListContainer.hide();
    },
    _getSubmitOptions: function() {
      var returnObject = {
        default_name: this.formView.getValues()["default_name"],
        include_subfolders: this.switchView ? this.switchView.getValue() : false,
        status_node: this.statusNode
      };
      if (utils.isNonEmptyString(this.formView.getValues()["encrypt_passphrase"])) {
        returnObject["encrypt_passphrase"] = this.formView.getValues()["encrypt_passphrase"];
      }
      return returnObject;
    },
    _intiateDownload: function() {
      this.options.dialog.submitForm(this._getSubmitOptions());
    }
  });
  return ZipValidationDialogView;
});