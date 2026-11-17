/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/backbone", "csui/utils/contexts/factories/connector", "csui/utils/contexts/factories/factory", "csui/models/server.info" ], function(Backbone, ConnectorFactory, ModelFactory, ServerInfoModel) {
  var ServerInfoModelFactory = ModelFactory.extend({
    propertyPrefix: "serverInfo",
    constructor: function ServerInfoModelFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);
      var connector = context.getObject(ConnectorFactory, {
        permanent: true
      }), serverInfoModel = this.options.serverInfoModel || {};
      if (!(serverInfoModel instanceof Backbone.Model)) {
        serverInfoModel = new ServerInfoModel(undefined, {
          connector: connector
        });
      }
      this.property = serverInfoModel;
    }
  });
  return ServerInfoModelFactory;
});