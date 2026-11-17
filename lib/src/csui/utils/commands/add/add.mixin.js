/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "csui/lib/jquery", "csui/lib/underscore", "i18n!csui/utils/commands/nls/localized.strings", "csui/dialogs/file.open/file.open.dialog", "csui/utils/commands/compound.document/compound.document.util", "csui-ext!csui/utils/contexts/doc.upload.ext" ], function(require, $, _, lang, FileOpenDialog, CompoundDocumentsUtil, docUploadExt) {
  "use strict";
  var AddMixin = {
    mixin: function(prototype) {
      return _.extend(prototype, {
        _selectFilesForUpload: function(status, options) {
          var fileOpenDialog, deferred = $.Deferred();
          var container = status.container || options.container;
          if (container && container.get("type") === 136 && !container.get("fileOrder")) {
            CompoundDocumentsUtil.getOrderNextValue(container);
          }
          require([ "csui/controls/globalmessage/globalmessage" ], function(GlobalMessage) {
            if (GlobalMessage.isActionInProgress(options.actionType, lang.UploadNotAllowed, lang.CommandTitleAdd)) {
              return deferred.resolve();
            }
            fileOpenDialog = new FileOpenDialog({
              multiple: true
            });
            deferred.resolve();
            fileOpenDialog.listenTo(fileOpenDialog, "add:files", function(files) {
              require([ "csui/controls/fileupload/fileupload" ], function(fileUploadHelper) {
                deferred.resolve();
                const {
                  isEnabled,
                  execute
                } = docUploadExt?.[0] ?? {};
                const isExternalDocUpload = typeof isEnabled === "function" && isEnabled(status, options);
                if (isExternalDocUpload) {
                  typeof execute === "function" && execute(files, status, options);
                } else {
                  var uploadController = fileUploadHelper.newUpload(status, options);
                  uploadController.addFilesToUpload(files, {
                    collection: status.collection,
                    excludeAddVersion: options.excludeAddVersion,
                    excludeAddVersionforFolders: options.excludeAddVersion
                  });
                  uploadController.listenTo(uploadController, "destroy", function() {
                    fileOpenDialog.destroy();
                  });
                }
              });
            }).show();
          });
          return deferred.promise();
        },
        _getAddableTypeName: function(status, options) {
          if (options.addableTypeName) {
            return options.addableTypeName;
          }
          var addableType = status.data.addableTypes.findWhere({
            type: options.addableType
          });
          return addableType.get("type_name");
        }
      });
    }
  };
  return AddMixin;
});