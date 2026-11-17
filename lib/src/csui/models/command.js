/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/backbone", "csui/utils/commandhelper" ], function(module, _, Backbone, CommandHelper) {
  let config = Object.assign({
    hiddenActions: []
  }, module.config());
  var isNonPromotedMemoized = {};
  var CommandModel = Backbone.Model.extend({
    idAttribute: "signature",
    constructor: function CommandModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    },
    getCommandKey: function() {
      var commandKey = this.get("command_key");
      return commandKey ? Array.isArray(commandKey) ? commandKey : [ commandKey ] : [];
    },
    enabled: function(status, options) {
      const signature = this.get("signature");
      if (config.hiddenActions.includes(signature)) return false; else if (options?.supressCommandKeyValidation) return true; else {
        var scope = this.get("scope");
        var nodes = this._getNodesByScope(status, scope);
        if (scope && !(nodes && nodes.length)) {
          return false;
        }
        var types = this.get("types") || [];
        if (types.length && !this.checkTypes(nodes, types)) {
          return false;
        }
        var openable = this.get("openable");
        if (openable && this.checkOpenability(nodes)) {
          return true;
        }
        var signatures = this.getCommandKey && this.getCommandKey() || this.get("command_key") || [];
        if (openable && !signatures.length) {
          return false;
        }
        return !signatures.length || this.checkPermittedActions(nodes, signatures);
      }
    },
    isNonPromoted: function(status) {
      var scope = this.get("scope"), nodes = this._getNodesByScope(status, scope), signatures = this.getCommandKey && this.getCommandKey() || this.get("command_key") || [], isNonPromoted = false;
      if (!isNonPromotedMemoized[status]) {
        isNonPromotedMemoized[status] = {};
      }
      if (nodes && nodes.length) {
        _.each(nodes, function(node) {
          var nodeId = node.get("id");
          if (!isNonPromotedMemoized[status][nodeId]) {
            var checkFn = this._getNonPromotedCheckFunctionsForSignatures(signatures);
            if (checkFn) {
              var action = checkFn(node);
              if (action && action.get("csuiNonPromotedAction") === true) {
                isNonPromoted = true;
                isNonPromotedMemoized[status][nodeId] = true;
              } else {
                isNonPromotedMemoized[status][nodeId] = false;
              }
            }
          } else if (isNonPromotedMemoized[status][nodeId]) {
            isNonPromoted = true;
          }
        }, this);
      }
      return isNonPromoted;
    },
    _getNodesByScope: function(status, scope) {
      var nodes;
      switch (scope) {
       case "single":
        nodes = CommandHelper.getJustOneNode(status);
        nodes && (nodes = [ nodes ]);
        break;

       default:
        nodes = CommandHelper.getAtLeastOneNode(status).models;
        break;
      }
      return nodes;
    },
    _getCheckFunctionsForSignatures: function(signatures) {
      if (signatures && signatures.length) {
        if (_.isArray(signatures)) {
          return function(node) {
            return _.any(signatures, function(signature) {
              return node.actions && node.actions.findRecursively(signature);
            });
          };
        }
        return function(node) {
          return node.actions && node.actions.findRecursively(signatures);
        };
      }
    },
    _getNonPromotedCheckFunctionsForSignatures: function(signatures) {
      var checkFn;
      if (signatures) {
        if (_.isArray(signatures) && signatures.length) {
          checkFn = function(node) {
            var action;
            _.find(signatures, function(signature) {
              action = node.actions && node.actions.findRecursively(signature);
              return !!action;
            });
            return action;
          };
        } else if (_.isString(signatures)) {
          checkFn = function(node) {
            return node.actions && node.actions.findRecursively(signatures);
          };
        }
      }
      return checkFn;
    },
    checkTypes: function(nodes, types) {
      if (nodes) {
        if (!_.isArray(nodes)) {
          nodes = [ nodes ];
        }
        if (nodes.length) {
          return nodes.every(function(node) {
            return types.indexOf(node.get("type")) >= 0;
          });
        }
      }
      return false;
    },
    checkOpenability: function(nodes) {
      if (nodes) {
        if (!_.isArray(nodes)) {
          nodes = [ nodes ];
        }
        if (nodes.length) {
          return nodes.every(function(node) {
            return node.get("openable");
          });
        }
      }
      return false;
    },
    checkPermittedActions: function(nodes, signatures) {
      if (nodes) {
        if (!_.isArray(nodes)) {
          nodes = [ nodes ];
        }
        if (nodes.length) {
          if (!signatures) {
            signatures = this.getCommandKey && this.getCommandKey() || this.get("command_key") || [];
          }
          var checkNode = this._getCheckFunctionsForSignatures(signatures);
          return !checkNode || _.all(nodes, checkNode);
        }
      }
      return false;
    },
    _getNodeActionForSignature: function(node, signatures) {
      var action;
      if (node) {
        var checkNode = this._getCheckFunctionsForSignatures(signatures);
        if (!!checkNode) {
          action = checkNode.call(this, node);
        }
      }
      return action;
    }
  });
  return CommandModel;
});