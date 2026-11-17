/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "csui/utils/contexts/factories/application.scope.factory", "d2/utils/constants", "d2/utils/widget.constants" ], function($, _, Backbone, ApplicationScopeModelFactory, constants, widgetConstants) {
  "use strict";
  return {
    mixin: function(prototype) {
      var superPrepareModel = prototype._prepareModel, superRequestPromotedActions = prototype._requestPromotedActions, superRequestsNonPromotedActions = prototype._requestsNonPromotedRestActions, superUpdateOriginalActions = prototype._updateOriginalActions;
      return _.extend(prototype, {
        _prepareModel: function(attrs, options) {
          var model = superPrepareModel.call(this, attrs, options), menuType = model.get("menuType") || this.options?.d2ActionsOptions?.menuType, widgetType = model.get("widgetType") || this.options?.d2ActionsOptions?.widgetType;
          if (menuType) {
            model.delayedActions.menuType = menuType;
            model.setNonPromotedActionsOptions({
              menuType: menuType
            });
          }
          if (widgetType) {
            model.delayedActions.widgetType = widgetType;
            model.setNonPromotedActionsOptions({
              widgetType: widgetType
            });
            model.widgetType = widgetType;
          }
          var context = model.options && model.options.connector && model.options.connector.context, applicationScope = context && context.getModel(ApplicationScopeModelFactory);
          if (applicationScope && applicationScope.get("id") === "properties" && (model.get("rObjectType") === "d2c_workflow_tracker" || model.get("r_object_type") === "d2c_workflow_tracker")) {
            model.set("csuiLazyActionsRetrieved", true, {
              silent: true
            });
            model.set("csuiDelayedActionsRetrieved", true, {
              silent: true
            });
          }
          return model;
        },
        _enableDelayRestCommands: function() {
          if (!this.delayRestCommands) {
            this.delayRestCommands = true;
            this.on(_.isFunction(this.hasDelayedDataBehavior) && this.hasDelayedDataBehavior() ? "delayed:data:sync" : "sync", this._requestRestActions, this);
          }
        },
        _disableDelayRestCommands: function() {
          if (this.delayRestCommands) {
            this.delayRestCommands = false;
            this.off(_.isFunction(this.hasDelayedDataBehavior) && this.hasDelayedDataBehavior() ? "delayed:data:sync" : "sync", this._requestRestActions, this);
          }
        },
        _requestRestActions: function(model, resp, options = {}) {
          if (!(_.isFunction(this.hasDelayedDataBehavior) && this.hasDelayedDataBehavior()) && model !== this || this instanceof Backbone.Collection && !this.length) {
            return;
          }
          if (options.xhr && options.xhr.settings.type !== "GET" && options.xhr.settings.type !== "POST") {
            return;
          }
          if (this.promoteSomeRestCommands) {
            this._requestPromotedActions(this, resp, options);
          } else {
            this._requestDelayedActions(this, resp, options);
          }
        },
        _requestPromotedActions: function(collection) {
          var nodesWithoutActions = [], type;
          this.hasDifferentTypeModels = false;
          this.filter(node => !node.get("csuiDelayedActionsRetrieved")).forEach(node => {
            if (!type) {
              type = node.get("type") === constants.Types.WORKFLOW ? node.get("type") : (node.get("bws_ids") || node.widgetType === widgetConstants.D2.BWS) && !node.get("id")?.startsWith("81") ? "bws_item" : "rest";
              this.delayedActions.menuType = type === constants.Types.WORKFLOW ? constants.MenuTypes.WORKFLOWS : type === "bws_item" ? constants.MenuTypes.BWS_ITEMS : this.options?.d2ActionsOptions?.menuType ?? constants.MenuTypes.CONTEXT;
              this.delayedActions.widgetType = node.collection?.widgetType || this.widgetType || (this.options?.d2ActionsOptions?.widgetType ?? widgetConstants.D2.DOCLIST);
            }
            let isSameType;
            switch (type) {
             case constants.Types.WORKFLOW:
              isSameType = node.get("type") === constants.Types.WORKFLOW;
              break;

             case "bws_item":
              isSameType = (node.get("bws_ids") || node.widgetType === widgetConstants.D2.BWS) && !node.get("id")?.startsWith("81");
              break;

             default:
              isSameType = node.get("type") !== constants.Types.WORKFLOW && (!node.get("bws_ids") && node.widgetType !== widgetConstants.D2.BWS || node.get("id")?.startsWith("81"));
              break;
            }
            if (!isSameType) {
              node.set("csuiDelayedActionsRetrieved", true, {
                silent: true
              });
              this.hasDifferentTypeModels = true;
              nodesWithoutActions.push(node);
            }
          });
          superRequestPromotedActions.call(this, collection);
          nodesWithoutActions.forEach(node => {
            node.unset("csuiDelayedActionsRetrieved", {
              silent: true
            });
          });
        },
        _updateOriginalActions: function() {
          superUpdateOriginalActions.apply(this, arguments);
          this.hasDifferentTypeModels && this._requestPromotedActions.apply(this, arguments);
        },
        _requestsNonPromotedRestActions: function(superMethod) {
          let nodes = this instanceof Backbone.Collection ? this.models : [ this ], nodesWithoutActions = [], type;
          this.hasDifferentTypeNonPromotedModels = false;
          nodes.filter(node => !node.get("csuiLazyActionsRetrieved")).forEach(node => {
            if (!type) {
              type = node.get("type") === constants.Types.WORKFLOW ? node.get("type") : (node.get("bws_ids") || node.widgetType === widgetConstants.D2.BWS) && !node.get("id")?.startsWith("81") ? "bws_item" : "rest";
              this.nonPromotedActionsOptions.menuType = type === constants.Types.WORKFLOW ? constants.MenuTypes.WORKFLOWS : type === "bws_item" ? constants.MenuTypes.BWS_ITEMS : this.options?.d2ActionsOptions?.menuType ?? constants.MenuTypes.CONTEXT;
              this.nonPromotedActionsOptions.widgetType = node.collection?.widgetType || this.widgetType || (this.options?.d2ActionsOptions?.widgetType ?? widgetConstants.D2.DOCLIST);
            }
            let isSameType;
            switch (type) {
             case constants.Types.WORKFLOW:
              isSameType = node.get("type") === constants.Types.WORKFLOW;
              break;

             case "bws_item":
              isSameType = (node.get("bws_ids") || node.widgetType === widgetConstants.D2.BWS) && !node.get("id")?.startsWith("81");
              break;

             default:
              isSameType = node.get("type") !== constants.Types.WORKFLOW && (!node.get("bws_ids") && node.widgetType !== widgetConstants.D2.BWS || node.get("id")?.startsWith("81"));
              break;
            }
            if (!isSameType) {
              node.set("csuiLazyActionsRetrieved", true, {
                silent: true
              });
              this.hasDifferentTypeNonPromotedModels = true;
              nodesWithoutActions.push(node);
            }
          });
          let promise = superRequestsNonPromotedActions?.call(this) || superMethod?.call(this), dfd = $.Deferred();
          nodesWithoutActions.forEach(node => {
            node.unset("csuiLazyActionsRetrieved", {
              silent: true
            });
          });
          promise.done(() => {
            if (this.hasDifferentTypeNonPromotedModels) {
              this._requestsNonPromotedRestActions.call(this).done(dfd.resolve).fail(dfd.reject);
            } else {
              dfd.resolve(this);
            }
          }).fail(dfd.reject);
          return dfd;
        }
      });
    }
  };
});