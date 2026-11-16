/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['nuc/lib/backbone'], function (Backbone) {
  'use strict';

  var NodeColumn2Model = Backbone.Model.extend({
    id: 'column_key',

    constructor: function NodeColumn2Model(attributes, options) {
      Backbone.Model.prototype.constructor.call(this, attributes, options);
    }
  });

  var NodeColumn2Collection = Backbone.Collection.extend({
    model: NodeColumn2Model,

    constructor: function NodeColumn2Collection(models, options) {
      Backbone.Collection.prototype.constructor.call(this, models, options);
    }
  });

  return NodeColumn2Collection;
});
