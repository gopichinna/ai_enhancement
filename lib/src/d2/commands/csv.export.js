/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "csui/models/command", "csui/controls/globalmessage/globalmessage", "d2/utils/constants", "csui/dialogs/modal.alert/modal.alert", "d2/dialogs/zipanddownload/zip.download.utils", "i18n!d2/commands/nls/localized.strings", "i18n!d2/dialogs/zipanddownload/impl/nls/lang" ], function(require, $, _, Backbone, CommandModel, GlobalMessage, constants, ModalAlert, ZipDownloadUtils, lang, zipLang) {
  "use strict";
  return CommandModel.extend({
    defaults: {
      signature: "D2-CSV-Export",
      command_key: "D2-CSV-Export",
      name: lang.CommandNameCSVExport
    },
    execute: function(status) {
      var deferred = $.Deferred();
      var options = {};
      var me = this;
      var defaultName = ZipDownloadUtils._getDefaultZipFileName(status);
      var collection = status.originatingView.collection;
      var widgetOptions = ZipDownloadUtils._getWidgetOptions(collection);
      options["widget_name"] = widgetOptions.widget_name;
      options["widget_type"] = widgetOptions.widget_type;
      options["actionType"] = "d2_export_properties";
      options["include_only_manifest_file"] = true;
      options["default_name"] = defaultName ? defaultName : zipLang.DefaultZipFileName;
      require([ "csui/widgets/search.results/search.results.view" ], function(SearchResultsView) {
        if (status.originatingView instanceof SearchResultsView) {
          ZipDownloadUtils.getColumnInformation(options, status);
        }
      });
      this.onDownloadWithSubFolder(status).done(function(exportOptions) {
        me.initiateDownload(options, status, exportOptions?.exportWithSubFolder).done(function() {
          deferred.resolve();
        }).fail(function(request) {
          GlobalMessage.showMessage("error", request.responseJSON.message);
          deferred.reject();
        });
      }).fail(function(request) {
        GlobalMessage.showMessage("error", request.responseJSON.message);
        deferred.reject();
      });
      return deferred.promise();
    },
    initiateDownload: function(options, status, exportOptions) {
      var deferred = $.Deferred();
      options["include_subfolders"] = exportOptions;
      this.validateObjects(options, status).done(function(data) {
        options["status_node"] = new Backbone.Model(data);
        ZipDownloadUtils.initateZipDownload(options, status.nodes).done(function() {
          deferred.resolve();
        }).fail(deferred.reject);
      }).fail(deferred.reject);
      return deferred.promise();
    },
    containsFolder: function(status) {
      return ZipDownloadUtils.containsFolder(status);
    },
    onDownloadWithSubFolder: function(status) {
      var deferred = $.Deferred();
      var containsSubFolder = this.containsFolder(status);
      if (containsSubFolder) {
        var title = zipLang.ExportDefaultLabel;
        require([ "d2/dialogs/modal.export/exportDialog" ], function(exportDialog) {
          exportDialog.confirmQuestion(title, {
            isExportDialog: true,
            exportIncludeSubFolder: zipLang.ExportIncludeSubFolder,
            primaryButtonLabel: zipLang.ExportDownloadLabel
          }).done(deferred.resolve).fail(deferred.reject);
        });
      } else {
        deferred.resolve();
      }
      return deferred.promise();
    },
    validateObjects: function(options, status) {
      options.context = status.context;
      return ZipDownloadUtils.validateZipDownloadObjects(options, status.nodes);
    }
  });
});