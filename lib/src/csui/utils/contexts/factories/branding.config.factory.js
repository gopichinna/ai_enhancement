/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/backbone", "csui/utils/contexts/factories/factory" ], function(module, _, Backbone, BrandingConfigFactory) {
  var BrandingConfigModel = Backbone.Model.extend({});
  return BrandingConfigFactory.extend({
    BrandingConfigModelPrefix: "BrandingConfigModel",
    propertyPrefix: "BrandingConfigModel",
    constructor: function BrandingConfigModelFactory(context, options) {
      BrandingConfigFactory.prototype.constructor.apply(this, arguments);
      var brandingConfigModel = this.options.brandingConfigModel || {};
      if (!(brandingConfigModel instanceof Backbone.Model)) {
        var config = module.config();
        brandingConfigModel = new BrandingConfigModel(brandingConfigModel.models, _.extend({}, brandingConfigModel.options, config.options));
      }
      this.property = brandingConfigModel;
    }
  });
});