/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['module', 'nuc/lib/underscore', 'nuc/contexts/factories/factory', 'nuc/utils/connector'], function (
  module,
  _,
  ObjectFactory,
  Connector
) {
  var ConnectorFactory = ObjectFactory.extend({
    propertyPrefix: 'connector',

    constructor: function ConnectorFactory(_context, _options) {
      ObjectFactory.prototype.constructor.apply(this, arguments);

      var connector = this.options.connector || {};
      if (!(connector instanceof Connector)) {
        var config = module.config(),
          // The single connection object is used to share authentication
          // among contexts if stored in config; it cannot be cloned
          // TODO: Clone the connection. Modifying the global configuration
          // makes it accessible globally and sensive data easier to steal.
          connection = connector.connection || config.connection || {};
        // The connection object can be merged from multiple sources, which
        // may define connection and authentication parameters separately
        var privateConnection = _.defaults({}, connection, connector.connection, config.connection);
        connector = new Connector(
          _.defaults(
            {
              connection: privateConnection
            },
            connector,
            config
          )
        );
      }
      this.property = connector;
    }
  });

  return ConnectorFactory;
});
