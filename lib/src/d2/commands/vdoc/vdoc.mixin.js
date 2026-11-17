/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "d2/models/virtual.document.children" ], function(_, VirtualDocumentChildren) {
  "use strict";
  var VDocCommandMixin = {
    mixin: function(commandProto) {
      var origEnabled = commandProto.enabled;
      return _.extend(commandProto, {
        enabled: function(status, options) {
          var isEnabled = false;
          if (status.nodes) {
            var nodes = this._getNodesByScope(status, this.get("scope"));
            isEnabled = _.all(nodes, function(node) {
              return !!node && node.get("basePermissions") && node.get("basePermissions").read && node.collection instanceof VirtualDocumentChildren;
            });
          }
          if (isEnabled && _.isFunction(origEnabled)) {
            isEnabled = origEnabled.call(this, status, options);
          }
          return isEnabled;
        }
      });
    }
  };
  return VDocCommandMixin;
});