/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery" ], function(_, $) {
  "use strict";
  const WidgetSettingsModelLocalAccessMixin = {
    mixin: function(prototype) {
      return _.extend(prototype, {
        makeWidgetSettingsModelLocalAccess: function(options) {
          options || (options = {});
          return this;
        },
        _storeValues: function(values, collection) {
          if (!collection) {
            collection = this.collection;
          }
          const storeId = values[this.idAttribute];
          const storeAttrs = _.omit(values, this.idAttribute);
          const entries = collection._widgetSettingsLocalStorage.get("entries") || {};
          entries[storeId] = storeAttrs;
          collection._widgetSettingsLocalStorage.set("entries", entries);
        }
      });
    }
  };
  return WidgetSettingsModelLocalAccessMixin;
});