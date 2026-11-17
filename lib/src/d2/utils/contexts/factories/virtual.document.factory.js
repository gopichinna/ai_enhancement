/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone", "csui/utils/contexts/factories/factory" ], function(module, _, Backbone, ModelFactory) {
  "use strict";
  var VirtualDocument = Backbone.Model.extend({
    constructor: function VirtualDocument(attributes, options) {
      return Backbone.Model.prototype.constructor.call(this, attributes, options);
    }
  });
  var VirtualDocumentFactory = ModelFactory.extend({
    propertyPrefix: "virtualDocument",
    constructor: function VirtualDocumentFactory() {
      ModelFactory.prototype.constructor.apply(this, arguments);
      var virtualDocument = this.options.virtualDocument || {};
      if (!(virtualDocument instanceof VirtualDocument)) {
        var config = module.config();
        virtualDocument = new VirtualDocument(virtualDocument.attributes || config.attributes, _.defaults({}, virtualDocument.options, config.options));
      }
      this.property = virtualDocument;
    },
    isFetchable: function() {
      return false;
    }
  });
  VirtualDocumentFactory.defaultModel = VirtualDocument;
  return VirtualDocumentFactory;
});