/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/models/node/node.model", "csui/utils/commandhelper", "nuc/utils/url", "d2/commands/node.progress.command", "d2/controls/globalmessage/globalmessage", "d2/models/workflow/workflow", "d2/models/workflow/workflow.audit.task", "d2/models/workflow/workflow.audit.task.event", "d2/utils/constants", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "dctmw/utils/utils", "d2/utils/content.assist", "i18n!d2/commands/nls/localized.strings", "i18n!d2/controls/form/impl/nls/lang" ], function(require, _, $, NodeModel, CommandHelper, Url, NodeProgressCommand, GlobalMessage, WorkflowModel, WorkflowAuditTask, WorkflowAuditTaskEvent, constants, RestResources, RestLinkrels, utils, ContentAssist, lang, ctrLang) {
  "use strict";
  return NodeProgressCommand.extend({
    defaults: {
      signature: "D2-WorkflowAddAttachment",
      command_key: "D2-WorkflowAddAttachment",
      name: "",
      scope: "single"
    },
    preProcess: function(status, options) {
      var deferred = $.Deferred();
      options = options || {};
      options.taskModel = CommandHelper.getJustOneNode(status);
      options.suppressProgress = true;
      if (status.targetNodes) {
        this._performAddAction(status, options, status.targetNodes).done(function() {
          deferred.resolve();
        }).fail(function(error) {
          deferred.reject(error);
        });
      } else {
        this._fetchContentAssistOptions(status, options).done(_.bind(function(nodes) {
          this._performAddAction(status, options, nodes).done(function() {
            deferred.resolve();
          }).fail(function(error) {
            deferred.reject(error);
          });
        }, this)).fail(function(error) {
          deferred.reject(error);
        });
      }
      return deferred.promise();
    },
    doAction: function(node, options) {
      if (_.contains(options.successIds, node.get("id"))) {
        return $.Deferred().resolve().promise();
      } else {
        return $.Deferred().reject(options.errorMessages[node.get("id")] || " ").promise();
      }
    },
    handleResults: function(results, options) {
      var deferred = $.Deferred();
      if (options.successIds.length && options.collection) {
        var opts = utils.isMobile() ? {
          force: true
        } : {};
        options.collection.fetch(_.extend(opts, {
          reload: true,
          success: function(collection) {
            var newModels = _.compact(_.map(options.successIds.reverse(), function(id) {
              return _.find(collection.allModels, function(model) {
                return model.get("id") === id;
              });
            }));
            collection.remove(newModels);
            collection.unshift(newModels);
            collection.trigger("d2:task:attachments:added", newModels, _.filter(results, function(r) {
              return r instanceof NodeModel;
            }).reverse());
          }
        })).always(_.bind(function() {
          this._unblockActions(options.originatingView);
          deferred.resolve();
        }, this));
      } else {
        this._unblockActions(options.originatingView);
        return deferred.resolve();
      }
      return deferred.promise();
    },
    _showSuccessMessage: function(results, options) {
      if (results.length > 1) {
        const msgOpts = this.getMessageOptions(options), msg = _.str.sformat(msgOpts.multiFileSuccess, results.length);
        GlobalMessage.showMessage("success", msg);
      } else {
        NodeProgressCommand.prototype._showSuccessMessage.apply(this, arguments);
      }
    },
    _performAddAction: function(status, options, nodes) {
      var deferred = $.Deferred(), nodeIdToNodeMap = {}, ids = nodes && _.map(nodes, function(node) {
        nodeIdToNodeMap[node.get("id")] = node;
        return node.get("id");
      });
      if (utils.isMobile()) {
        if (!(ids && ids.length)) {
          options._targetbrowsePromise.resolve();
        } else {
          deferred.done(function() {
            status.collection.trigger("d2:task:attachments:selected", nodes, options.successIds);
          }).always(options._targetbrowsePromise.resolve);
        }
      }
      if (!(ids && ids.length)) {
        return $.Deferred().reject().promise();
      }
      this._blockActions(status.originatingView);
      var url = CommandHelper.getOriginalActionLink(options.taskModel, "D2-WorkflowManageAttachment", RestLinkrels.D2_TASK_SUPPORTING_DOCUMENTS), qParams = {
        inline: true,
        links: true,
        "object-ids": ids
      };
      if (options.taskModel instanceof WorkflowModel || options.taskModel instanceof WorkflowAuditTask || options.taskModel instanceof WorkflowAuditTaskEvent) {
        qParams["wf-overview-widget-name"] = options.taskModel.connector.context.viewStateModel.getDefaultViewState("widget_name");
      }
      url = Url.appendQuery(url, Url.combineQueryString(qParams));
      $.ajax(options.taskModel.connector.extendAjaxOptions({
        url: url,
        type: "POST",
        contentType: constants.MediaTypes.DCTM_JSON,
        success: function(response) {
          var successIds = [], errorMessages = {};
          if (response && response.entries && response.entries.length) {
            _.each(response.entries, function(entry) {
              if (entry.content["rest-error"]) {
                errorMessages[entry.content["r_object_id"]] = entry.content["rest-error"].message;
              } else {
                var id = entry.content["r_object_id"];
                if (nodeIdToNodeMap[id]) {
                  _.defaults(nodeIdToNodeMap[id].attributes, _.pick(entry.content, "i_chronicle_id"));
                }
                successIds.push(id);
              }
            });
          }
          options.successIds = successIds;
          options.errorMessages = errorMessages;
          require([ "nuc/models/nodes" ], function(NodeCollection) {
            status.nodes = new NodeCollection(nodes);
            deferred.resolve();
          });
        },
        error: _.bind(function(xhr, message, statusText) {
          this._unblockActions(status.originatingView);
          deferred.reject(utils.parseAjaxErrorAsString(xhr, statusText, message));
        }, this)
      }));
      return deferred.promise();
    },
    _fetchContentAssistOptions: function(status, options) {
      var deferred = $.Deferred(), me = this, container = new NodeModel(undefined, {
        connector: options.taskModel.connector,
        autofetch: true
      });
      ContentAssist.getContentAssistOptions(status).done(function(config) {
        var title = config ? config.label_value : "";
        var includeBrowse = config && config.properties ? config.properties.has_browse_assist : true;
        var includeFavorites = config && config.properties ? config.properties.has_favorites_assist : false;
        var globalSearch = config && config.properties ? config.properties.has_search_assist : false;
        me._displayContentAssist(status, options, title, includeBrowse, includeFavorites, globalSearch, container).done(function(selectedNodes) {
          deferred.resolve(selectedNodes.nodes);
        }).fail(function() {
          deferred.reject();
        });
      }).fail(function(error) {
        deferred.reject(utils.parseAjaxErrorAsString(error));
      });
      return deferred.promise();
    },
    _displayContentAssist: function(status, options, title, includeBrowse, includeFavorites, globalSearch, container) {
      var deferred = $.Deferred();
      require([ "d2/dialogs/target.browse/target.browse" ], function(NodePicker) {
        var pickerOptions = {
          dialogTitle: title,
          connector: options.taskModel.connector,
          container: container,
          initialContainer: container,
          context: status.context,
          selectMultiple: true,
          includeBrowse: includeBrowse,
          globalSearch: globalSearch,
          includeFavorites: includeFavorites
        };
        pickerOptions.storeContainer = true;
        pickerOptions.restoreContainer = true;
        pickerOptions.dataId = constants.StorageKey.ADD_TASK_ATTACHMENTS_COMMAND + constants.StorageKey.ANCESTOR_INFO;
        if (!pickerOptions.dialogTitle || pickerOptions.dialogTitle.length === 0) {
          pickerOptions.dialogTitle = ctrLang.addContent;
        }
        pickerOptions.startLocations = [];
        if (pickerOptions.includeBrowse) {
          pickerOptions.startLocations.push("current.location");
        }
        if (pickerOptions.includeFavorites) {
          pickerOptions.startLocations.push("favorites");
        }
        if (utils.isMobile()) {
          pickerOptions.defaultBrowseSubHeader = "target-browse";
          pickerOptions.closeOnSelection = false;
        }
        var nodePicker = new NodePicker(pickerOptions);
        nodePicker.show().done(function(selectedNodes) {
          deferred.resolve(selectedNodes);
        }).fail(function() {
          deferred.reject();
        });
        if (utils.isMobile()) {
          options._targetbrowsePromise = $.Deferred();
          options._targetbrowsePromise.always(nodePicker.close.bind(nodePicker));
        }
      });
      return deferred.promise();
    },
    _blockActions: function(view) {
      view && _.isFunction(view.blockActions) && view.blockActions();
    },
    _unblockActions: function(view) {
      view && _.isFunction(view.unblockActions) && view.unblockActions();
    },
    getMessageOptions: function() {
      return {
        multiFileFailure: lang.AddTaskAttachmentManyItemsFailureMessage,
        multiFileOneFailure: lang.AddTaskAttachmentManyItemsOneFailureMessage,
        multiFileSuccess: lang.AddTaskAttachmentManyItemsSuccessMessage,
        oneFileFailure: lang.AddTaskAttachmentOneItemFailureMessage,
        oneFileSuccess: lang.AddTaskAttachmentOneItemSuccessMessage,
        actionType: "ADD_TASK_ATTACHMENTS"
      };
    }
  });
});