/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "d2/utils/rest.linkrels", "dctmw/server.adaptors/converters/node", "d2/utils/node.version.utils" ], function($, _, RestLinkrels, nodeConverter, nodeVersionUtils) {
  "use strict";
  var ServerAdaptorMixin = {
    mixin: function(prototype) {
      var superSyncMethod = prototype.sync;
      prototype.idAttribute = "id";
      return _.extend(prototype, {
        makeServerAdaptor: function() {
          return this;
        },
        url: function() {
          return RestLinkrels.getLink(this.get("links"), RestLinkrels.SELF);
        },
        sync: function(method, model, options) {
          if (method === "read") {
            var deferred = $.Deferred();
            var oldSuccess = options.success;
            var oldError = options.error;
            options.parse = false;
            options.success = function(response, status, xhr) {
              var content = {
                content: response
              };
              var newres = {
                entries: [ content ]
              };
              nodeVersionUtils.fetchVersionModelData(newres, model.collection.isDisableLocationColumn, model.connector).done(function(data) {
                oldSuccess.call(options.context, data[0], status, xhr);
                deferred.resolve();
              }).fail(function(error) {
                deferred.reject(error);
              });
            };
            options.error = function(xhr, textStatus, error) {
              oldError.apply(options.context, arguments);
              deferred.reject(xhr, textStatus, error);
            };
            superSyncMethod.call(this, method, model, options).fail(deferred.reject);
            return deferred.promise();
          } else {
            return superSyncMethod.call(this, method, model, options);
          }
        },
        getParentId: function(args) {
          let parent_id = args?.status?.container?.get("id"), isValidParentId = function(id) {
            return id?.indexOf("dql_") !== 0;
          };
          if (!parent_id || !isValidParentId(parent_id)) {
            parent_id = this.get("parent_id_expand")?.id || this.get("parent_id");
          }
          return parent_id;
        }
      });
    }
  };
  return ServerAdaptorMixin;
});