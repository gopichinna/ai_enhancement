/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import BaseContentView from "d2/dialogs/new.file/edit/base.content.view";

import FileOpenDialog from "csui/dialogs/file.open/file.open.dialog";

import AddVersionUtils from "d2/dialogs/add.version/add.version.utils";

import RestResources from "dctmw/utils/rest.resources";

import RestLinkrels from "d2/utils/rest.linkrels";

import constants from "d2/utils/constants";

import CreationUtils from "d2/utils/creation.utils";

import ctfBridge from "d2/ctf/ctfBridge";

import ctfUtils from "d2/ctf/utils";

import lang from "i18n!d2/dialogs/new.file/edit/impl/nls/lang";

class CreateAddVersionView extends BaseContentView {
  constructor(options = {}) {
    super(options);
    if (!this.options.downloadHelper.getDownloadLink(this.options.node)) {
      this.contentLessObject = true;
    }
    this.renderMessage("success", _.str.sformat(lang.CheckoutSuccess, this.options.node.get("name")), lang.CheckoutInformationalMessage);
  }
  getFileUploaderOptions(node, file) {
    const checkinurl = RestLinkrels.getLink(node.get("links"), RestLinkrels.D2_CHECKIN_URL);
    const options = {
      node: node,
      file: file,
      data: {
        general: {}
      },
      config: {},
      checkinurl: checkinurl,
      ignoreCheckinConfig: true,
      hideProgress: true
    };
    const formatlist = AddVersionUtils.getFormats(file.name);
    const defaultformat = AddVersionUtils.getDefaultFormat(formatlist);
    if (defaultformat) {
      options.data.general["a_content_type"] = defaultformat.value;
    }
    options.data.general["checkin_version"] = 2;
    return options;
  }
  onClickAddVersionNow() {
    if (ctfBridge.isCtfEnabled()) {
      this.getDownloadedFileForCheckin();
    } else {
      this.openFileSelectorForCheckin();
    }
  }
  checkinFileForDocument(file) {
    const fileValidation = CreationUtils.filterFiles(file);
    if (fileValidation.status === false && fileValidation.message) {
      this.prependMessage("error", fileValidation.message);
      return;
    }
    const node = this.options.node;
    node.contentUpdatedAfterEdit = true;
    this.options.checkinData.fileUploaderOptions = this.getFileUploaderOptions(node, file);
    this.options.wizard.nextStep();
  }
  openFileSelectorForCheckin() {
    const fileOpenDialog = new FileOpenDialog({
      multiple: false
    });
    fileOpenDialog.listenTo(fileOpenDialog, "add:files", files => {
      fileOpenDialog.destroy();
      this.checkinFileForDocument(files[0]);
    });
    fileOpenDialog.show();
  }
  getDownloadedFileForCheckin() {
    const node = this.options.node;
    const pref = RestResources.getCurrentUser().get("preferences");
    const checkoutPath = pref[constants.UserSettings.DOWNLOAD_CHECKOUT_PATH];
    const getFileObject = fileObj => {
      const filePath = fileObj.file_path;
      const fileSize = fileObj.file_size;
      const filename = filePath && filePath.replace(/^.*[\\\/]/, "");
      let file;
      try {
        file = new File([ "" ], filename);
        file.path = filePath;
        file.size = fileSize;
      } catch (err) {
        file = {
          name: filename,
          path: filePath,
          size: fileSize
        };
      }
      return file;
    };
    const launchFileSelector = () => {
      const $backdrop = ctfUtils.getBackdropForFileUploader();
      ctfBridge.publishSelectFile(filearr => {
        $backdrop.remove();
        const file = getFileObject(filearr[0]);
        this.checkinFileForDocument(file);
      });
    };
    if (this.contentLessObject) {
      launchFileSelector();
    } else {
      ctfBridge.publishIsDownloaded(node.get("id"), checkoutPath, file_path => {
        if (file_path) {
          ctfBridge.publishGetFileSize(node.get("id"), checkoutPath, file_size => {
            const file = getFileObject({
              file_path: file_path,
              file_size: file_size
            });
            this.checkinFileForDocument(file);
          }, () => {
            launchFileSelector();
          });
        } else {
          launchFileSelector();
        }
      }, () => {
        launchFileSelector();
      });
    }
  }
  getNextStep() {
    if (this.options.action.isLinkedDoc === true) {
      return this.options.action.STEPS.UPLOADING_CONTENT;
    } else {
      return "finish";
    }
  }
  getTitle() {
    return this.options.action.isLinkedDoc === true ? lang.AddVersionLinkDocumentTitle : lang.AddVersionTitle;
  }
  getUploadButtonLabel() {
    return lang.UploadButtonLabel;
  }
  onRender() {
    if (this.options.checkinData && this.options.checkinData.downloadError) {
      const errorMessage = this.getErrorMessage(this.options.checkinData.downloadError);
      this.prependMessage("error", errorMessage);
    } else if (this.contentLessObject) {
      this.prependMessage("warning", _.str.sformat(lang.ContentNotAvailableError, this.options.node.get("name")));
    }
  }
}

Object.defineProperty(CreateAddVersionView.prototype.constructor, "name", {
  value: "CreateAddVersionView"
});

export default CreateAddVersionView;