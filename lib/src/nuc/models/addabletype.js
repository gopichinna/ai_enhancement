/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['nuc/lib/backbone'], function (Backbone) {
  var AddableTypeModel = Backbone.Model.extend({
    constructor: function AddableTypeModel() {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    },

    parse: function (response) {
      //~ if (log.debug("Parsing addableItem \"{0}\" ({1}, {2}).",
      //~ response.name, response.id, response.type)) {
      //~ console.log(log.last);
      //~ console.log(response);
      //~ }

      return response;
    }
  });
  AddableTypeModel.version = '1.0';
  AddableTypeModel.Hidden = -1;

  return AddableTypeModel;
});
