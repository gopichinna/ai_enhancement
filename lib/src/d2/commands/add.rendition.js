/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "csui/models/command", "csui/dialogs/file.open/file.open.dialog", "d2/controls/globalmessage/globalmessage", "csui/models/fileuploads", "dctmw/utils/rest.resources", "d2/utils/widget.constants", "d2/dialogs/add.version/add.version.utils", "i18n!d2/commands/nls/localized.strings" ], function(require, _, $, Backbone, CommandModel, FileOpenDialog, GlobalMessage, UploadFileCollection, RestResources, widgetConstants, AddVersionUtils, lang) {
  "use strict";
  return CommandModel.extend({
    defaults: {
      signature: "D2-AddRendition",
      command_key: "D2-AddRendition",
      name: lang.AddToRendition,
      scope: "single"
    },
    execute: function(status) {
      var me = this;
      var fileOpenDialog = new FileOpenDialog({
        multiple: false
      });
      fileOpenDialog.listenTo(fileOpenDialog, "add:files", function(files) {
        me.files = files;
        me.prepareImportCollection(status);
        fileOpenDialog.destroy();
        me._filterFileFormats();
        me._launchFileSelectorConfirmationDialog(status);
      });
      fileOpenDialog.show();
      return $.Deferred().resolve().promise();
    },
    prepareImportCollection: function(status) {
      var connector = status.context && status.context.getObject("connector");
      var importModels = {
        name: this.files[0].name,
        mime_type: this.files[0].type,
        state: "processing",
        count: 1,
        node: this.files[0],
        commandContainer: status.container,
        targetLocation: undefined,
        context: status.context
      };
      this.importCollection = new UploadFileCollection([ importModels ], {
        connector: connector
      });
      this.importCollection.map(importModel => {
        importModel.node = status.nodes.at(0);
        importModel.unset("node");
      });
    },
    _getFileFormats: function() {
      return this.formatsCollection;
    },
    _filterFileFormats: function() {
      var formats = RestResources.getFormats().where({
        is_hidden: false
      });
      this.formatsCollection = new Backbone.Collection();
      this.formatsCollection.comparator = "description";
      this.formatsCollection.add(formats);
    },
    _getFileName() {
      var fileName = this.files[0].name;
      var fileBaseName = fileName.substring(0, fileName.lastIndexOf("."));
      return fileBaseName;
    },
    _getFileExtension() {
      var formats = this._getFileFormats().where({
        mime_type: this.files[0].type
      });
      var fileFormatArr = [];
      for (let i = 0; i < formats.length; i++) {
        fileFormatArr.push({
          p: i,
          l: formats[i].get("description"),
          v: formats[i].get("name")
        });
      }
      return fileFormatArr;
    },
    getDataSourceCallbackForCombo: function() {
      var collectionData = [];
      _.map(this._getFileExtension(), function(data) {
        collectionData.push({
          value: data.v,
          text: data.l,
          s: data.s
        });
      });
      return collectionData;
    },
    _getFormats: function() {
      return AddVersionUtils.getFormats(this.files[0]?.name);
    },
    _getFormContent() {
      var self = this, collectionForm = {
        dialog: {
          content: {
            order: 1,
            "node-picker": {
              id: "file",
              label: lang.AddToRenditionFormLabelNodePicker,
              order: 1,
              isFileOpenDialog: true,
              value: self._getFileName()
            },
            combo: {
              id: "file_format",
              label: lang.AddToRenditionFormLabelCombo,
              assistance_type: "custom",
              order: 2,
              o: self._getFormats(),
              dependencyOnControl: "file"
            }
          }
        }
      };
      return collectionForm;
    },
    _getButtonsList: function() {
      var buttons = {
        showYes: true,
        labelYes: lang.AddItemButtonLabel,
        showNo: false,
        showCancel: true
      };
      return buttons;
    },
    showProgressPanel: function(status) {
      GlobalMessage.showProgressPanel(this.importCollection, {
        oneFileSuccess: lang.AddToRenditionOneSuccess,
        oneFilePending: lang.AddToRenditionOnePending,
        oneFileFailure: lang.AddToRenditionOneFailure,
        enableCancel: true,
        originatingView: status.originatingView,
        actionType: "UPLOAD_CONTENT",
        link_command_signature: "D2-Renditions",
        context: this.importCollection.at(0).context,
        gotoLocationLinkLabel: lang.AddToRenditionLinkLabel,
        configOptions: {
          enhancePanel: this.importCollection.length > 1
        },
        doAutoClose: true
      });
    },
    _launchFileSelectorConfirmationDialog: function(status) {
      var self = this, dfd = $.Deferred(), fieldValues = {};
      require([ "dctmw/dialogs/modal.alert.custom.content/customizable.modal.alert", "d2/dialogs/add.rendition/add.rendition.view" ], function(ModelAlert, AddRenditionView) {
        var modalView = getModalView(self);
        function getModalView(self) {
          return new AddRenditionView({
            formContent: () => self._getFormContent(),
            collection: status.collection,
            getDataSourceCallbackForCombo: () => self._getFormats(),
            signature: self.get("signature")
          });
        }
        function onFieldValueUpdate() {
          var modalValue = modalView.getValues();
          if (modalValue.file?.name && modalValue.file?.name !== self.files[0]?.name) {
            self.files = [ modalValue.file ];
          }
          if (_.isUndefined(modalValue.file) || _.isNull(modalValue.file)) {
            self.files = [];
          }
          fieldValues = {};
          fieldValues = {
            fileContent: {
              file: self.files[0],
              format: modalValue.file_format
            },
            nodeModel: status?.nodes?.models[0],
            signature: self.get("signature")
          };
        }
        self.listenTo(modalView, "d2:change:formValidation", onFieldValueUpdate);
        ModelAlert.confirmMessage(function(result) {
          if (result === true) {
            self.uploadRendition(status, fieldValues).done(() => {
              dfd.resolve();
            }).fail(() => {
              dfd.reject();
            });
          } else {
            dfd.reject(new Error());
          }
        }, "", lang.AddToRenditionModalHeader, {
          buttons: self._getButtonsList(),
          contentView: modalView,
          modalClass: self._getModalClassName()
        });
      });
      return dfd.promise();
    },
    _getModalClassName() {
      return "d2-add-to-rendition-model";
    },
    uploadRendition: function(status, fieldValues) {
      var dfd = $.Deferred(), self = this, isSameContainer = false;
      this.showProgressPanel(status);
      require([ "d2/utils/creation.utils" ], function(CreationUtils) {
        var defaultWidgets = RestResources.getCurrentUser().get("defaultWidgets"), isRenditionsWidgetEnabled = defaultWidgets && defaultWidgets[widgetConstants.DEFAULT.RENDITIONS] ? true : false, inRenditionsWidget = status?.context?.viewStateModel?.getViewState("dropdown") === "renditions" ? true : false;
        CreationUtils._getImportRenditionUrl(fieldValues).done(() => {
          isSameContainer = isRenditionsWidgetEnabled && !inRenditionsWidget ? true : undefined;
          self.handleUploadRenditionOperation({
            isSuccess: true,
            targetLocation: isSameContainer
          });
          status.originatingView.trigger("d2:add:rendition", status.nodes.models.at(0).get("id"));
          dfd.resolve();
        }).fail(error => {
          self.handleUploadRenditionOperation({
            isSuccess: false
          });
          dfd.reject(error);
        });
      });
      return dfd.promise();
    },
    handleUploadRenditionOperation: function(options) {
      this.importCollection.at(0).set({
        state: options.isSuccess ? "resolved" : "rejected",
        targetLocation: options.targetLocation
      });
    }
  });
});