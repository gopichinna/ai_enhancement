/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/utils/url", "csui/models/widget/settings/impl/widget.settings.model.local.access.mixin" ], function(_, $, Url, WidgetSettingsModelLocalAccessMixin) {
  "use strict";
  const ServerAdaptorMixin = {
    mixin: function(prototype) {
      WidgetSettingsModelLocalAccessMixin.mixin(prototype);
      return _.extend(prototype, {
        makeServerAdaptor: function(options) {
          options || (options = {});
          this.makeWidgetSettingsModelLocalAccess(options);
          return this;
        },
        sync: function(method, model, options) {
          options || (options = {});
          const deferred = $.Deferred();
          switch (method) {
           case "read":
            deferred.reject(new Error(`Cannot get widget settings for one widget only`));
            break;

           case "create":
           case "update":
           case "patch":
            {
              if (!model.get(model.idAttribute)) {
                deferred.reject(new Error(`Can't save without attribute ${model.idAttribute}`));
                break;
              }
              this.trigger("request", this, deferred.promise(), options);
              const attributes = _.clone(model.attributes);
              const collection = this.collection;
              setTimeout(() => {
                this._storeValues(attributes, collection);
                options.success && options.success.call(this, attributes);
                deferred.resolve(model);
              });
              break;
            }

           default:
            deferred.reject(new Error(`unknown method ${method} specified`));
          }
          return deferred.promise();
        }
      });
    }
  };
  return ServerAdaptorMixin;
});