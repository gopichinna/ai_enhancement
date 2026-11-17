/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/utils/url", "csui/models/command", "csui/models/fileuploads", "csui/utils/commandhelper", "csui/utils/contexts/factories/connector", "csui/utils/taskqueue", "d2/controls/globalmessage/globalmessage", "dctmw/dialogs/modal.alert.custom.content/customizable.modal.alert", "d2/utils/rest.linkrels", "d2/utils/constants", "dctmw/server.adaptors/converters/node", "d2/utils/mass.update.utils", "dctmw/utils/utils", "i18n!d2/commands/nls/localized.strings" ], function(require, $, _, Backbone, Url, CommandModel, UploadFileCollection, CommandHelper, ConnectorFactory, TaskQueue, GlobalMessage, CustomizableModalAlert, RestLinkrels, constants, nodeConverter, massUpdateUtils, utils, lang) {
  "use strict";
  var configToIncludeOptionsMap = Object.freeze({
    "Update files in selected folders and files in any sub-folders": [ constants.MassUpdateOptions.FILES_IN_SUB_FOLDERS ],
    "Update files in selected folders and all descendents of any virtual documents": [ constants.MassUpdateOptions.VIRTUAL_DOCUMENTS_DESCENDANTS ],
    "Update files in selected folders, files in any sub-folders and all descendents of any virtual documents": [ constants.MassUpdateOptions.FILES_IN_SUB_FOLDERS, constants.MassUpdateOptions.VIRTUAL_DOCUMENTS_DESCENDANTS ],
    "Update selected folders and sub-folders": [ constants.MassUpdateOptions.SUB_FOLDERS ]
  });
  return CommandModel.extend({
    defaults: {
      signature: "D2-MassUpdate",
      command_key: "D2-MassUpdate",
      name: lang.MassUpdateCommandName,
      scope: "multiple"
    },
    enabled: function(status, options) {
      var enabled = CommandModel.prototype.enabled.call(this, status, options);
      if (!enabled) {
        return false;
      }
      var nodes = CommandHelper.getAtLeastOneNode(status);
      var hasBlocked = nodes.some(function(node) {
        return node.get("type") && node.get("type") === constants.Types.BWS;
      });
      return hasBlocked ? false : enabled;
    },
    _fetchMassupdateConfig: function(node, options) {
      return $.ajax(node.connector.extendAjaxOptions({
        url: CommandHelper.getOriginalActionLink(node, this.get("signature"), RestLinkrels.D2_MASS_UPDATE_CONFIG, null, options.data)
      }));
    },
    _showOptionsDialog: function(options) {
      var dfd = $.Deferred(), me = this;
      if (options["is_massupdate_options_dialog_enabled"]) {
        me._showMassUpdateOptionsDialog(options).done(dfd.resolve).fail(dfd.reject);
      } else {
        var includeOptions = configToIncludeOptionsMap[options["sv_file_option"]] ? configToIncludeOptionsMap[options["sv_file_option"]].slice() : [];
        configToIncludeOptionsMap[options["sv_folder_option"]] && includeOptions.push.apply(includeOptions, configToIncludeOptionsMap[options["sv_folder_option"]].slice());
        options["include_all_versions"] && includeOptions.push(constants.MassUpdateOptions.ALL_VERSIONS);
        dfd.resolve({
          "include-options": includeOptions,
          "update-types": constants.MassUpdateOptions.ITEM_PROPERTIES
        });
      }
      return dfd.promise();
    },
    _showMassUpdateOptionsDialog: function(options) {
      var dfd = $.Deferred(), buttonOptions = {
        showYes: true,
        labelYes: lang.MassUpdateDialogLabelYes,
        showNo: false,
        showCancel: true
      };
      require([ "d2/dialogs/mass.update/mass.update.options.dialog/mass.update.options.dialog" ], function(MassUpdateOptionsDialog) {
        var contentView = new MassUpdateOptionsDialog(options);
        CustomizableModalAlert.confirmQuestion(function(result) {
          if (result) {
            dfd.resolve(contentView.options["form-data"]);
          } else {
            dfd.reject("close");
          }
        }, "", lang.MassUpdateDialogTitle, {
          buttons: buttonOptions,
          contentView: contentView,
          className: "d2-mass-update-form"
        });
      });
      return dfd.promise();
    },
    execute: function(status, options) {
      status.d2SelectedNodes = status.nodes;
      status.nodes = status.nodes.clone();
      options = options || {};
      var me = this;
      options.commandPromise = $.Deferred();
      status.suppressFailMessage = true;
      status.suppressSuccessMessage = true;
      this._executeMassUpdate(status, options).done(function(massUpdateData) {
        var data = massUpdateData.data;
        me._blockActions(status.originatingView);
        me.refreshNodes(status, data).always(function() {
          if (massUpdateData.ignoreSuccessMessage !== true) {
            var configName = options.massUpdateConfig["massupdate_config_label"] || options.massUpdateConfig["massupdate_config_name"];
            GlobalMessage.showMessage("success", _.str.sformat(lang.MassUpdateSuccessMessage, configName));
          }
          me._unblockActions(status.originatingView);
          options.commandPromise.resolve();
        });
      }).fail(_.bind(me.handleError, me, status, options));
      return options.commandPromise.promise();
    },
    handleError: function(status, options, error) {
      if (error !== "close") {
        var errorMessage = error && error.responseText ? utils.parseAjaxErrorAsString(error) : typeof error === "string" ? error : "", configName = options.massUpdateConfig && (options.massUpdateConfig["massupdate_config_label"] || options.massUpdateConfig["massupdate_config_name"]);
        this.showErrorMessage(status, configName, errorMessage);
      }
      this._unblockActions(status.originatingView);
      options.commandPromise.reject();
    },
    showErrorMessage: function(status, configName, errorMessage) {
      var node = CommandHelper.getJustOneNode(status), nodes = [ node ? node : status.nodes.at(0) ], queueItems = nodes.map(function(item) {
        return {
          name: "",
          state: "rejected",
          errorMessage: errorMessage,
          count: 1,
          total: 1,
          node: item
        };
      });
      var nodeCollection = new UploadFileCollection(queueItems, {
        connector: node.connector
      });
      nodeCollection.each(function(item) {
        item.node = item.get("node");
        item.unset("node");
      });
      GlobalMessage.showProgressPanel(nodeCollection, {
        oneFileFailure: _.str.sformat(lang.MassUpdateFailureMessage, configName)
      });
    },
    _executeMassUpdate: function(status, options) {
      var me = this;
      _.extend(options, status);
      options.selectionHasFiles = _.contains(options.nodes.pluck("type"), 144);
      options.selectionHasFolders = _.contains(options.nodes.pluck("type"), 0) || _.contains(options.nodes.pluck("type"), 142);
      options.selectionHasVD = _.contains(options.nodes.pluck("r_is_virtual_doc"), 1);
      var node = CommandHelper.getAtLeastOneNode(status).first();
      me._blockActions(status.originatingView);
      return this._fetchMassupdateConfig(node, options).then(function(config) {
        options.massUpdateConfig = config;
        if (!config.links) {
          GlobalMessage.showMessage("error", lang.MassUpdateConfigNotFound);
          return $.Deferred().reject().promise();
        } else {
          me._unblockActions(status.originatingView);
          _.extend(options, config);
          return me._showOptionsDialog(options);
        }
      }).then(function(optionsData) {
        _.extend(options, optionsData, {
          signature: me.get("signature")
        });
        return me._validateAndLaunchWizard(options);
      });
    },
    _validateAndLaunchWizard: function(options) {
      var deferred = $.Deferred(), me = this;
      options.massUpdateData = {};
      options.massUpdateConfigName = options["massupdate_config_label"] || options["massupdate_config_name"];
      require([ "d2/dialogs/mass.update/mass.update.dialog" ], function(MassUpdateDialog) {
        var massUpdateDialog = new MassUpdateDialog({
          context: options.context,
          massUpdateConfig: options.massUpdateConfig,
          updateTypes: options["update-types"],
          commandOptions: options,
          massUpdateValidationPromise: me._initiateValidationOnSelectedItems(options)
        });
        massUpdateDialog.showMassUpdateWizard().done(deferred.resolve).fail(deferred.reject);
      });
      return deferred.promise();
    },
    _blockActions: function(view) {
      CommandHelper.blockD2ViewActions(view);
    },
    _unblockActions: function(view) {
      CommandHelper.unblockD2ViewActions(view);
    },
    _initiateValidationOnSelectedItems: function(options) {
      var url = RestLinkrels.getLink(options.links, RestLinkrels.D2_MASS_UPDATE_OBJECT_VALIDATION), urlParams = {}, connector;
      if (options["update-types"] === constants.MassUpdateOptions.FILE_PROPERTIES) {
        _.extend(urlParams, {
          "include-subfolder": _.contains(options["include-options"], constants.MassUpdateOptions.FILES_IN_SUB_FOLDERS),
          "include-vd-descendants": _.contains(options["include-options"], constants.MassUpdateOptions.VIRTUAL_DOCUMENTS_DESCENDANTS),
          "include-all-versions": _.contains(options["include-options"], constants.MassUpdateOptions.ALL_VERSIONS),
          "update-type": "FILE"
        });
      } else if (options["update-types"] === constants.MassUpdateOptions.FOLDER_PROPERTIES) {
        _.extend(urlParams, {
          "include-subfolder": _.contains(options["include-options"], constants.MassUpdateOptions.SUB_FOLDERS),
          "update-type": "FOLDER"
        });
      } else if (options.selectionHasFiles && !options.selectionHasFolders && !options.selectionHasVD) {
        options["include-options"] = [];
        options["update-types"] = constants.MassUpdateOptions.FILE_PROPERTIES;
        options["include_all_versions"] && options["include-options"].push(constants.MassUpdateOptions.ALL_VERSIONS);
      }
      url = Url.appendQuery(url, Url.combineQueryString(urlParams));
      connector = options.context.getObject(ConnectorFactory);
      return $.ajax(connector.extendAjaxOptions({
        url: url,
        type: "POST",
        contentType: constants.MediaTypes.DCTM_JSON,
        dataType: "json",
        data: JSON.stringify({
          "object-ids": options.nodes.pluck("id")
        })
      }));
    },
    refreshNodes: function(status, data) {
      var me = this, deferred = $.Deferred(), massUpdateValidNodesMap = data.massUpdateValidNodes && _.reduce(data.massUpdateValidNodes, function(map, massUpdateNode) {
        var id = massUpdateNode["r_object_id"];
        map[id] = massUpdateNode;
        return map;
      }, {}), nodes = status.nodes.filter(function(node) {
        var id = node.get("id");
        return massUpdateValidNodesMap && !!massUpdateValidNodesMap[id];
      }), collection = status.collection || status.originatingView.collection, widgetType = collection && collection.widgetType, widgetName = collection && collection.options && collection.options.widgetName;
      function performSingleNodeRefresh(node) {
        var refreshOptions = {};
        if (widgetName && widgetType) {
          refreshOptions.widgetType = widgetType;
          refreshOptions.widgetName = widgetName;
          refreshOptions.isDisableLocationColumn = collection.options.isDisableLocationColumn;
        }
        return CommandHelper.refreshNode(node, refreshOptions);
      }
      function performMultipleNodeRefresh(nodes) {
        var dfd = $.Deferred(), taskQueue = new TaskQueue({
          parallelism: 3
        }), promises = [];
        _.each(nodes, function(node) {
          var promise = $.Deferred();
          promises.push(promise);
          taskQueue.pending.add({
            worker: function() {
              performSingleNodeRefresh(node).always(function() {
                promise.resolve();
              });
              return promise.promise();
            }
          });
        });
        $.whenAll.apply($, promises).always(function() {
          dfd.resolve();
        });
        return dfd.promise();
      }
      if (nodes.length === 1) {
        me._blockActions(status.originatingView);
        performSingleNodeRefresh(nodes[0]).always(function() {
          me._unblockActions(status.originatingView);
          deferred.resolve();
        });
      } else if (nodes.length > 1) {
        me._blockActions(status.originatingView);
        CommandHelper.refreshNodes(nodes, {
          connector: status.context.getObject(ConnectorFactory),
          widgetType: widgetType,
          widgetName: widgetName,
          collection: collection,
          selectedNodes: status.d2SelectedNodes || status.nodes
        }).done(function(data) {
          if (data && data.nodesRefreshed === true) {
            me._unblockActions(status.originatingView);
            deferred.resolve();
          } else {
            performMultipleNodeRefresh(nodes).always(function() {
              me._unblockActions(status.originatingView);
              deferred.resolve();
            });
          }
        }).fail(function() {
          me._unblockActions(status.originatingView);
          deferred.reject();
        });
      } else {
        deferred.resolve();
      }
      return deferred.promise();
    }
  });
});