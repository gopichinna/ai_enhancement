/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/backbone", "nuc/lib/underscore", "nuc/lib/jquery", "dctmw/utils/utils", "csui/models/command", "csui/utils/commandhelper", "d2/utils/download.manager", "nuc/utils/log", "csui/dialogs/modal.alert/modal.alert", "nuc/utils/url", "d2/utils/rest.linkrels", "i18n!d2/controls/form/impl/nls/lang", "i18n!d2/commands/nls/localized.strings" ], function(require, Backbone, _, $, utils, CommandModel, CommandHelper, DownloadManager, log, Alert, Url, RestLinkrels, lang, D2lang) {
  "use strict";
  return CommandModel.extend({
    defaults: {
      signature: "D2-Export",
      name: lang.CommandNameExport,
      scope: "single"
    },
    fileType: null,
    fileName: null,
    viewStatus: false,
    execute: function(status) {
      const self = this;
      const formContent = self._getExportDataForm();
      self.viewStatus = status.options.context.viewStateModel.getViewState("dropdown") !== "locations";
      require([ "dctmw/dialogs/modal.alert.custom.content/customizable.modal.alert", "d2/dialogs/export.collection/export.to.collection.view", "csui/controls/form/pub.sub", "d2/controls/tab.panel/impl/nls/root/lang", "css!d2/dialogs/export.collection/impl/export.to.collection.view" ], function(ModalAlert, ExportToCollectionView, PubSub, lang) {
        const modalView = getModalView(self);
        function getModalView(self) {
          return new ExportToCollectionView({
            context: status.options,
            collection: status.collection,
            formContent: formContent,
            signature: self.defaults.signature
          });
        }
        if (self.viewStatus) {
          modalView.$el.prepend(`<div class="date-note"><span class="icon csui-icon-notification-information24"></span>
                <span class="note-text" title="Note">` + lang.dateNote + `</span></div>`);
        }
        ModalAlert.showInformation(function(result) {
          if (result) {
            self._performDownload(self._getUrl(status));
          }
        }, "", D2lang.ExportDialogTitle, {
          buttons: {
            showYes: true,
            labelYes: D2lang.ExportActionLabel,
            showNo: true,
            labelNo: D2lang.CancelActionLabel,
            showCancel: false
          },
          contentView: modalView,
          showTitleIcon: false,
          modalClass: "export-file "
        });
        function getExportButton() {
          var $modelContent = $(".binf-modal-footer");
          return $modelContent.find("#btn-yes");
        }
        function enableYesButtton() {
          if (self.fileType.length > 0 && self.fileName.length > 0) {
            var $exportEnableButton = getExportButton();
            $exportEnableButton.removeAttr("disabled");
          } else {
            disableYesButtton();
          }
        }
        function disableYesButtton() {
          var $exportDisabledButton = getExportButton();
          $exportDisabledButton.prop("disabled", true);
        }
        function onFieldValueUpdate() {
          this.fileType = "XLSX";
          this.fileName = modalView.currentlyFocusedElement().value;
          enableYesButtton();
        }
        modalView.$el.last().append(`<div class="type-label-note">` + lang.exportType.replace("{0}", `<span class='text-bold'>.xlsx</span>`) + `</div>`);
        self.listenToOnce(PubSub, "dctm:custom:modal:alert:show", disableYesButtton);
        self.listenTo(modalView, "d2:change:formValidation", onFieldValueUpdate);
      });
    },
    _getUrl: function(status) {
      let url = null;
      if (this.viewStatus) {
        url = RestLinkrels.getLink(status.model.get("links"), RestLinkrels.D2_EXPORT_AUDIT);
      } else {
        url = RestLinkrels.getLink(status.model.get("links"), RestLinkrels.D2_EXPORT_LOCATIONS);
      }
      var queryParams = {
        file_name: this.fileName,
        export_type: this.fileType
      };
      return Url.appendQuery(url, Url.combineQueryString(queryParams));
    },
    _getExportDataForm: function() {
      const formDef = {
        dialog: {
          content: {
            id: "text123",
            text: {
              id: "export_audit_fileName",
              label: D2lang.ExportFormNameLabel,
              asynchronous: false,
              condition_required: true,
              order: 1,
              autoselect_single: true
            }
          }
        }
      };
      return formDef;
    },
    _performDownload: function(urls) {
      if (!urls) {
        return false;
      }
      DownloadManager.downloadFile(urls, function(event, doc) {
        var responseData;
        try {
          responseData = doc && JSON.parse($(doc).text());
        } catch (err) {
          log.error("Error while parsing response", err);
        }
        var msg = responseData ? utils.parseErrorAsString("object", responseData) : D2lang.DownloadFailMessage;
        Alert.showError(msg);
      }, this._downloadWindow);
    }
  });
});