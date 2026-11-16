/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "csui/models/fileuploads", "d2/controls/globalmessage/globalmessage", "csui/utils/commands/node", "csui/utils/commandhelper", "d2/commands/import.file", "d2/commands/vdoc/vdoc.mixin", "d2/utils/vdoc.creation.utils", "d2/utils/vdoc.utils", "i18n!d2/overrides/csui/controls/draganddrop/impl/nls/lang", "i18n!d2/commands/nls/localized.strings" ], function(_, $, UploadFileCollection, GlobalMessage, NodeCommand, CommandHelper, ImportFileCommand, VDocCommandMixin, VdocCreationUtils, vdUtils, lang, lang2) {
  "use strict";
  var VDocAddChildrenImport = ImportFileCommand.extend({
    defaults: {
      signature: "D2-VDocAddChildrenImport",
      command_key: "D2-VDocAddChildrenImport",
      name: lang2.CommandVDocAddChildrenImport,
      scope: "single"
    },
    _performActions: function(status, options) {
      var deferred = $.Deferred(), me = this, nodeCollection = status.nodeCollection, connector = status.context && status.context.getObject("connector");
      options.originatingView = status.originatingView;
      if (nodeCollection && nodeCollection.length) {
        var importModels = nodeCollection.map(function(node, index) {
          return {
            name: node.get("name"),
            mime_type: node.get("mime_type"),
            state: index === 0 ? "processing" : "pending",
            count: 0,
            total: 1,
            node: node,
            chronicle_id: node.get("i_chronicle_id"),
            context: status.context
          };
        });
        var importCollection = new UploadFileCollection(importModels, {
          connector: connector
        });
        var hasLinkedDocument = false, hasAttachments = false, childNodes = [], response = {}, parentNode = status.nodes.models[0];
        importCollection.each(function(importModel) {
          var node = importModel.get("node");
          childNodes.push(node);
          importModel.node = node;
          importModel.unset("node");
          if (node && node.linkedNodes && node.linkedNodes.length > 0) {
            hasLinkedDocument = true;
            if (node.qualifiedAsEmail) {
              hasAttachments = true;
            }
          }
        });
        me = this;
        response.importCollection = importCollection;
        var newStatus = _.defaults({
          nodes: importCollection
        }, status);
        newStatus.suppressMultipleSuccessMessage = true;
        newStatus.suppressMultipleFailMessage = true;
        NodeCommand.prototype._performActions.call(this, newStatus, options).done(function() {
          options.parentNode = parentNode;
          options.childNodes = childNodes;
          var msg;
          me.performVdocOperation(status, options).done(function(obj) {
            response.result = obj;
            var completeImportProcess = function() {
              var importCollection = response.importCollection;
              importCollection.each(function(importModel) {
                if (!options.replaceOperation) {
                  response.result["operation-status"].forEach(function(item) {
                    if (item["chronicle-id"] === importModel.get("chronicle_id")) {
                      if (item.status === "200") {
                        return {
                          errorMessage: ""
                        };
                      } else {
                        return {
                          errorMessage: item["rest-error"].details || item["rest-error"].message
                        };
                      }
                    }
                  });
                }
              });
              if (importCollection.length === 1) {
                var node = importCollection.models[0].node;
                if (!options.replaceOperation) {
                  msg = hasAttachments ? lang2.ImportOneItemSuccessMessageAttachments : hasLinkedDocument ? lang2.ImportOneItemSuccessMessageLD : lang2.ImportOneItemSuccessMessage;
                  GlobalMessage.showMessage("success", _.str.sformat(msg, node.get("name")));
                }
              } else {
                if (importCollection.pluck("state").indexOf("rejected") === -1) {
                  msg = hasAttachments ? lang2.ImportManyItemsSuccessMessageAttachments : hasLinkedDocument ? lang2.ImportManyItemsSuccessMessageLD : lang2.ImportManyItemsSuccessMessage;
                  GlobalMessage.showMessage("success", _.str.sformat(msg, importCollection.length));
                } else {
                  me.showProgressMessages(importCollection, hasAttachments, hasLinkedDocument);
                }
              }
              deferred.resolve();
            };
            if (response && response.result && response.result["operation-status"]) {
              var vdmNumber = vdUtils.getVDMNumber(parentNode);
              if (!vdUtils.isVirtualDoc(parentNode)) {
                vdmNumber = vdUtils.getParentVDMNumber(parentNode);
              }
              if (vdmNumber) {
                status.collection.refresh({
                  vdmNumber: vdmNumber
                }).done(function() {
                  status.collection.trigger("children:added", vdUtils.getVDMNumber(parentNode));
                  completeImportProcess();
                }).fail(function(err) {
                  me.showErrorMessage(lang2.VDocAddChildRefreshErrorMessage, parentNode);
                  deferred.reject(err);
                });
              } else {
                completeImportProcess();
              }
            } else {
              completeImportProcess();
            }
          }).fail(function(err) {
            me.showErrorMessage(err, parentNode);
            deferred.reject(err);
          });
        }).fail(function(args) {
          me.showErrorMessage(args, parentNode);
          deferred.reject(args);
        });
      } else {
        deferred.resolve();
      }
      return deferred.promise();
    },
    onCancel: function() {
      return GlobalMessage.showMessage("error", lang2.VDocAddChildNoneMessage);
    },
    performVdocOperation: function(status, options) {
      return VdocCreationUtils.addChildToVd(options.parentNode, options.childNodes, this.get("signature"));
    },
    showErrorMessage: function(error, node) {
      CommandHelper.showErrorPanel(node, this.getDefaultErrorMessage(), _.isString(error) ? error : error && error.responseJSON && (error.responseJSON.details || error.responseJSON.message));
    },
    getDefaultErrorMessage: function() {
      return lang2.VDocAddChildErrorMessage;
    }
  });
  VDocCommandMixin.mixin(VDocAddChildrenImport.prototype);
  return VDocAddChildrenImport;
});