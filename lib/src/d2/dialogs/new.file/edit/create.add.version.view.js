/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/marionette", "nuc/lib/backbone", "nuc/lib/underscore", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "csui/dialogs/file.open/file.open.dialog", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/dialogs/add.version/file.uploader", "d2/dialogs/add.version/add.version.utils", "d2/dialogs/new.file/edit/button.icon.layout.view", "d2/dialogs/new.file/edit/header.message.view", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "dctmw/utils/utils", "d2/utils/constants", "d2/utils/creation.utils", "d2/ctf/ctfBridge", "d2/ctf/utils", "hbs!d2/dialogs/new.file/edit/impl/create.add.version", "i18n!d2/dialogs/new.file/edit/impl/nls/lang", "css!d2/dialogs/new.file/edit/impl/create.add.version" ], function($, Marionette, Backbone, _, PerfectScrollingBehavior, FileOpenDialog, WizardTabableRegionBehavior, FileUploader, AddVersionUtils, ButtonIconLayoutView, HeaderMessageView, RestResources, RestLinkrels, utils, constants, CreationUtils, ctfBridge, ctfUtils, template, lang) {
  "use strict";
  return Marionette.LayoutView.extend({
    className: "d2-create-add-version",
    template: template,
    regions: {
      buttonRegion: ".button-region"
    },
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        suppressScrollX: true,
        scrollYMarginOffset: 15
      },
      TabableRegion: {
        behaviorClass: WizardTabableRegionBehavior
      }
    },
    constructor: function CreateAddVersionView() {
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      if (!this.options.downloadHelper.getDownloadLink(this.options.node)) {
        this.contentLessObject = true;
      }
      this.buttonIconLayoutView = new ButtonIconLayoutView({
        collection: new Backbone.Collection([ {
          id: "add_version_now",
          label: lang.AddVersionNow,
          iconClass: "d2-icon-add-version-now"
        }, {
          id: "add_version_later",
          label: lang.AddVersionLater,
          iconClass: "d2-icon-add-version-later"
        } ])
      });
      this.listenTo(this.buttonIconLayoutView, "button:click", this.onButtonClick);
    },
    onButtonClick: function(model) {
      switch (model.get("id")) {
       case "add_version_now":
        this.onClickAddVersionNow();
        break;

       case "add_version_later":
        this.onClickAddVersionLater();
        break;
      }
    },
    getFileUploaderOptions: function(node, file) {
      var checkinurl = RestLinkrels.getLink(node.get("links"), RestLinkrels.D2_CHECKIN_URL), options = {
        node: node,
        file: file,
        data: {
          general: {}
        },
        config: {},
        checkinurl: checkinurl,
        ignoreCheckinConfig: true,
        hideProgress: true
      }, formatlist = AddVersionUtils.getFormats(file.name), defaultformat = AddVersionUtils.getDefaultFormat(formatlist);
      if (defaultformat) {
        options.data.general["a_content_type"] = defaultformat.value;
      }
      options.data.general["checkin_version"] = 2;
      return options;
    },
    onClickAddVersionNow: function() {
      if (ctfBridge.isCtfEnabled()) {
        this.getDownloadedFileForCheckin();
      } else {
        this.openFileSelectorForCheckin();
      }
    },
    checkinFileForDocument: function(file) {
      var fileValidation = CreationUtils.filterFiles(file);
      if (fileValidation.status === false && fileValidation.message) {
        this.prependMessage("error", fileValidation.message);
        return;
      }
      var node = this.options.node;
      node.contentUpdatedAfterEdit = true;
      this.options.checkinData.fileUploaderOptions = this.getFileUploaderOptions(node, file);
      this.options.wizard.nextStep();
    },
    openFileSelectorForCheckin: function() {
      var me = this, fileOpenDialog = new FileOpenDialog({
        multiple: false
      });
      fileOpenDialog.listenTo(fileOpenDialog, "add:files", function(files) {
        fileOpenDialog.destroy();
        me.checkinFileForDocument(files[0]);
      });
      fileOpenDialog.show();
    },
    getDownloadedFileForCheckin: function() {
      var me = this, node = this.options.node, pref = RestResources.getCurrentUser().get("preferences"), checkoutPath = pref[constants.UserSettings.DOWNLOAD_CHECKOUT_PATH];
      function getFileObject(fileObj) {
        var filePath = fileObj.file_path, fileSize = fileObj.file_size, filename = filePath && filePath.replace(/^.*[\\\/]/, ""), file;
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
      }
      function launchFileSelector() {
        var $backdrop = ctfUtils.getBackdropForFileUploader();
        ctfBridge.publishSelectFile(function(filearr) {
          $backdrop.remove();
          var file = getFileObject(filearr[0]);
          me.checkinFileForDocument(file);
        });
      }
      if (this.contentLessObject) {
        launchFileSelector();
      } else {
        ctfBridge.publishIsDownloaded(node.get("id"), checkoutPath, function(file_path) {
          if (file_path) {
            ctfBridge.publishGetFileSize(node.get("id"), checkoutPath, function(file_size) {
              var file = getFileObject({
                file_path: file_path,
                file_size: file_size
              });
              me.checkinFileForDocument(file);
            }, function() {
              launchFileSelector();
            });
          } else {
            launchFileSelector();
          }
        }, function() {
          launchFileSelector();
        });
      }
    },
    disableAddVersionNow: function() {
      var buttonView = this.buttonIconLayoutView.children.findByModel(this.buttonIconLayoutView.collection.findWhere({
        id: "add_version_now"
      }));
      buttonView.disable();
    },
    getNextStep: function() {
      if (this.options.action.isLinkedDoc === true) {
        return this.options.action.STEPS.UPLOADING_CONTENT;
      } else {
        return "finish";
      }
    },
    onClickAddVersionLater: function() {
      this.options.wizard.close();
    },
    getTitle: function() {
      return this.options.action.isLinkedDoc === true ? lang.AddVersionLinkDocumentTitle : lang.AddVersionTitle;
    },
    getCancelLabel: function() {
      return lang.CancelLabel;
    },
    onRender: function() {
      this.buttonRegion.show(this.buttonIconLayoutView);
      this.prependMessage("success", _.str.sformat(lang.CheckoutSuccess, this.options.node.get("name")));
      if (this.options.checkinData && this.options.checkinData.downloadError) {
        var errorMessage = this.getErrorMessage(this.options.checkinData.downloadError);
        this.prependMessage("error", errorMessage);
      } else if (this.contentLessObject) {
        this.prependMessage("warning", _.str.sformat(lang.ContentNotAvailableError, this.options.node.get("name")));
      }
    },
    prependMessage: function(mode, message) {
      this.$el.find(".d2-header-message-container." + mode).remove();
      if (mode && message) {
        var messageView = new HeaderMessageView({
          message: message,
          mode: mode
        });
        messageView.render();
        this.$el.prepend(messageView.$el);
      }
    },
    getErrorMessage: function(error) {
      var errorMessage;
      if (error) {
        if (_.isString(error)) {
          errorMessage = error;
        } else if (error.responseText) {
          errorMessage = utils.parseAjaxErrorAsString(error);
        } else if (error.message) {
          errorMessage = error.message;
        }
      }
      return errorMessage;
    },
    onShow: function() {
      this.$el.closest(".d2-wizard-step-view").css("top", "0");
    }
  });
});