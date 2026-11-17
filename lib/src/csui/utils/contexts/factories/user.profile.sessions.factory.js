/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/backbone", "csui/utils/contexts/factories/factory", "csui/utils/userprofilesessions/impl/userprofilesessions.model" ], function(Backbone, ModelFactory, UserProfileSessionsModel) {
  return ModelFactory.extend({
    propertyPrefix: "UserProfileSessions",
    constructor: function UserProfileSessionsFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);
      let userProfileSessionsModel = options.userProfileSessionsModel || {};
      if (!(userProfileSessionsModel instanceof Backbone.Model)) {
        userProfileSessionsModel = new UserProfileSessionsModel(options);
      }
      this.property = userProfileSessionsModel;
    }
  });
});