/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['nuc/lib/underscore', 'nuc/lib/backbone'], function (
  _,
  Backbone
) {
  'use strict';

  const NodeDefinition2Collection = Backbone.Collection.extend({
    model: Backbone.Model.extend(
      /** @lends NodeDefinition2Collection.prototype
       * @extends extern:Backbone.Collection
       */
      {
        idAttribute: 'key',
        constructor: function NodeDefinition2Model(attributes, options) {
          Backbone.Model.prototype.constructor.call(this, attributes, options);
        }
      }
    ),

    constructor: function NodeDefinition2Collection(models, options) {
      Backbone.Collection.prototype.constructor.call(this, models, options);
    },

  });

  return NodeDefinition2Collection;
});
