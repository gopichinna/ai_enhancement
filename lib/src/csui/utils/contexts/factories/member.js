/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/backbone", "csui/utils/contexts/factories/factory", "csui/utils/contexts/factories/connector", "csui/models/member" ], function(module, _, Backbone, ModelFactory, ConnectorFactory, MemberModel) {
  "use strict";
  var MemberModelFactory = ModelFactory.extend({
    propertyPrefix: "member",
    constructor: function MemberModelFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);
      var member = this.options.member || {};
      if (!(member instanceof Backbone.Model)) {
        var connector = context.getObject(ConnectorFactory, options), config = module.config();
        member = new MemberModel(member.attributes || config.attributes, _.defaults({
          connector: connector,
          expand: [ "member" ]
        }, member.options, config.options));
      }
      this.property = member;
    },
    isFetchable: function() {
      return this.property.isFetchable();
    },
    fetch: function(options) {
      return this.property.fetch(options);
    }
  });
  return MemberModelFactory;
});