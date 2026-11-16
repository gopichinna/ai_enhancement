/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/backbone", "csui/utils/contexts/factories/factory", "csui/utils/contexts/factories/connector", "csui/models/recycle.bin" ], function(module, _, Backbone, ModelFactory, ConnectorFactory, RecycleBinVolumeModel) {
  "use strict";
  const RecycleBinVolumeModelFactory = ModelFactory.extend({
    propertyPrefix: "recycleBin",
    constructor: function RecycleBinVolumeModelFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);
      let recycleBin = this.options.recycleBin || {};
      if (!(recycleBin instanceof Backbone.Model)) {
        const connector = context.getObject(ConnectorFactory, options), config = module.config();
        recycleBin = new RecycleBinVolumeModel(recycleBin.attributes || config.attributes, _.defaults({
          connector: connector
        }, recycleBin.options, config.options));
      }
      this.property = recycleBin;
    },
    isFetchable: function() {
      return true;
    },
    fetch: function(options) {
      return this.property.fetch(options);
    }
  });
  return RecycleBinVolumeModelFactory;
});