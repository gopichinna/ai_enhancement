/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "csui/models/fileuploads", "d2/controls/globalmessage/globalmessage", "csui/utils/commands/node", "csui/utils/commandhelper", "csui/utils/command.error", "d2/controls/globalmessage/impl/progresspanel/node.creation.success.message.view", "dctmw/utils/utils", "d2/utils/concurrency.manager" ], function(module, $, _, Backbone, UploadFileCollection, GlobalMessage, NodeCommand, CommandHelper, CommandError, NodeCreationSuccessMessageView, utils, ConcurrencyManager) {
  "use strict";
  var config = module.config();
  _.defaults(config, {
    parallelism: 3
  });
  var PageLeavingBlocker;
  return NodeCommand.extend({
    execute: function(status, options) {
      options = options || {};
      status.suppressFailMessage = true;
      status.suppressSuccessMessage = true;
      if (utils.isMobile()) {
        if (status.originatingView && !status.originatingView.blockActions) {
          status.originatingView = status.originatingView._parent;
        }
        options.disableConcurrentProcess = true;
      }
      var me = this, deferred = $.Deferred();
      if (options.disableConcurrentProcess !== true) {
        if (ConcurrencyManager.isProcessPending(CommandHelper.getAtLeastOneNode(status))) {
          return $.Deferred().resolve().promise();
        }
        ConcurrencyManager.listenForProcessMinimize(status, options, this).done(deferred.resolve);
      }
      this.preProcess(status, options).done(function() {
        _.defaults(options, status);
        options.parallelism = me.get("parallelism") || 1;
        me._performActions(status, options).done(deferred.resolve).fail(deferred.reject);
      }).fail(function(error) {
        if (error) {
          GlobalMessage.showMessage("error", error.message || error);
        }
        deferred.reject(error);
      });
      return deferred.promise();
    },
    _performActions: function(status, options) {
      var me = this, deferred = $.Deferred(), nodes = CommandHelper.getAtLeastOneNode(status);
      if (!nodes || !nodes.length) {
        return deferred.reject(new CommandError("At least one node must be present")).promise();
      }
      var queueItems = nodes.map(function(node, index) {
        return {
          name: node.get("name"),
          state: index < options.parallelism ? "processing" : "pending",
          count: 0,
          total: 1,
          node: node,
          doneCommand: options.doneCommand,
          commandContainer: options.commandContainer,
          context: options.context,
          originatingView: options.originatingView,
          actionType: "NODEPROGRESS-" + _.uniqueId()
        };
      }), enableCancel = options.enableCancel !== undefined ? options.enableCancel : true, collection = new UploadFileCollection(queueItems, {
        connector: nodes.at(0).connector
      }), newStatus = _.defaults({
        nodes: collection
      }, status, options), suppressProgress = status.toolItem && status.toolItem.get("suppressProgress") || options.suppressProgress, msgOpts = _.extend({
        enableCancel: enableCancel,
        originatingView: options.originatingView,
        commandContainer: status.container,
        context: status.context
      }, me.getMessageOptions(options));
      collection.each(function(item) {
        item.node = item.get("node");
        item.node.set("mime_type", item.node.get("mime_type") === undefined ? item.node.get("type") : item.node.get("mime_type"));
        item.unset("node");
      });
      if (!suppressProgress) {
        options.progressPanel = true;
        options.targetLocation && collection.length === 1 && collection.at(0).set("targetLocation", true);
        options.progressPanelView = GlobalMessage.showProgressPanel(collection, msgOpts);
      }
      options.progressCollection = collection;
      newStatus.suppressMultipleSuccessMessage = true;
      newStatus.suppressMultipleFailMessage = true;
      var postExecute = function(results) {
        var failedCnt = 0, successCnt = 0, hideFailureMessage = options.hideFailureMessage === true;
        _.each(results, function(result) {
          result instanceof Backbone.Model ? ++successCnt : ++failedCnt;
        });
        options.multiFileAllFailed = successCnt === 0 && failedCnt > 1;
        var opts = me.getMessageOptions(options);
        if (!failedCnt) {
          me._showSuccessMessage(results, options);
        } else if (suppressProgress && !hideFailureMessage) {
          me._showFailureMessage(results, collection, options, _.extend(msgOpts, opts));
        }
        var handleOutput = me.handleResults(results, options, collection);
        if (!handleOutput || !_.isFunction(handleOutput.then)) {
          handleOutput = $.Deferred().resolve().promise();
        }
        handleOutput.done(function() {
          if (failedCnt > 0) {
            deferred.reject(results);
          } else {
            deferred.resolve(results);
          }
        }).fail(deferred.reject);
      };
      me._processItems(newStatus, options).done(postExecute).fail(postExecute);
      return deferred.promise();
    },
    _processItems: function(status, options) {
      var deferred = $.Deferred(), self = this, promises;
      require([ "csui/utils/taskqueue", "csui/utils/page.leaving.blocker" ], function(TaskQueue) {
        PageLeavingBlocker = arguments[1];
        options = options || {};
        if (!options.context) {
          options.context = status.context;
        }
        self._announceStart(status);
        var nodes = CommandHelper.getAtLeastOneNode(status), queue = new TaskQueue({
          parallelism: options.parallelism || config.parallelism
        });
        promises = nodes.map(function(node) {
          var deferred = $.Deferred();
          queue.pending.add({
            worker: function() {
              _.isFunction(self.preExecute) && self.preExecute(node);
              self._performAction(node, options).done(function(args) {
                _.isFunction(self.postExecute) && self.postExecute(status, args);
                deferred.resolve(args);
              }).fail(function(error) {
                deferred.reject(error);
              });
              return deferred.promise();
            }
          });
          return deferred.promise();
        });
        $.whenAll.apply($, promises).always(_.bind(self._announceFinish, self, status)).done(function() {
          if (!status.suppressMultipleSuccessMessage) {
            self.showSuccess(promises);
          }
          deferred.resolve.apply(deferred, arguments);
        }).fail(function() {
          if (!status.suppressMultipleFailMessage) {
            self.showError(promises);
          }
          deferred.reject.apply(deferred, arguments);
        });
      }, function(error) {
        deferred.reject(error);
      });
      return deferred.promise();
    },
    _announceStart: function(status) {
      if (!status.deleteBlockAction) {
        var originatingView = status.originatingView;
        if (originatingView && originatingView.blockActions) {
          originatingView.blockActions();
        }
        var pageLeavingWarning = this.get("pageLeavingWarning");
        if (pageLeavingWarning) {
          PageLeavingBlocker.enable(pageLeavingWarning);
        }
      }
      this._setViewStateModelMultiItemOperationStatus(status.context, true);
    },
    _announceFinish: function(status) {
      this._setViewStateModelMultiItemOperationStatus(status.context, false);
      if (this.get("pageLeavingWarning")) {
        PageLeavingBlocker.disable();
      }
      var originatingView = status.originatingView;
      if (originatingView && originatingView.unblockActions) {
        originatingView.unblockActions();
      }
    },
    _performAction: function(model, options) {
      var deferred = $.Deferred(), state = model.get("state");
      if (state === "aborted" || state === "stopped") {
        model.set("count", 1);
        model.deferred.reject(model);
        deferred.reject();
      } else {
        var node = model.node;
        this.doAction(node, options, model).done(function() {
          model.set({
            count: 1,
            state: "resolved"
          });
          model.deferred.resolve(model);
          deferred.resolve(node);
        }).fail(function(err) {
          if (err.responseText) {
            err = utils.parseAjaxErrorAsString(err);
          }
          var cmdError = new CommandError(err);
          model.set({
            count: 1,
            state: "rejected",
            errorMessage: err
          });
          model.deferred.reject(model, cmdError);
          deferred.reject(cmdError);
        });
      }
      return deferred.promise();
    },
    _showSuccessMessage: function(results, options) {
      var hideSuccessMessage = options.hideSuccessMessage === true, msgOpts = this.getMessageOptions(options);
      if (results.length === 1) {
        if (!hideSuccessMessage) {
          var node = results[0], inSameContainer = this._isNodeInContainer(node, options.commandContainer);
          if (options.progressPanelView === undefined && inSameContainer) {
            const msg = _.str.sformat(msgOpts.oneFileSuccess, node.get("name"));
            GlobalMessage.showMessage("success", msg);
          }
        }
      }
    },
    _showFailureMessage: function(results, collection, options, msgOpts) {
      options.progressPanel = true;
      options.progressPanelView = GlobalMessage.showProgressPanel(collection, msgOpts);
    },
    _isNodeInContainer: function(node, container) {
      if (node && container) {
        var parentIds = node.get("i_folder_id") || [];
        return _.contains(parentIds, container.get("id"));
      }
      return true;
    },
    preProcess: function() {
      return $.Deferred().resolve().promise();
    },
    doAction: function() {
      return $.Deferred().reject("Implementation required by subclass").promise();
    },
    handleResults: function() {},
    getMessageOptions: function() {
      return {};
    }
  });
});