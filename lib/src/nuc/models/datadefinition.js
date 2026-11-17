/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['nuc/lib/backbone'], function (Backbone) {
  'use strict';

  //
  // Data-Definition Model.
  //
  var DataDefinitionModel = Backbone.Model.extend({
    constructor: function DataDefinitionModel() {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    },

    idAttribute: null,

    parse: function (response) {
      return response;
    }
  });

  DataDefinitionModel.version = '1.0';

  return DataDefinitionModel;
});
