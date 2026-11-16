/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/contexts/factories/factory", "nuc/contexts/factories/connector", "csui/utils/commands", "d2/models/aviator/aviator.config.model" ], function(module, _, Backbone, ModelFactory, ConnectorFactory, commands, AviatorConfigModel) {
  "use strict";
  const AviatorConfigModelFactory = ModelFactory.extend({
    propertyPrefix: "aviatorConfig",
    constructor: function AviatorConfigModelFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);
      let model = this.options.aviatorConfig || {};
      if (!(model instanceof Backbone.Model)) {
        const config = module.config(), connector = context.getObject(ConnectorFactory, options), creationOptions = _.extend({
          connector: connector,
          commands: commands.getAllSignatures()
        }, config.options, model.options);
        model = new AviatorConfigModel(model.attributes || config.attributes, creationOptions);
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
  AviatorConfigModelFactory.defaultModel = AviatorConfigModel;
  return AviatorConfigModelFactory;
});