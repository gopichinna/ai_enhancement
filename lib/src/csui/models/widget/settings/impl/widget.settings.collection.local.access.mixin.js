/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/utils/namedlocalstorage" ], function(_, NamedLocalStorage) {
  "use strict";
  const WidgetSettingsCollectionLocalAccessMixin = {
    mixin: function(prototype) {
      return _.extend(prototype, {
        makeWidgetSettingsCollectionLocalAccess: function(options) {
          options || (options = {});
          this._widgetSettingsLocalStorage = new NamedLocalStorage("csui/models/widget/settings");
          return this;
        },
        _readList: function(options) {
          options || (options = {});
          let entries = this._widgetSettingsLocalStorage.get("entries") || {};
          let idAttribute = this.model.prototype.idAttribute || "id";
          let widgetSettings = Object.keys(entries).map(key => {
            entries[key][idAttribute] = key;
            return entries[key];
          });
          return widgetSettings;
        }
      });
    }
  };
  return WidgetSettingsCollectionLocalAccessMixin;
});