/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/utils/url", "module", "nuc/utils/log", "csui/models/widget/settings/impl/widget.settings.collection.local.access.mixin" ], function(_, $, Url, module, log, WidgetSettingsCollectionLocalAccessMixin) {
  "use strict";
  log = log(module.id);
  const ServerAdaptorMixin = {
    mixin: function(prototype) {
      WidgetSettingsCollectionLocalAccessMixin.mixin(prototype);
      return _.extend(prototype, {
        makeServerAdaptor: function(options) {
          options || (options = {});
          this.makeWidgetSettingsCollectionLocalAccess(options);
          return this;
        },
        sync: function(method, model, options) {
          options || (options = {});
          const deferred = $.Deferred();
          switch (method) {
           case "read":
            this.trigger("request", this);
            setTimeout(() => {
              let widgetSettings = this._readList(options);
              log.debug("widget settings collection fetched") && console.log(log.last);
              options.success && options.success.call(this, widgetSettings);
              deferred.resolve(widgetSettings);
            });
            break;

           case "create":
           case "update":
           case "patch":
            deferred.reject(new Error(`Cannot save widget settings collection as a whole`));
            break;

           default:
            deferred.reject(new Error(`Unknown method ${method} specified in sync of widget settings collection`));
          }
          return deferred.promise();
        }
      });
    }
  };
  return ServerAdaptorMixin;
});