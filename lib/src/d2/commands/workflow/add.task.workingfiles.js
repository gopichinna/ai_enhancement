/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/models/node/node.model", "d2/commands/node.progress.command", "d2/utils/constants", "d2/utils/rest.linkrels", "dctmw/utils/utils", "d2/utils/content.assist", "d2/controls/globalmessage/globalmessage", "i18n!d2/commands/nls/localized.strings" ], function(require, _, $, NodeModel, NodeProgressCommand, constants, RestLinkrels, utils, ContentAssist, GlobalMessage, lang) {
  "use strict";
  return NodeProgressCommand.extend({
    defaults: {
      signature: "D2-TaskAddWorkingFile",
      command_key: "D2-TaskAddWorkingFile",
      name: "",
      scope: "single"
    },
    enabled: function(status) {
      var links = status.node.get("links");
      var addRel = links.filter(function(linkobj) {
        return linkobj.rel === RestLinkrels.D2_TASK_WORKING_DOCUMENTS;
      });
      if (addRel && addRel[0]) {
        return true;
      }
      return false;
    },
    execute: function(status, options) {
      var me = this;
      var deferred = $.Deferred();
      options = options || {};
      options.node = status.node;
      options.packagetype = status.node.get("package-obj").type;
      options.suppressProgress = true;
      var pckname = status.node.get("package-obj").name;
      this._fetchContentAssistOptions(status, options).done(_.bind(function(nodes) {
        this._performAddAction(status, options, nodes).done(function() {
          status.collection.trigger("d2:task:workingfiles:added", {
            pckname: pckname
          });
          me._showSuccessMessage(options);
          deferred.resolve();
        }).fail(function(error) {
          me._showFailureMessage(options);
          deferred.reject(error);
        });
      }, this)).fail(function(error) {
        me._showFailureMessage(options);
        deferred.reject(error);
      });
      return deferred.promise();
    },
    _showSuccessMessage: function(options) {
      const msgOpts = this.getMessageOptions();
      if (options && options.node && options.node.get("package-obj")) {
        const msg = _.str.sformat(msgOpts.oneFileSuccess, options.node.get("package-obj").name);
        GlobalMessage.showMessage("success", msg);
      }
    },
    _showFailureMessage: function(options) {
      const msgOpts = this.getMessageOptions();
      if (options && options.node && options.node.get("package-obj")) {
        const msg = _.str.sformat(msgOpts.oneFileFailure, options.node.get("package-obj").name);
        GlobalMessage.showMessage("error", msg);
      }
    },
    _performAddAction: function(status, options, nodes) {
      var deferred = $.Deferred();
      if (!(nodes && nodes.length)) {
        return $.Deferred().reject().promise();
      }
      this._blockActions(status.originatingView);
      var url = RestLinkrels.getLink(status.taskModel.get("links"), RestLinkrels.D2_TASK_WORKING_DOCUMENTS);
      var formData = [];
      var pck = status.node.get("package-obj");
      var pckObj = {
        name: pck.name,
        component_id: nodes[0].get("id")
      };
      formData.push(pckObj);
      var body = {
        packages: formData
      };
      var me = this;
      $.ajax(status.taskModel.connector.extendAjaxOptions({
        url: url,
        type: "POST",
        data: JSON.stringify(body),
        contentType: constants.MediaTypes.DCTM_JSON,
        success: function(response) {
          me._unblockActions(status.originatingView);
          deferred.resolve(response);
        },
        error: _.bind(function(xhr, message, statusText) {
          me._unblockActions(status.originatingView);
          deferred.reject(utils.parseAjaxErrorAsString(xhr, statusText, message));
        })
      }));
      return deferred.promise();
    },
    _fetchContentAssistOptions: function(status, options) {
      var deferred = $.Deferred(), container = new NodeModel(undefined, {
        connector: status.node.get("connector"),
        autofetch: true
      }), me = this;
      ContentAssist.getContentAssistOptions(status).done(function(config) {
        var title = config ? config.label_value : "", includeBrowse = config && config.properties ? config.properties.has_browse_assist : true, includeFavorites = config && config.properties ? config.properties.has_favorites_assist : false, globalSearch = config && config.properties ? config.properties.has_search_assist : false, subTypeFilters = [ options.packagetype ];
        me.displayContentAssist(status, status.node, status.originatingView, title, includeBrowse, includeFavorites, false, globalSearch, subTypeFilters, container).done(deferred.resolve).fail(deferred.reject);
      }).fail(deferred.reject);
      return deferred.promise();
    },
    displayContentAssist: function(status, nodeModel, actionView, title, includeBrowse, includeFavorites, includeRelatedFiles, globalSearch, subTypeFilters, container) {
      var deferred = $.Deferred();
      require([ "d2/dialogs/target.browse/target.browse" ], function(NodePicker) {
        var pickerOptions = {
          dialogTitle: title,
          connector: nodeModel.connector,
          container: container,
          initialContainer: container,
          context: status.context,
          selectMultiple: false,
          includeBrowse: includeBrowse,
          globalSearch: globalSearch,
          includeFavorites: includeFavorites,
          includeRelatedFiles: includeRelatedFiles,
          nodeModel: nodeModel
        };
        pickerOptions.storeContainer = true;
        pickerOptions.restoreContainer = true;
        pickerOptions.dataId = constants.StorageKey.LAUNCH_WORKFLOW_ATTACHMENTS_VIEW_MIXIN + constants.StorageKey.ANCESTOR_INFO;
        if (!pickerOptions.dialogTitle || pickerOptions.dialogTitle.length === 0) {
          pickerOptions.dialogTitle = lang.ContentAssistDialogTitle;
        }
        pickerOptions.startLocations = [];
        if (pickerOptions.includeBrowse) {
          pickerOptions.startLocations.push("current.location");
        }
        if (pickerOptions.includeFavorites) {
          pickerOptions.startLocations.push("favorites");
        }
        if (pickerOptions.includeRelatedFiles) {
          pickerOptions.startLocations.push("related.files");
        }
        if (subTypeFilters) {
          pickerOptions.subTypeFilters = subTypeFilters;
        }
        var nodePicker = new NodePicker(pickerOptions);
        actionView.unblockActions();
        nodePicker.show().done(function(selectedNodes) {
          deferred.resolve(selectedNodes.nodes);
        }).fail(function() {
          deferred.reject("close");
        });
      }, deferred.reject);
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
        oneFileFailure: lang.AddTaskWorkingFileOneItemFailureMessage,
        oneFileSuccess: lang.AddTaskWorkingFileOneItemSuccessMessage,
        actionType: "ADD_TASK_WORKING_FILES"
      };
    }
  });
});