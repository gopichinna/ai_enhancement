/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/contexts/factories/connector", "nuc/utils/url", "dctmw/models/formats", "dctmw/utils/authenticators/session", "dctmw/utils/rest.linkrels", "dctmw/utils/rest.resources", "dctmw/utils/utils", "css!dctmw/controls/controls" ], function(require, $, _, ConnectorFactory, Url, FormatCollection, Session, RestLinkrels, RestResources, utils) {
  "use strict";
  return {
    beforeStartup: function(options = {}) {
      _.defaults(options, {
        context: Session.get().getContext()
      });
      return this.fetchStartupData(options).then(() => {
        const dfdInner = $.Deferred();
        require([ "dctmw/utils/startup.hooks" ], function(startupHooks) {
          startupHooks.beforeStartup(options).done(dfdInner.resolve).fail(dfdInner.reject);
        }, dfdInner.reject);
        return dfdInner.promise();
      });
    },
    afterStartup: function(options = {}) {
      const dfd = $.Deferred();
      _.defaults(options, {
        context: Session.get().getContext()
      });
      require([ "dctmw/utils/startup.hooks" ], function(startupHooks) {
        startupHooks.afterStartup(options).done(dfd.resolve).fail(dfd.reject);
      }, dfd.reject);
      return dfd.promise();
    },
    fetchStartupData: function(options) {
      const dfd = $.Deferred(), currRepoLinks = RestResources.getCurrentRepository().get("links"), batchPayload = [ {
        id: "formats",
        request: {
          method: "GET",
          uri: Url.appendQuery(RestLinkrels.getLink(currRepoLinks, RestLinkrels.FORMATS), Url.combineQueryString({
            inline: true,
            "items-per-page": 1e5
          }))
        }
      } ];
      utils.makeBatchAjaxCall({
        connector: options.context.getObject(ConnectorFactory),
        operations: batchPayload
      }).done((successful, failed) => {
        if (failed && failed.length > 0) {
          dfd.reject();
          return;
        }
        _.each(successful, operation => {
          const data = operation.output;
          switch (operation.id) {
           case "formats":
            const formats = (data.entries || []).map(function(entry) {
              return _.extend(_.pick(entry.content, "is-default"), _.pick(entry.content.properties, "name", "r_object_id", "mime_type", "dos_extension", "description", "is_hidden"));
            });
            RestResources.setFormats(new FormatCollection(formats));
            break;
          }
        });
        dfd.resolve();
      }).fail(dfd.reject);
      return dfd.promise();
    }
  };
});