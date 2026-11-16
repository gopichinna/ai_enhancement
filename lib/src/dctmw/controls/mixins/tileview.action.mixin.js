/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/utils/defaultactionitems", "csui/utils/commands" ], function(_, defaultActionItems, commands) {
  "use strict";
  return {
    mixin: function(prototype) {
      return _.extend(prototype, {
        makeTileViewActionable: function(options) {
          this._handleMetadataUpdateEvent(options);
          if (options.handleDeleteEvent) {
            this._deleteItemsOnEvent(options, "d2:objects:deleted");
          }
          if (options.handleReserveEvents) {
            this._fullRefreshOnEvent(options, "d2:objects:reserved");
            this._fullRefreshOnEvent(options, "d2:objects:versionadded");
            this._deleteItemsOnEvent(options, "d2:objects:unreserved");
          } else {
            this._refreshItemMenuOnEvent(options, "d2:objects:reserved d2:objects:unreserved d2:objects:versionadded");
          }
          if (options.handleCoreEvents) {
            this._fullRefreshOnEvent(options, "d2:objects:shared");
            this._deleteItemsOnEvent(options, "d2:objects:unshared");
          } else {
            this._refreshItemMenuOnEvent(options, "d2:objects:shared d2:objects:unshared");
          }
          return this;
        },
        _handleMetadataUpdateEvent: function(options) {
          var me = this;
          me.listenTo(options.context, "d2:object:metadataupdated", function(nodeAttrs) {
            options.collection.each(function(item) {
              if (item.get("id") === nodeAttrs.id) {
                item.set("name", nodeAttrs.name);
                return false;
              }
            });
          });
        },
        _fullRefreshOnEvent: function(options, eventName) {
          var me = this;
          me.listenTo(options.context, eventName, function() {
            options.collection.fetch({
              reload: true
            });
          });
        },
        _refreshItemMenuOnEvent: function(options, eventName) {
          var me = this;
          me.listenTo(options.context, eventName, function(ids) {
            if (!_.isArray(ids)) {
              ids = [ ids ];
            }
            var defaultCmds = defaultActionItems.getAllCommandSignatures(commands);
            defaultCmds.push("properties");
            options.collection.each(function(item) {
              if (_.contains(ids, item.get("id"))) {
                item.unset("csuiLazyActionsRetrieved");
                item.setEnabledLazyActionCommands(false);
                var actions = item.actions.toArray(), length = actions.length;
                for (var i = length - 1; i >= 0; i--) {
                  if (!_.contains(defaultCmds, actions[i].get("signature"))) {
                    item.actions.remove(actions[i]);
                  }
                }
              }
            });
          });
        },
        _deleteItemsOnEvent: function(options, eventName) {
          var me = this;
          me.listenTo(options.context, eventName, function(ids) {
            if (!_.isArray(ids)) {
              ids = [ ids ];
            }
            var coll = options.collection.toArray(), length = coll.length;
            for (var i = length - 1; i >= 0; i--) {
              if (_.contains(ids, coll[i].get("id"))) {
                options.collection.remove(coll[i]);
              }
            }
          });
        }
      });
    }
  };
});