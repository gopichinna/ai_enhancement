/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/models/command" ], function(_, CommandModel) {
  "use strict";
  CommandModel.prototype.enabled = function(status) {
    var scope = this.get("scope"), nodes = this._getNodesByScope(status, scope), commandKeys = this.get("command_key"), data = status.data || {};
    if (!commandKeys || commandKeys.length === 0) {
      return true;
    }
    if (_.isString(commandKeys)) {
      commandKeys = [ commandKeys ];
    }
    if (!nodes || nodes.length === 0) {
      return false;
    }
    var enabled = true;
    _.each(nodes, function(node) {
      enabled = enabled && _.some(commandKeys, function(commandKey) {
        var actions = node.actions && node.actions.models;
        if (actions) {
          return _.some(actions, function(action) {
            if (action.get("signature") === commandKey) {
              if (data.menuId) {
                var actionMenuId = (action.get("commandData") || {}).menuId || "";
                return actionMenuId === data.menuId;
              } else {
                return true;
              }
            } else {
              return false;
            }
          });
        }
        return false;
      });
      if (!enabled) {
        return false;
      }
    });
    return enabled;
  };
  CommandModel.prototype.isNonPromoted = function(status) {
    var scope = this.get("scope"), nodes = this._getNodesByScope(status, scope), signatures = this.get("command_key"), isNonPromoted = false;
    if (nodes && nodes.length) {
      var checkFn = getNonPromotedCheckFunctionsForSignaturesAndMenuId(signatures, status.data && status.data.menuId);
      if (checkFn) {
        _.find(nodes, function(node) {
          var action = checkFn(node);
          if (action && action.get("csuiNonPromotedAction") === true && action.get("csuiNonPromotedItem") !== false) {
            isNonPromoted = true;
            return true;
          }
        });
      }
    }
    return isNonPromoted;
  };
  function getNonPromotedCheckFunctionsForSignaturesAndMenuId(signatures, menuId) {
    var checkFn;
    if (signatures) {
      if (_.isArray(signatures) && signatures.length) {
        checkFn = function(node) {
          var action;
          _.find(signatures, function(signature) {
            action = node.actions && node.actions.findRecursively(signature, menuId);
            return !!action;
          });
          return action;
        };
      } else if (_.isString(signatures)) {
        checkFn = function(node) {
          return node.actions && node.actions.findRecursively(signatures, menuId);
        };
      }
    }
    return checkFn;
  }
});