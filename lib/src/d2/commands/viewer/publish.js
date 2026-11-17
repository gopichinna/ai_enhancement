/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/models/nodes", "d2/utils/constants", "csui/models/command", "d2/controls/globalmessage/globalmessage", "d2/dialogs/viewer/publish/impl/publish.fields.constant", "i18n!d2/commands/viewer/nls/lang" ], function(require, _, $, Backbone, NodeCollection, constants, CommandModel, GlobalMessage, PublishFieldsConstant, lang) {
  "use strict";
  const Publish = CommandModel.extend({
    defaults: {
      signature: "D2-PublishTo",
      command_key: "D2-PublishTo",
      name: "publishTo",
      scope: "single"
    },
    enabled: function(status) {
      return !(status && status.context && status.context.isEmbeddedMode === true);
    },
    execute: function(status, options) {
      const deferred = $.Deferred();
      this.options = options;
      this.status = status;
      this.publishDialogView = null;
      this.validForm = false;
      this.blockActions(status);
      require([ "csui/controls/side.panel/side.panel.view", "d2/dialogs/viewer/publish/viewer.publish.view" ], (SidePanelView, PublishDialogView) => {
        this._createPublishDialogView(status.context, SidePanelView, PublishDialogView);
        deferred.resolve();
      });
      this._simulateAjaxCall(status);
      return deferred.promise();
    },
    blockActions: function(status) {
      if (status && status.originatingView && status.originatingView.blockActions) {
        status.originatingView.blockActions();
      } else {
        $("div.load-container.csui-global").removeClass("binf-hidden");
      }
    },
    unblockActions: function(status) {
      if (status && status.originatingView && status.originatingView.unblockActions) {
        status.originatingView.unblockActions();
      } else {
        $("div.load-container.csui-global").addClass("binf-hidden");
      }
    },
    _simulateAjaxCall: function(status) {
      setTimeout(() => {
        this.unblockActions(status);
      }, 3e3);
    },
    _createPublishDialogView: function(context, SidePanelView, PublishDialogView) {
      const self = this;
      this.publishDialogView = new PublishDialogView({
        context: context,
        hideOption: this.options.hideOption,
        defaultLocationForNewFile: this.status.nodes.attributes.i_folder_id[0]
      });
      const sidePanel = new SidePanelView({
        layout: {
          header: true,
          footer: true,
          size: "medium"
        },
        title: lang.saveButtonLabel,
        ariaDescription: lang.noFooterAria,
        subTitle: "",
        content: this.publishDialogView,
        buttons: [ {
          id: "save",
          label: lang.saveButtonLabel,
          layout: {
            footer: true
          },
          disabled: () => !this.validForm,
          click: () => this._onSaveButtonClick()
        } ]
      });
      sidePanel.show();
      this.publishDialogView.on("change:buttonLabel", function(newLabel) {
        sidePanel.trigger("update:button", "save", {
          label: newLabel
        });
      });
      this.publishDialogView.on("valid:form", function(status) {
        self.validForm = status;
        sidePanel.trigger("update:button", "save", {
          disabled: !self.validForm
        });
      });
      this.publishDialogView.on("destroy", function() {
        sidePanel.hide();
      });
    },
    _onSaveButtonClick: function() {
      const selectedValues = this.publishDialogView.getValues().option;
      if (selectedValues[PublishFieldsConstant.publishOptions.RENDITION]?.length > 0) {
        this.publishDialogView.destroy();
        this.importRendition();
      } else if (selectedValues[PublishFieldsConstant.publishOptions.VERSION]?.length > 0) {
        this.publishDialogView.destroy();
        this.addVersion();
      } else if (selectedValues[PublishFieldsConstant.publishOptions.DOWNLOAD]?.length > 0) {
        this.downloadDocument();
      } else if (selectedValues[PublishFieldsConstant.publishOptions.NEW_FILE]?.length > 0) {
        this.publishDialogView.destroy();
        let fileNameWithExtension = selectedValues["input-file-name"];
        if (!fileNameWithExtension.includes(".") || !fileNameWithExtension.split(".").pop()) {
          fileNameWithExtension = fileNameWithExtension + "." + this.options.exportType;
        }
        const newFileParams = {
          folderId: selectedValues["folder-id"],
          name: fileNameWithExtension,
          size: this.options.size
        };
        this.createNewDocument(newFileParams);
      }
    },
    importRendition: function() {
      const {
        docUrl,
        docDownloadFileName,
        exportType,
        bearerToken
      } = this.options || {};
      const status = this.status;
      const encodedUrl = this.getEncodedDocUrl(docUrl);
      require([ "csui/utils/commands" ], function(commands) {
        const addRendition = commands?.get?.("D2-AddRendition");
        if (!addRendition) {
          GlobalMessage.showMessage("error", lang.publishOptionsErrorMessage);
          return;
        }
        if (typeof addRendition?.execute === "function") {
          addRendition.execute(status, {
            fileImportUrl: encodedUrl,
            docDownloadFileName: docDownloadFileName,
            exportType: exportType,
            bearerToken: bearerToken,
            suppressDialog: true
          });
        }
      });
    },
    addVersion: function() {
      const {
        docUrl,
        docDownloadFileName,
        exportType,
        bearerToken,
        size
      } = this.options || {};
      const status = this.status;
      status.nodes = new NodeCollection([ this.status.nodes ]);
      const encodedUrl = this.getEncodedDocUrl(docUrl);
      require([ "csui/utils/commands" ], function(commands) {
        const addVersion = commands?.get?.("AddVersion");
        if (!addVersion) {
          GlobalMessage.showMessage("error", lang.publishOptionsErrorMessage);
          return;
        }
        if (typeof addVersion?.execute === "function") {
          addVersion.execute(status, {
            fileImportUrl: encodedUrl,
            docDownloadFileName: docDownloadFileName,
            exportType: exportType,
            bearerToken: bearerToken,
            size: size,
            addVersionDialogExtraCssClass: "d2-iv-publish",
            checkinFixedFile: true,
            suppressDialog: true
          });
        }
      });
    },
    downloadDocument: function() {
      const self = this;
      $.ajax({
        url: self.options.docUrl,
        type: "GET",
        dataType: "binary",
        headers: {
          authorization: "Bearer " + self.options.bearerToken
        },
        success: function(response) {
          self._downloadBlob(response);
          self.unblockActions(status);
        },
        error: function() {
          self._showErrorMessage(lang.downloadErrorLog);
          self.unblockActions(status);
        }
      });
    },
    _downloadBlob: function(response) {
      const blob = new Blob([ response ], {
        type: response.type
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = this.options.docDownloadFileName;
      link.href = url;
      link.click();
      window.URL.revokeObjectURL(url);
    },
    createNewDocument: function(newFileParams) {
      const {
        docUrl,
        exportType,
        bearerToken
      } = this.options || {};
      const status = this.status;
      const encodedUrl = this.getEncodedDocUrl(docUrl);
      const newFileObj = new File([ new ArrayBuffer(newFileParams.size) ], newFileParams.name, {
        type: exportType
      });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(newFileObj);
      const fileImportObject = {
        files: dataTransfer.files,
        fileImportUrl: encodedUrl
      };
      require([ "csui/utils/commands" ], function(commands) {
        const createNewDocument = commands?.get?.("D2-ImportFile");
        if (!createNewDocument) {
          GlobalMessage.showMessage("error", lang.AddRenditionErrorMessage);
          return;
        }
        if (typeof createNewDocument?.execute === "function") {
          createNewDocument.execute(status, {
            fileImportObject: fileImportObject,
            targetLocation: newFileParams.folderId,
            bearerToken: bearerToken,
            importDialogExtraCssClass: "d2-iv-publish",
            fixedFileImport: true
          });
        }
      });
    },
    getEncodedDocUrl: function(docUrl) {
      if (!docUrl) return "";
      return docUrl ? docUrl.substring(0, docUrl.lastIndexOf("/") + 1) + encodeURIComponent(docUrl.substring(docUrl.lastIndexOf("/") + 1)) : "";
    },
    _showErrorMessage: function(message) {
      console.log(message);
    }
  });
  return Publish;
});