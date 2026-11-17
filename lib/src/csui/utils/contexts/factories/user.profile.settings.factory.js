/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/backbone", "csui/utils/contexts/factories/factory", "csui/utils/usersettings/impl/usersettings.model" ], function(Backbone, ModelFactory, UserSettingsModel) {
  return ModelFactory.extend({
    propertyPrefix: "UserProfileSettings",
    constructor: function UserProfileSettingsFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);
      let userSettingsModel = options.userSettingsModel || {};
      if (!(userSettingsModel instanceof Backbone.Model)) {
        userSettingsModel = new UserSettingsModel(options);
      }
      this.property = userSettingsModel;
    }
  });
});