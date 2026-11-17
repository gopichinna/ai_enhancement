/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "dctmw/utils/rest.resources", "d2/commands/aviator/reset.config", "d2/commands/node.progress.command", "d2/utils/constants", "d2/utils/rest.linkrels", "i18n!d2/commands/nls/localized.strings" ], function(require, $, _, Backbone, RestResources, ResetConfig, NodeProgressCommand, constants, RestLinkrels, lang) {
  "use strict";
  const ENABLE_AVIATOR = "ENABLE", DISABLE_AVIATOR = "DISABLE";
  const SaveConfig = NodeProgressCommand.extend({
    defaults: {
      signature: "Aviator-SaveConfig",
      command_key: "Aviator-SaveConfig",
      name: lang.CommandAviatorSaveConfig,
      scope: "single"
    },
    enabled: function() {
      return true;
    },
    execute: function(status) {
      const dfd = $.Deferred();
      require([ "d2/utils/contexts/factories/aviator.config.model.factory", "d2/utils/contexts/factories/aviator.assignments.collection.factory" ], (AviatorConfigModelFactory, AviatorAssignmentsCollectionFactory) => {
        const context = status.context;
        status.configModel = status.configModel || context.getModel(AviatorConfigModelFactory);
        status.assignmentsCollection = status.collection || context.getCollection(AviatorAssignmentsCollectionFactory);
        NodeProgressCommand.prototype.execute.apply(this, arguments).then(dfd.resolve, dfd.reject);
      }, dfd.reject);
      return dfd.promise();
    },
    preProcess: function(status) {
      this._prepareStatusNodes(status);
      return this.showConfirmationAlert(status);
    },
    _performActions: function(status) {
      let configModel = status.configModel, isAviatorToggled = this._isAviatorToggled(configModel), isEnabled = configModel.get("is_enabled"), processingMap = {
        add: false,
        remove: false,
        toggle: false
      }, abortTasks = _.partial(this._abortTasks, processingMap, isAviatorToggled, status);
      configModel.trigger("av4r:config:save:start");
      processingMap.toggle = isEnabled && isAviatorToggled;
      this._toggleAviatorStatus(status, true).then(() => {
        processingMap.remove = true;
        return this._removeAssignments(status);
      }).then(() => {
        processingMap.add = true;
        return this._addAssignments(status);
      }).then(() => {
        processingMap.toggle = true;
        return this._toggleAviatorStatus(status, false);
      }).then(() => this._refreshData(status)).catch(() => abortTasks()).always(() => configModel.trigger("av4r:config:save:end"));
      return NodeProgressCommand.prototype._performActions.apply(this, arguments);
    },
    _refreshData: function(options) {
      return new ResetConfig().execute(options);
    },
    _abortTasks: function(processingMap, isToggled, status) {
      let idToPromise = status.idToPromise;
      let addPromises = processingMap.add ? [] : Object.values(idToPromise["ADD"]), removePromises = processingMap.remove ? [] : Object.values(idToPromise["REMOVE"]), togglePromises = !isToggled ? [] : processingMap.toggle ? [] : [ idToPromise["TOGGLE"] ], promises = [ ...addPromises, ...removePromises, ...togglePromises ];
      promises?.forEach(promise => promise.reject(lang.aviatorActionAborted));
    },
    doAction: function(node) {
      return node.promise;
    },
    _prepareStatusNodes: function(status) {
      const {
        assignmentsCollection,
        configModel
      } = status, isAv4rToggled = this._isAviatorToggled(configModel);
      let idToPromise = {
        ADD: {},
        REMOVE: {},
        TOGGLE: null
      };
      function injectTrackerPromise(action, assignments) {
        return assignments.map(assigment => {
          let prom = $.Deferred();
          assigment.promise = prom;
          assigment.ACTION = action;
          idToPromise[action][assigment.get("id")] = prom;
          return assigment;
        });
      }
      let newAssignments = injectTrackerPromise("ADD", assignmentsCollection.locallyAddedAssignments), removedAssignments = injectTrackerPromise("REMOVE", assignmentsCollection.locallyRemovedAssignments), nodes = [ ...removedAssignments, ...newAssignments ];
      if (isAv4rToggled) {
        const isEnabled = configModel.get("is_enabled");
        const task = new Backbone.Model({
          r_object_type: "dm_csai_config",
          name: isEnabled ? lang.progressEnableAviator : lang.progressDisableAvaitor
        });
        task.promise = $.Deferred();
        idToPromise["TOGGLE"] = task.promise;
        nodes[isEnabled ? "unshift" : "push"](task);
      }
      status.idToPromise = idToPromise;
      status.nodes = nodes;
    },
    _isAviatorToggled: function(configModel) {
      return configModel.get("is_enabled") !== configModel.getServerAttribute("is_enabled");
    },
    _toggleAviatorStatus: function(status, processForState) {
      const dfd = $.Deferred(), {
        configModel,
        context
      } = status, clientState = configModel.get("is_enabled"), isToggled = this._isAviatorToggled(configModel);
      if (isToggled && clientState === processForState) {
        const promise = status.idToPromise["TOGGLE"], url = RestLinkrels.getLink(configModel.get("links"), RestLinkrels.AVIATOR_GLOBAL_STATUS), payload = {
          status: clientState ? ENABLE_AVIATOR : DISABLE_AVIATOR
        };
        this.makeAjaxRequest(url, "PUT", payload, context).then(() => {
          promise.resolve();
          dfd.resolve();
        }, err => {
          let errMessage = err?.responseJSON?.message;
          if (!errMessage) {
            errMessage = clientState ? lang.enableAviatorFailed : lang.disableAviatorFailed;
          }
          promise.reject(errMessage);
          dfd.reject();
        });
      } else {
        dfd.resolve();
      }
      return dfd.promise();
    },
    _addAssignments: function(status) {
      return this._updateAssignmentItems(status, "POST", status.assignmentsCollection.locallyAddedAssignments, false);
    },
    _removeAssignments: function(status) {
      return this._updateAssignmentItems(status, "DELETE", status.assignmentsCollection.locallyRemovedAssignments, true);
    },
    _updateAssignmentItems: function(status, method, models, isRemove) {
      let dfd = $.Deferred(), processResponseItems = _.partial(this._processResponseItems, status.assignmentsCollection, status, isRemove);
      this._syncState(method, {
        context: status.context,
        models: models
      }).then(response => {
        const hasError = processResponseItems(response.items || []);
        hasError ? dfd.reject() : dfd.resolve();
      }, err => {
        this._abortTasksInAction(isRemove ? "REMOVE" : "ADD", status, err);
        dfd.reject();
      });
      return dfd.promise();
    },
    _abortTasksInAction: function(action, status, err) {
      const message = err.responseJSON.message || lang.aviatorActionFailed, itemsMap = status.idToPromise[action];
      Object.keys(itemsMap).forEach(id => itemsMap[id]?.reject(message));
    },
    _processResponseItems: function(collection, status, isRemove, items) {
      let action = isRemove ? "REMOVE" : "ADD", idToPromiseMap = status.idToPromise[action], hasError = false;
      items.forEach(item => {
        let id = item.r_object_id, promise = idToPromiseMap[id], err = item["rest-error"];
        if (err) {
          hasError = true;
          err = _.isArray(err) ? err[0] : err;
          promise.reject(err?.message || lang.aviatorActionFailed);
        } else {
          isRemove ? collection.removeLocallyDeletedAssignment(id) : collection.removeLocallyAddedAssignment(id);
          promise.resolve();
        }
      });
      return hasError;
    },
    _syncState: function(method, {
      context,
      models
    }) {
      const dfd = $.Deferred();
      const ids = models.map(model => model.get("id"));
      if (ids.length) {
        const url = RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.AVIATOR_MARKER), payload = {
          items: ids.map(id => {
            return {
              r_object_id: id
            };
          })
        };
        this.makeAjaxRequest(url, method, payload, context).then(dfd.resolve, dfd.reject);
      } else {
        dfd.resolve([]);
      }
      return dfd.promise();
    },
    makeAjaxRequest: function(url, method, payload, context) {
      const dfd = new $.Deferred();
      $.ajax(context.getObject("connector").extendAjaxOptions({
        url: url,
        type: method,
        contentType: constants.MediaTypes.JSON,
        data: JSON.stringify(payload),
        success: dfd.resolve,
        error: dfd.reject
      }));
      return dfd.promise();
    },
    showConfirmationAlert: function(status) {
      var dfd = $.Deferred();
      require([ "d2/dialogs/modal.aviator.summary/aviator.summary.dialog" ], ModalAlert => {
        ModalAlert.showConfirmationDialog(status).then(dfd.resolve, dfd.reject);
      }, dfd.reject);
      return dfd.promise();
    },
    getMessageOptions: function() {
      const processing = lang.aviatorConfigSaveProcessing, av4rConfigSaveSuccess = lang.aviatorConfigSaveSuccessMessage, av4rConfigSaveFailed = lang.aviatorConfigSaveFailureMessage;
      return {
        oneFilePending: processing,
        multiFilePending: processing,
        oneFileSuccess: av4rConfigSaveSuccess,
        multiFileSuccess: av4rConfigSaveSuccess,
        oneFileFailure: av4rConfigSaveFailed,
        multiFileOneFailure: av4rConfigSaveFailed,
        multiFileFailure: av4rConfigSaveFailed,
        actionType: "AVIATOR_CONFIG_SAVE",
        enableCancel: false
      };
    }
  });
  return SaveConfig;
});