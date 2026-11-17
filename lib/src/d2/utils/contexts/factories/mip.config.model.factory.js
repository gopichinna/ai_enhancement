/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/contexts/factories/factory", "nuc/contexts/factories/connector", "csui/utils/commands", "d2/models/mip/mip.config.model" ], function(module, _, Backbone, ModelFactory, ConnectorFactory, commands, MipConfigModel) {
  "use strict";
  const MipConfigModelFactory = ModelFactory.extend({
    propertyPrefix: "mipConfig",
    constructor: function MipConfigModelFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);
      let model = this.options.mipConfig || {};
      if (!(model instanceof Backbone.Model)) {
        const config = module.config(), connector = context.getObject(ConnectorFactory, options), creationOptions = _.extend({
          connector: connector,
          commands: commands.getAllSignatures()
        }, config.options, model.options);
        model = new MipConfigModel(model.attributes || config.attributes, creationOptions);
      }
      this.property = model;
    },
    isFetchable: function() {
      const propertyFetcahble = !_.isFunction(this.property.isFetchable) || this.property.isFetchable();
      return this.options.permanent === true ? propertyFetcahble : this.property.fetched !== true && propertyFetcahble;
    },
    fetch: function(options) {
      return this.property.fetch(options);
    }
  });
  MipConfigModelFactory.defaultModel = MipConfigModel;
  return MipConfigModelFactory;
});