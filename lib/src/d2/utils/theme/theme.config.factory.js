/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone", "csui/utils/contexts/factories/factory", "csui/utils/contexts/factories/connector", "d2/utils/theme/theme.config.model" ], function(module, _, Backbone, ModelFactory, ConnectorFactory, ThemeConfigModel) {
  "use strict";
  var ThemeConfigFactory = ModelFactory.extend({
    propertyPrefix: "themeConfig",
    constructor: function ThemeConfigFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);
      var themeConfig = this.options.themeConfig || {};
      if (!(themeConfig instanceof Backbone.Model)) {
        var connector = context.getObject(ConnectorFactory, options), config = module.config();
        themeConfig = new ThemeConfigModel(themeConfig.attributes || config.attributes, _.defaults({
          connector: connector
        }, themeConfig.options, config.options));
      }
      this.property = themeConfig;
    },
    fetch: function(options) {
      return this.property.fetch(options);
    }
  });
  return ThemeConfigFactory;
});