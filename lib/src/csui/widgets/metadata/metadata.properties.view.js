/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/widgets/metadata/impl/metadata.properties.view", "css!csui/widgets/metadata/impl/metadata" ], function(module, _, MetadataPropertiesViewImpl) {
  var config = module.config();
  _.defaults(config, {
    topAlignLabel: false
  });
  var MetadataPropertiesView = MetadataPropertiesViewImpl.extend({
    constructor: function MetadataPropertiesView(options) {
      options.topAlignLabel = config.topAlignLabel;
      MetadataPropertiesViewImpl.prototype.constructor.apply(this, arguments);
    },
    validateForms: function() {
      return MetadataPropertiesViewImpl.prototype.validateForms.apply(this, arguments);
    },
    getFormsValues: function() {
      return MetadataPropertiesViewImpl.prototype.getFormsValues.apply(this, arguments);
    },
    getViewName: function() {
      return "MetadataPropertiesView";
    }
  });
  return MetadataPropertiesView;
});