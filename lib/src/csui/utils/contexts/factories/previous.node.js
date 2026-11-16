/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/backbone", "csui/utils/contexts/factories/factory", "csui/utils/contexts/factories/connector", "csui/models/node/node.model" ], function(module, _, Backbone, ModelFactory, ConnectorFactory, NodeModel) {
  "use strict";
  var PreviousNodeModelFactory = ModelFactory.extend({
    propertyPrefix: "previousNode",
    constructor: function PreviousNodeModelFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);
      var connector = context.getObject(ConnectorFactory, options), config = module.config();
      this.property = new NodeModel(undefined, _.defaults({
        connector: connector
      }, config.options));
    }
  });
  return PreviousNodeModelFactory;
});