/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/utils/taskqueue", "d2/utils/rest.linkrels", "d2/utils/creation.utils", "csui/utils/commandhelper", "d2/utils/constants", "d2/dialogs/new.file/o2.processing.view", "d2/controls/globalmessage/globalmessage", "i18n!d2/dialogs/new.file/impl/nls/lang" ], function(_, $, Backbone, Marionette, TaskQueue, RestLinkrels, creationUtil, CommandHelper, constants, O2ProcessingView, GlobalMessage, lang) {
  "use strict";
  var VDOCAsyncView = O2ProcessingView.extend({
    className: function() {
      return O2ProcessingView.prototype.className + " d2-vdoc-async";
    },
    constructor: function VDOCAsyncView(options) {
      O2ProcessingView.prototype.constructor.apply(this, arguments);
      this.nodeModel = options.node;
    },
    templateHelpers: function() {
      return {
        labelProcessing: lang.vdocAsyncProcessingLabel,
        percentage: 0
      };
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
    onStepActive: function() {
      this.pendingDfd = $.Deferred();
      var nodeModel = this.nodeModel;
      var me = this;
      this.taskQueue.pending.add(this.createTaskForNode(nodeModel, this.pendingDfd));
      this.pendingDfd.progress(function(progressCount, totalCount) {
        me.updateProgress(progressCount, totalCount);
      }).always(function() {
        me.updateProgress(1, 1);
        delete nodeModel.asyncURL;
      }).done(function() {
        me.checkLinkedDocumentConfig(nodeModel).done(function(nodeModel) {
          me.handleProcessingSuccess([ nodeModel ]);
        }).fail(function(error) {
          me.handleProcessingFailure([ nodeModel ], error, true);
        });
      }).fail(function(error, abort) {
        me.handleProcessingFailure([ nodeModel ], error, abort);
      });
    },
    handleProcessingFailure: function(failedFiles, error, abort) {
      if (this.wizardMinimized) {
        this.listenToOnce(this.wizard, "wizard:restored", this.handleProcessingFailure.bind(this, failedFiles, error, abort));
        return;
      }
      if (_.isString(error)) {
        GlobalMessage.showMessage("error", error);
      } else {
        error.responseJSON = error.responseJSON || {};
        GlobalMessage.showMessage("error", error.responseJSON.message, error.responseJSON.details);
      }
      if (abort === false) {
        this.handleProcessingSuccess(failedFiles);
      } else {
        creationUtil.finishCreateOperation(failedFiles, RestLinkrels.ABORT_ACTION);
        this.abortOnCriticalError();
      }
    },
    createTaskForNode: function(nodeModel, deferred) {
      var intermediate;
      var start = new Date().getTime();
      return {
        worker: function() {
          var fn = function() {
            creationUtil.pollAsyncVNodeStatus(nodeModel).done(function(response) {
              if (response.properties.status === "SUCCESS") {
                deferred.resolve(response);
              } else if (response.properties.status === "FAILED") {
                deferred.reject(response.errors);
              } else if (response.properties.status === "NOT_STARTED") {
                deferred.notify(0, 1);
                intermediate = new Date().getTime();
                if (intermediate - start > 12e4) {
                  deferred.reject(lang.vdocAsyncObjectTimeout, false);
                } else {
                  setTimeout(fn, 10);
                }
              } else if (response.properties.status === "RUNNING") {
                deferred.notify(response.properties.complete_count, response.properties.total_count);
                intermediate = new Date().getTime();
                if (intermediate - start > 3e5) {
                  deferred.reject(lang.vdocAsyncObjectTimeout, false);
                } else {
                  setTimeout(fn, 500);
                }
              } else {
                deferred.reject(lang.vdocAsyncObjectFailed);
              }
            }).fail(function(error) {
              deferred.reject(error);
            });
          };
          setTimeout(fn, 10);
          return deferred.promise();
        }
      };
    },
    checkLinkedDocumentConfig: function(nodeModel) {
      var dfd = $.Deferred();
      if (this.options.isLinkedDoc === true) {
        dfd.resolve(nodeModel);
      } else {
        this.fetchLinkedDocumentConfig(nodeModel).done(function() {
          dfd.resolve(nodeModel);
        }).fail(function(error) {
          dfd.reject(_.isArray(error) ? error[0] : error);
        });
      }
      return dfd.promise();
    },
    fetchLinkedDocumentConfig: function(node) {
      var dfd = $.Deferred(), me = this;
      creationUtil.getLinkDocumentRelations(node).done(function(data) {
        var linkDocumentRelationsConfig = creationUtil.getLinkDocumentRelationsConfig(data);
        if (linkDocumentRelationsConfig.groupLinkDocumentRelations && linkDocumentRelationsConfig.groupLinkDocumentRelations.length > 0 || linkDocumentRelationsConfig.silentLinkDocuments && linkDocumentRelationsConfig.silentLinkDocuments.length > 0) {
          var nodeLinks = node.get("links");
          CommandHelper.refreshNode(node).done(function() {
            nodeLinks = _.uniq(_.union(nodeLinks, node.get("links")), "rel");
            node.set("links", nodeLinks, {
              silent: true
            });
            if (linkDocumentRelationsConfig.groupLinkDocumentRelations && linkDocumentRelationsConfig.groupLinkDocumentRelations.length > 0) {
              node.linkDocConfig = linkDocumentRelationsConfig.groupLinkDocumentRelations;
            }
            if (linkDocumentRelationsConfig.silentLinkDocuments && linkDocumentRelationsConfig.silentLinkDocuments.length > 0) {
              node.silentLinkDocuments = linkDocumentRelationsConfig.silentLinkDocuments;
              creationUtil.createLinkDocumentAsSilent(node).done(function(nodeList) {
                me.options.wizard.data.linkedNodes[node.get("id")] = nodeList;
                node.linkedNodes = nodeList;
                dfd.resolve(node);
              }).fail(function(error) {
                dfd.reject(error);
              });
            } else {
              dfd.resolve(node);
            }
          }).fail(function(error) {
            dfd.reject(error);
          });
        } else {
          dfd.resolve(node);
        }
      }).fail(function(error) {
        dfd.reject(error);
      });
      return dfd.promise();
    },
    getMinimizelabels: function() {
      return {
        PendingHeaderTitle: _.str.sformat(lang.ProcessingVdocMiniHeaderTitle, this.nodeModel.get("name")),
        CompletedHeaderTitle: _.str.sformat(lang.CompletedVdocMiniHeaderTitle, this.nodeModel.get("name"))
      };
    }
  });
  return VDOCAsyncView;
});