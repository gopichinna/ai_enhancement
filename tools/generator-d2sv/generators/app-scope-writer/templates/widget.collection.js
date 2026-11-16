define([
  'nuc/lib/jquery',
  'nuc/lib/underscore',
  'nuc/lib/backbone',
  'nuc/utils/url',
  'd2/sdk/models/node.model',
  'd2/sdk/models/mixins/collection.resource.mixin',
  '<%= namespace %>/models/table/<%= typedModulePrefix %>.column.collection'
], function($, _, Backbone, Url, NodeModel, CollectionResourceMixin, <%= typedNamePrefix %>ColumnCollection){
  'use strict';

  var <%= typedNamePrefix %>Collection = Backbone.Collection.extend({
    model: NodeModel,
    widgetType: '<%= type %>',

    constructor: function <%= typedNamePrefix %>Collection(models, options) {
      options = options || {};
      options.ColumnCollectionClass = <%= typedNamePrefix %>ColumnCollection;
      this.options = options;

      <%= typedNamePrefix %>Collection.__super__.constructor.call(this, models, options);

      this.makeCollectionResource(options);

      //TODO: Any code to further supplement this collection post construction.
    },

    url: function() {
      //TODO: Form and return the URL that will be used to make AJAX call while filling in this collection.

      return '';
    },

    parse: function (response/*, options*/) {
      //TODO: Adjust implementation based on server's response structure
      
      return (response.entries || []).map(function (entry) {
        return entry.content;
      });
    }
  });

  CollectionResourceMixin.mixin(<%= typedNamePrefix %>Collection.prototype);

  return <%= typedNamePrefix %>Collection;
});