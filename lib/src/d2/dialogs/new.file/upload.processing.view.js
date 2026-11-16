/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "csui/utils/taskqueue", "csui/utils/commandhelper", "d2/utils/rest.linkrels", "d2/utils/creation.utils", "d2/dialogs/new.file/o2.processing.view", "i18n!d2/dialogs/new.file/impl/nls/lang", "css!d2/dialogs/new.file/impl/o2.processing" ], function(_, $, Backbone, Marionette, PerfectScrollingBehavior, TaskQueue, CommandHelper, RestLinkrels, creationUtil, O2ProcessingView, lang) {
  "use strict";
  var UploadProcessingView = O2ProcessingView.extend({
    className: function() {
      return O2ProcessingView.prototype.className + " d2-import-file-upload-processing";
    },
    constructor: function UploadProcessingView() {
      O2ProcessingView.prototype.constructor.apply(this, arguments);
    },
    getTitle: function() {
      return lang.processingTitle;
    },
    initialize: function() {
      return;
    },
    isProcessingRequired: function() {
      return true;
    },
    createTaskForNode: function(nodeModel, deferred) {
      var me = this;
      return {
        worker: function() {
          creationUtil.initiateImport(nodeModel, false, me.options.mode, me.options).progress(deferred.notify).done(function(nodeModel) {
            nodeModel.fileUploaded = true;
            creationUtil.getLinkDocumentRelations(nodeModel).always(function(data) {
              if (data && data.entries) {
                var linkDocumentRelationsConfig = creationUtil.getLinkDocumentRelationsConfig(data);
                if (linkDocumentRelationsConfig.groupLinkDocumentRelations && linkDocumentRelationsConfig.groupLinkDocumentRelations.length > 0 || linkDocumentRelationsConfig.silentLinkDocuments && linkDocumentRelationsConfig.silentLinkDocuments.length > 0) {
                  CommandHelper.refreshNode(nodeModel).done(function() {
                    if (linkDocumentRelationsConfig.groupLinkDocumentRelations && linkDocumentRelationsConfig.groupLinkDocumentRelations.length > 0) {
                      nodeModel.linkDocConfig = linkDocumentRelationsConfig.groupLinkDocumentRelations;
                    }
                    if (linkDocumentRelationsConfig.silentLinkDocuments && linkDocumentRelationsConfig.silentLinkDocuments.length > 0) {
                      nodeModel.silentLinkDocuments = linkDocumentRelationsConfig.silentLinkDocuments;
                    }
                    if (nodeModel.linkDocConfig || nodeModel.silentLinkDocuments) {
                      creationUtil.extractAttachmentsIfEmail(nodeModel).done(function() {
                        if (nodeModel.silentLinkDocuments && nodeModel.silentLinkDocuments.length > 0) {
                          creationUtil.createLinkDocumentAsSilent(nodeModel).done(function(nodeList) {
                            me.wizard.data.linkedNodes[nodeModel.get("id")] = nodeList;
                            nodeModel.linkedNodes = nodeList;
                            deferred.resolve(nodeModel);
                          }).fail(function(error) {
                            creationUtil.finishCreateOperation([ nodeModel ], RestLinkrels.ABORT_ACTION);
                            nodeModel.error = error;
                            deferred.reject();
                          });
                        } else {
                          deferred.resolve(nodeModel);
                        }
                      }).fail(function(error) {
                        nodeModel.error = error;
                        if (error?.responseJSON?.status === 400 && error?.responseJSON?.code === "E_MIP_OBJECT_UNSUPPORTED_OPERATION") {
                          let dummyAttachment = new Backbone.Model({
                            id: "E_MIP_OBJECT_UNSUPPORTED_OPERATION"
                          });
                          dummyAttachment.isCreationSupported = false;
                          dummyAttachment.contentFile = {
                            size: 0
                          };
                          nodeModel.childrenCollection = new Backbone.Collection([]);
                          nodeModel.childrenCollection.add([ dummyAttachment ]);
                          deferred.resolve(nodeModel);
                        }
                        deferred.reject(error);
                      });
                    } else {
                      deferred.resolve(nodeModel);
                    }
                  }).fail(function(error) {
                    nodeModel.error = error;
                    deferred.reject(error);
                  });
                } else {
                  deferred.resolve(nodeModel);
                }
              } else {
                deferred.resolve(nodeModel);
              }
            });
          }).fail(function(error) {
            creationUtil.finishCreateOperation([ nodeModel ], RestLinkrels.ABORT_ACTION);
            nodeModel.error = error;
            deferred.reject();
          });
          return deferred.promise();
        }
      };
    }
  });
  return UploadProcessingView;
});