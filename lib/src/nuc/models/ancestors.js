/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['module', 'nuc/lib/backbone', 'nuc/utils/log', 'nuc/models/ancestor'], function (
  module,
  Backbone,
  log,
  AncestorModel
) {
  var AncestorCollection = Backbone.Collection.extend({
    model: AncestorModel,

    constructor: function AncestorCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);

      this.options = options || {};
    }
  });
  AncestorCollection.version = '1.0';

  return AncestorCollection;
});
