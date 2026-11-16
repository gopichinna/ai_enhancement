/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['nuc/lib/underscore', 'nuc/lib/backbone'], function (_, Backbone) {
  var ColumnModel = Backbone.Model.extend({
    constructor: function ColumnModel(_attributes, _options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    },

    idAttribute: null,

    parse: function (response) {
      //~ if (log.debug("Parsing column \"{0}\" ({1}, {2}).",
      //~ response.name, response.column_key, response.id)) {
      //~ console.log(log.last);
      //~ console.log(response);
      //~ }

      // TODO: support these attributes on the server too.
      switch (response.column_key) {
        case 'name':
          response = _.extend(response, {
            default_action: true,
            contextual_menu: false,
            editable: true,
            filter_key: 'name'
          });
          break;
        case 'type':
          response = _.extend(response, {
            default_action: true
          });
          break;
      }

      return response;
    }
  });
  ColumnModel.version = '1.0';

  return ColumnModel;
});
