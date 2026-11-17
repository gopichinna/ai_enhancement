/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/jquery", "csui/lib/marionette", "csui/utils/taskqueue", "csui/models/permission/permission.precheck", "csui/utils/permissions/permissions.subtypesWithFolder" ], function(module, _, $, Marionette, TaskQueue, PermissionPrecheckModel, permissionsSubtypesWithFolder) {
  var config = module.config();
  _.defaults(config, {
    parallelism: 6
  });
  var PermissionPrecheck = {
    includeSubTypesWithFolder: function() {
      return permissionsSubtypesWithFolder;
    },
    includeSubTypes: function() {
      return [ 204, 207, 215, 298, 3030202 ];
    },
    fetchPermissionsPreCheck: function(options) {
      this.options = options;
      this.connector = options.connector || options.model.connector;
      this.options.applyTo.subTypes = [];
      var self = this, subTypes = this.includeSubTypesWithFolder(), queue = new TaskQueue({
        parallelism: config.parallelism
      }), nodeID = self.options.model ? self.options.model.get("id") : self.options.node.get("id"), promises = _.map(subTypes, function(subType) {
        var deferred = $.Deferred();
        queue.pending.add({
          worker: function() {
            var permissionPrecheckModel = new PermissionPrecheckModel({
              id: nodeID,
              subType: subType,
              include_sub_items: false
            }, {
              connector: self.connector
            });
            permissionPrecheckModel.fetch().then(_.bind(function(response) {
              if (response.results.data.subtypes_info !== undefined) {
                self.options.applyTo.subTypes.push(response.results.data.subtypes_info[0].id);
              }
              self.options.applyTo.thresholdExceeded = response.results.data.threshold_exceeded;
              deferred.resolve(response);
            })).fail(function(response) {
              deferred.reject(response);
            });
            return deferred.promise();
          }
        });
        return deferred.promise(promises);
      });
      return $.whenAll.apply($, promises);
    }
  };
  return PermissionPrecheck;
});