/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/utils/url", "csui/utils/command.error", "csui/utils/commandhelper", "csui/dialogs/modal.alert/modal.alert", "csui/models/command", "d2/commands/download", "d2/utils/rest.linkrels", "d2/utils/constants", "i18n!d2/commands/nls/localized.strings" ], function(_, $, Url, CommandError, CommandHelper, Alert, CommandModel, DownloadCommand, RestLinkrels, constants, lang) {
  "use strict";
  var PrintCommand = CommandModel.extend({
    defaults: {
      signature: "D2-Print",
      command_key: "D2-Print",
      name: lang.CommandNamePrint,
      verb: lang.CommandVerbPrint,
      scope: "single"
    },
    execute: function(status, options) {
      status.suppressSuccessMessage = true;
      var node = CommandHelper.getJustOneNode(status);
      return this._printContent(node, options);
    },
    _printContent: function(node, options) {
      var me = this, deferred = $.Deferred();
      me.node = node;
      me.options = options ? options : {};
      me.fetchPrintUrl(node).done(function(printUrl) {
        DownloadCommand.prototype.fetchDownloadUrls.call(me, me.node, printUrl).done(function(printDownloadUrls) {
          DownloadCommand.prototype._performDownload.call(me, printDownloadUrls);
          deferred.resolve();
        }).fail(function(err) {
          deferred.reject(err);
        });
      }).fail(function(err) {
        deferred.reject(err);
      });
      return deferred.promise();
    },
    fetchPrintUrl: function(node) {
      var self = this;
      var deferred = $.Deferred(), href = CommandHelper.getOriginalActionLink(node, "D2-Print");
      if (!href) {
        deferred.reject(new CommandError("Missing linkrel for print action"));
      } else {
        $.ajax(node.connector.extendAjaxOptions({
          url: href,
          success: function(response) {
            var printUrl;
            if (response.isDialog) {
              self.launchPrintWizard(response, node).done(function(printOptions) {
                self.postPrintOptions(node, printOptions).done(function(printUrl) {
                  deferred.resolve(printUrl);
                }).fail(function(err) {
                  deferred.reject(err);
                });
              }).fail(function(err) {
                deferred.reject(err);
              });
            } else {
              printUrl = RestLinkrels.getLink(response.links, RestLinkrels.PRINT_URL);
              deferred.resolve(printUrl);
            }
          },
          error: function(request) {
            if (request.responseJSON.code === "E_RENDITION_NOT_AVAILABLE") {
              deferred.reject(Alert.showWarning(request.responseJSON.message, lang.NoRenditionAvailableFailMessage));
            } else {
              deferred.reject(new CommandError(request));
            }
          }
        }));
      }
      return deferred.promise();
    },
    launchPrintWizard: function(response, node) {
      var deferred = $.Deferred(), content = response.dialog_content.dialog.content, order = 1;
      _.mapObject(content, function(val, key) {
        var modifyContent = function(v) {
          v.order = order;
          if (key === "text") {
            v.property_type = "string";
          }
          v.condition_required_create = v.required;
          order++;
        };
        if (_.isArray(val)) {
          _.each(val, function(v) {
            modifyContent(v);
          });
        } else {
          modifyContent(val);
        }
      });
      require([ "d2/dialogs/print/print.wizard" ], function(PrintWizard) {
        var printWizard = new PrintWizard({
          content: response,
          node: node
        });
        printWizard.show().done(function(printOptions) {
          deferred.resolve(printOptions);
        }).fail(function(err) {
          deferred.reject(err);
        });
      }, function(error) {
        deferred.reject(error);
      });
      return deferred.promise();
    },
    postPrintOptions: function(node, controlledInputResponse) {
      var deferred = $.Deferred();
      var url = CommandHelper.getOriginalActionLink(node, "D2-Print"), options = {
        type: "POST",
        url: url,
        headers: {
          "Content-Type": constants.MediaTypes.DCTM_JSON
        },
        data: JSON.stringify(controlledInputResponse)
      };
      $.ajax(node.connector.extendAjaxOptions(options)).done(function(response) {
        deferred.resolve(RestLinkrels.getLink(response.links, RestLinkrels.PRINT_URL));
      }).fail(function(err) {
        deferred.reject(err);
      });
      return deferred.promise();
    }
  });
  return PrintCommand;
});