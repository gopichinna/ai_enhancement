/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['module', 'nuc/lib/backbone', 'nuc/models/mixins/connectable/connectable.mixin'], function (
  module,
  Backbone,
  ConnectableMixin
) {
  var AncestorModel = Backbone.Model.extend({
    constructor: function AncestorModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);

      this.makeConnectable(options);
    },

    idAttribute: null,

    clone: function () {
      return new this.constructor(this.attributes, {
        connector: this.connector
      });
    }
  });

  ConnectableMixin.mixin(AncestorModel.prototype);

  return AncestorModel;
});
