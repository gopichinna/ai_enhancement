/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "csui/utils/commandhelper", "csui/utils/command.error", "csui/utils/nodesprites", "d2/commands/node.progress.command", "d2/commands/download", "d2/models/virtual.document.children", "d2/dialogs/reserve/confirm.dialog", "d2/utils/rest.linkrels", "dctmw/utils/utils", "d2/utils/vdoc.utils", "d2/ctf/ctfBridge", "d2/ctf/constants", "d2/utils/widget.constants", "i18n!d2/commands/nls/localized.strings" ], function(_, $, Backbone, CommandHelper, CommandError, NodeSprites, NodeProgressCommand, DownloadCommand, VirtualDocumentChildren, ConfirmDialog, RestLinkrels, utils, vdocUtils, ctfBridge, ctfConstants, widgetConstants, lang) {
  "use strict";
  var DownloadHelper = DownloadCommand.extend({
    getDownloadLink: function(node) {
      return RestLinkrels.getLink(node.get("links"), RestLinkrels.DOWNLOAD_URLS);
    }
  });
  return NodeProgressCommand.extend({
    defaults: {
      signature: "ReserveDoc",
      command_key: "ReserveDoc",
      name: lang.CommandNameReserve,
      pageLeavingWarning: lang.ReservePageLeavingWarning,
      scope: "multiple"
    },
    preProcess: function(status, options) {
      var me = this, nodes = CommandHelper.getAtLeastOneNode(status);
      if (status.collection && status.collection.widgetType === widgetConstants.D2.RELATIONS && status.nodes.length > 1) {
        status.nodes.model.prototype.idAttribute = "id";
        status.nodes.reset(status.nodes.models);
        status.nodes.model.prototype.idAttribute = "associate_id";
      }
      if (!options.connector) {
        options.connector = nodes.at(0).connector;
      }
      return me._validateCtfPath(options).then(function() {
        return me._doCheckoutPrecheck(status, options);
      });
    },
    doAction: function(node, options) {
      var deferred = $.Deferred(), blockedNode = _.find(options.blockedNodes, function(bNode) {
        return bNode.id === node.get("id");
      });
      if (blockedNode) {
        deferred.reject(new CommandError(blockedNode.message));
      } else {
        this._initiateDownload(node, options).done(function() {
          deferred.resolve();
        }).fail(deferred.reject);
      }
      return deferred.promise();
    },
    _initiateDownload: function(node, options) {
      var deferred = $.Deferred();
      var isCheckedout = node.get("reserved");
      if (isCheckedout) {
        this._performDownload(node, options).done(function() {
          deferred.resolve();
        }).fail(deferred.reject);
      } else {
        this._lockAndDownload(node, options).done(function() {
          deferred.resolve();
        }).fail(deferred.reject);
      }
      return deferred.promise();
    },
    _lockAndDownload: function(node, options) {
      var deferred = $.Deferred();
      var self = this;
      $.ajax(node.connector.extendAjaxOptions({
        url: RestLinkrels.getLink(node.precheckLinks, RestLinkrels.CHECKOUT),
        type: "PUT",
        success: function() {
          self._performDownload(node, options).done(function() {
            deferred.resolve();
          }).fail(deferred.reject);
        },
        error: function(xhr, textStatus, errorThrown) {
          var errMessage = utils.parseAjaxErrorAsString(xhr, textStatus, errorThrown);
          deferred.reject(errMessage);
        }
      }));
      return deferred.promise();
    },
    _performDownload: function(node, options) {
      var deferred = $.Deferred();
      var dlHelper = new DownloadHelper();
      var optype = ctfConstants.OpType.CHECKOUT;
      var data = {
        id: node.get("id"),
        filepath: dlHelper._getDownloadPathForWsCtf(optype)
      };
      if (!options.ignoreDownload && !_.isUndefined(dlHelper.getDownloadLink(node))) {
        if (ctfBridge.isCtfEnabled()) {
          var link = dlHelper.getDownloadLink(node);
          dlHelper.fetchDownloadUrls(node, link).done(function(downloadUrls, pageServingUrls, bravacsrSearchInfoUrl, bravacsrSearchInfoFallbackUrl, formats, pageCount, downloadLocationPath) {
            ctfBridge.publishIsDownloaded(data.id, downloadLocationPath.checkout, function(checkStatus) {
              optype = checkStatus.length > 0 ? ctfConstants.OpType.OPEN_CHECKEDOUT : ctfConstants.OpType.CHECKOUT;
              dlHelper._performDownloadUsingWsCtf(downloadUrls, node, optype, ctfConstants.Mode.EDIT, true, options.edit, false, downloadLocationPath.checkout).done(function() {
                deferred.resolve(node);
              }).fail(deferred.reject);
            });
          });
        } else {
          dlHelper._downloadContent(node).done(function() {
            deferred.resolve(node);
          }).fail(deferred.reject);
        }
      } else {
        deferred.resolve(node);
      }
      return deferred.promise();
    },
    handleResults: function(results, options) {
      var collection = options.collection, widgetConfig = {}, promises = [], refreshNode = true;
      if (options?.data?.refreshCheckoutState === "false") {
        refreshNode = false;
      }
      if (collection && collection.options) {
        widgetConfig.widgetType = collection.widgetType;
        widgetConfig.widgetName = collection.options.widgetName;
        widgetConfig.isDisableLocationColumn = collection.options.isDisableLocationColumn;
      }
      var reservedIds = [];
      _.each(results, function(result) {
        if (result instanceof Backbone.Model) {
          if (collection instanceof VirtualDocumentChildren) {
            var vdmList = vdocUtils.isVirtualDoc(result) ? vdocUtils.getVDMNumber(result) : vdocUtils.getParentVDMNumber(result);
            reservedIds.push(vdmList);
            promises.push(collection.refresh({
              vdmNumber: vdmList
            }));
          } else {
            reservedIds.push(result.get("id"));
            if (result.get("rObjectType") === "d2c_note") {
              result.collection.fetch({
                reload: true,
                skipSWCache: true
              });
            } else {
              result.collection.map(function(item) {
                if (result.get("id") === item.get("id")) {
                  if (refreshNode) {
                    promises.push(CommandHelper.refreshNode(item, widgetConfig));
                  }
                }
              });
            }
          }
        }
      });
      options.context.trigger("d2:objects:reserved", reservedIds);
      return $.whenAll.apply($, promises);
    },
    getMessageOptions: function() {
      return {
        oneFilePending: lang.ReservingOneItem,
        multiFilePending: lang.ReservingManyItems,
        oneFileSuccess: lang.ReserveOneItemSuccessMessage,
        multiFileSuccess: lang.ReserveManyItemsSuccessMessage,
        oneFileFailure: lang.ReserveOneItemFailMessage,
        multiFileOneFailure: lang.ReserveManyItemsOneFailMessage,
        multiFileFailure: lang.ReserveManyItemsFailMessage,
        someItemsStopped: lang.ReserveStopped,
        actionType: "RESERVE"
      };
    },
    _validateCtfPath: function(options) {
      const opType = options.opType ? options.opType : ctfConstants.OpType.CHECKOUT;
      const mode = options.mode ? options.mode : ctfConstants.Mode.EDIT;
      var deferred = $.Deferred(), updatePathFromUser = function() {
        dlHelper._publishDownloadPathForWsCtf("", mode, "", function success(path) {
          dlHelper._updateUserSettings(opType, path, options.connector).done(deferred.resolve).fail(function(error) {
            deferred.reject(new CommandError(error));
          });
        }, function error(err) {
          if (err) {
            deferred.reject(new Error(lang.SelectResourceFailMessage));
          } else {
            deferred.reject();
          }
        });
      };
      if (ctfBridge.isCtfEnabled() && !options.ignoreDownload) {
        var dlHelper = new DownloadHelper(), downloadPath = dlHelper._getDownloadPathForWsCtf(opType);
        if (downloadPath) {
          ctfBridge.publishCreateDirectory(downloadPath, function(isValid) {
            if (isValid) {
              deferred.resolve();
            } else {
              updatePathFromUser();
            }
          });
        } else {
          updatePathFromUser();
        }
      } else {
        deferred.resolve();
      }
      return deferred.promise();
    },
    _doCheckoutPrecheck: function(status, options) {
      var me = this, deferred = $.Deferred(), nodes = CommandHelper.getAtLeastOneNode(status), batchPayload = [];
      nodes.each(function(node) {
        if (!options.connector) {
          options.connector = node.connector;
        }
        var precheckurl = options.precheckUrlMap ? options.precheckUrlMap[node.get("id")] : "";
        batchPayload.push({
          id: node.get("id"),
          request: {
            method: "GET",
            uri: CommandHelper.getOriginalActionLink(node, me.get("signature"), RestLinkrels.CHECKOUT_PRECHECK) || precheckurl
          }
        });
      });
      utils.makeBatchAjaxCall({
        connector: options.connector,
        operations: batchPayload,
        continueOnError: true
      }).done(function(successList, errorList) {
        options.blockedNodes = [];
        var hasNonOkItems = false, allItems = _.map(batchPayload, function(payload) {
          var node, msg, item = _.find(successList, function(successItem) {
            return successItem.id === payload.id;
          });
          if (!item) {
            item = _.find(errorList, function(errorItem) {
              return errorItem.id === payload.id;
            });
            item.output.status = "ERROR";
          }
          if (item.output.status === "ERROR") {
            msg = utils.parseErrorAsString("object", item.output);
            options.blockedNodes.push({
              id: item.id,
              message: msg
            });
          } else {
            msg = item.output.message;
          }
          node = nodes.find(function(n) {
            return n.get("id") === item.id;
          });
          if (item.output.status !== "OK") {
            hasNonOkItems = true;
          }
          node.precheckLinks = item.output.links || node.get("links");
          return {
            id: item.id,
            name: node.get("name"),
            node: node,
            iconClass: NodeSprites.findByNode(node).get("className"),
            status: item.output.status,
            message: msg,
            links: item.output.links || []
          };
        });
        if (hasNonOkItems && options.suppressConfirmationDialog !== true) {
          if (utils.isMobile() && allItems.length === 1) {
            require([ "csui/dialogs/modal.alert/modal.alert" ], function(ModalAlert) {
              status.originatingView && status.originatingView.unblockActions();
              var hasNonErrorItems = _.some(allItems, function(item) {
                return item.status !== "ERROR";
              }), firstItem = allItems[0], message = firstItem.message, title = me.get("dialogTitle");
              ModalAlert.confirmWarning(function(result) {
                if (result) {
                  status.originatingView && status.originatingView.blockActions();
                  deferred.resolve(allItems);
                } else {
                  deferred.reject();
                }
              }, message, title, {
                buttons: {
                  labelYes: lang.MobileDialogReserveContinue,
                  labelNo: lang.MobileDialogReserveClose,
                  showYes: hasNonErrorItems,
                  showNo: true,
                  showCancel: false
                }
              });
            }, deferred.reject);
          } else {
            var dialog = new ConfirmDialog({
              title: me.get("dialogTitle"),
              checkoutItems: allItems
            });
            dialog.confirm().done(function(selectedItems) {
              status.nodes.reset(nodes.filter(function(node) {
                return _.any(selectedItems, function(item) {
                  return item.id === node.get("id");
                });
              }));
              deferred.resolve();
            }).fail(deferred.reject);
          }
        } else {
          deferred.resolve(allItems);
        }
      }).fail(function(xhr) {
        if (utils.isMobile()) {
          var errorDetails = utils.parseAjaxError(xhr);
          errorDetails.status = xhr.status;
          deferred.reject(errorDetails);
        } else {
          deferred.reject.apply(deferred, arguments);
        }
      });
      return deferred.promise();
    }
  });
});