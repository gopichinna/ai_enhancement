/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/models/actions" ], function(_, ActionCollection) {
  "use strict";
  _.extend(ActionCollection.prototype, {
    modelId: function(attrs) {
      var id = attrs.signature, data = attrs.commandData;
      if (data && data.menuId) {
        id = id + "_" + data.menuId;
      }
      return id;
    },
    get: function(obj) {
      if (obj == null) {
        return void 0;
      }
      var output = this._byId[obj];
      if (output) {
        return output;
      }
      if (this._isModel(obj)) {
        output = this._byId[this.modelId(obj.attributes)];
        if (output) {
          return output;
        }
      }
      output = this.findWhere(_.isObject(obj) ? obj : {
        signature: obj
      });
      if (output) {
        return output;
      }
      return obj.cid && this._byId[obj.cid];
    },
    findRecursively: function(id, menuId) {
      var action = this.get({
        cid: id
      }) || this.find(function(item) {
        if (item.get("signature") === id) {
          if (menuId) {
            return item.get("commandData") && item.get("commandData").menuId === menuId;
          } else {
            return true;
          }
        }
      });
      if (!action) {
        action = _.find(this.map(function(item) {
          return item.children.findRecursively(id);
        }), function(item) {
          return item;
        });
      }
      return action;
    }
  });
});