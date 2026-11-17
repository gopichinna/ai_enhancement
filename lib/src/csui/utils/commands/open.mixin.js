/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/jquery", "csui/lib/underscore", "csui/utils/url", "csui/utils/commandhelper" ], function(module, $, _, Url, CommandHelper) {
  "use strict";
  var config = _.extend({
    isAdvancedVersionEnable: true
  }, module.config());
  const OpenMixin = {
    mixin: function(prototype) {
      return _.extend(prototype, {
        checkRendition: function(status, options) {
          const node = CommandHelper.getJustOneNode(status);
          const deferred = $.Deferred();
          const unsupportedTypes = [ 749 ];
          const type = node.get("type");
          const versions = node.get("data")?.versions;
          if (versions?.length && !unsupportedTypes.includes(type)) {
            if (node.get("rendition_type")) {
              deferred.resolve(true);
            }
            const url = this.getUrl(node, options);
            const queryOptions = {
              type: "GET",
              url: url
            };
            node.connector.makeAjaxCall(queryOptions).done(function(response) {
              const renditions = response.results.data, renditionType = renditions.length && renditions[0].rendition_type;
              if (!!renditionType) {
                node.set("rendition_type", renditionType);
                deferred.resolve(true);
              } else {
                deferred.resolve(false);
              }
            }).fail(function() {
              deferred.resolve(false);
            });
          } else {
            deferred.resolve(false);
          }
          return deferred.promise();
        },
        getVersionNumber: function(versions, node) {
          if (!config.isAdvancedVersionEnable) {
            for (let i = versions.length - 1; i > -1; i--) {
              if (versions[i].version_number_minor === 0) {
                node.set("hasMajorVersion", true);
                return versions[i].version_number;
              }
            }
          }
          return versions[versions.length - 1].version_number;
        },
        getUrl: function(node, options) {
          const connector = node.connector || options && options.connector;
          const versions = node.get("data").versions;
          const versionNumber = this.getVersionNumber(versions, node);
          return Url.combine(connector.getConnectionUrl().getApiBase("v2"), "nodes", node.attributes.id, "versions", versionNumber, "renditions");
        }
      });
    }
  };
  return OpenMixin;
});