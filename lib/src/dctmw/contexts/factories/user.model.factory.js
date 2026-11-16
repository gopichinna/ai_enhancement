/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/contexts/factories/factory", "nuc/contexts/factories/connector", "nuc/models/member/member.model" ], function(module, _, Backbone, ModelFactory, ConnectorFactory, MemberModel) {
  "use strict";
  const UserModelFactory = ModelFactory.extend({
    propertyPrefix: "user",
    constructor: function UserModelFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);
      let user = this.options.user || {};
      if (!(user instanceof Backbone.Model)) {
        const config = module.config(), connector = context.getObject(ConnectorFactory, options), creationOptions = _.extend({
          connector: connector
        }, config.options, user.options);
        user = new MemberModel(user.attributes || config.attributes || {}, creationOptions);
      }
      this.property = user;
    },
    isFetchable: function() {
      const propertyFetcahble = this.property.isFetchable();
      return this.options.permanent === true ? propertyFetcahble : this.property.fetched !== true && propertyFetcahble;
    },
    fetch: function(options) {
      return this.property.fetch(options);
    }
  });
  UserModelFactory.defaultModel = MemberModel;
  return UserModelFactory;
});