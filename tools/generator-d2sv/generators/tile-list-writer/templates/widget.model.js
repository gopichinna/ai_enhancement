define([
  'nuc/lib/underscore',
  'd2/sdk/models/node.model'
], function(_, NodeModel){
  'use strict';

  var <%= typedNamePrefix %>Model = NodeModel.extend({
      constructor: function <%= typedNamePrefix %>Model(attributes, options) {
        options = options || {};
        this.options = options;

        <%= typedNamePrefix %>Model.__super__.constructor.call(this, attributes, options);

        //TODO: Any code to further supplement this model post construction.
      },

      parse: function(response) {
        //TODO: Adjust implementation based on server's response structure
        
        return response;
      }
  });

  return <%= typedNamePrefix %>Model;
});