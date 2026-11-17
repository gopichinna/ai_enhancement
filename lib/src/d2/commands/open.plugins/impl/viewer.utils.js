/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/utils/url", "nuc/lib/backbone", "d2/utils/constants", "dctmw/utils/rest.resources", "i18n!d2/commands/open.plugins/nls/localized.strings", "d2/utils/rest.linkrels", "d2/utils/server.query.utils" ], function($, _, Url, Backbone, constants, RestResources, lang, RestLinkrels, serverQueryUtils) {
  "use strict";
  var viewerUtils = {
    isRelatePermission: function(connector, objectIds) {
      var def = $.Deferred(), currentUser = RestResources.getCurrentUser();
      if (currentUser && currentUser.attributes && currentUser.attributes.properties && currentUser.attributes.properties.client_capability === 1) {
        return def.resolve(false).promise();
      }
      var parameters = {
        ids: objectIds,
        connector: connector,
        permissions: {
          permissionLevel: constants.Permissions.RELATE
        }
      };
      serverQueryUtils.fetchDataForObjects(parameters).done(function(result) {
        var permission = _.reduce(objectIds, function(permission, objectId) {
          return permission && (result.permissions && result.permissions[objectId] && result.permissions[objectId]["base-permission"] && result.permissions[objectId]["base-permission"][constants.Permissions.RELATE]);
        }, true);
        def.resolve(permission);
      }).fail(function() {
        def.resolve(false);
      });
      return def.promise();
    },
    checkAndHideOption: function(model, signature, option, hideOptions) {
      const hasAction = Boolean(model?.actions?.findWhere?.({
        signature: signature
      }));
      if (!hasAction) {
        hideOptions.add(option);
      }
    }
  };
  return viewerUtils;
});