/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['nuc/lib/underscore', 'nuc/lib/backbone', 'nuc/models/nodechildrencolumn'], function (
  _,
  Backbone,
  NodeChildrenColumnModel
) {
  'use strict';

  //
  // Column model collection from the node children call (nodes/{id}/nodes) and other browse calls
  //
  var NodeChildrenColumnCollection = Backbone.Collection.extend({
    model: NodeChildrenColumnModel,

    constructor: function NodeChildrenColumnCollection(_models, _options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
      this.fetched = false;
    },

    // private: reset the collection.  For performance purpose and prevent UI table redraw, this
    //          method will not reset if the models is the same as the cached one.
    resetCollection: function (models, options) {
      if (this.cachedColumns && _.isEqual(models, this.cachedColumns)) {
        return;
      }
      // Make a clone of the model array for the cache to let it be equal even if attributes are
      // added to objects of the array (which is done in this.reset where the constructor of the
      // NodeChildrenColumnModel adds a translated title attribute
      this.cachedColumns = _.map(models, function (model) {
        return _.clone(model);
      });

      this.reset(models, options);
      this.fetched = true;
    },

    // private
    getColumnModels: function (columnKeys, definitions) {
      var columns = _.reduce(
        columnKeys,
        function (colArray, column) {
          if (column.indexOf('_formatted') >= 0) {
            var shortColumnName = column.replace(/_formatted$/, '');
            if (definitions[shortColumnName]) {
              // there is also the column without the trailing _formatted: skip this and use this
              // instead
              return colArray;
            }
          } else {
            // copy the definitions_order from the *_formatted column to the non-formatted column
            var definition_short = definitions[column];
            if (definition_short && !definition_short.definitions_order) {
              var definition_formatted = definitions[column + '_formatted'];
              if (definition_formatted && definition_formatted.definitions_order) {
                definition_short.definitions_order = definition_formatted.definitions_order;
              }
            }
          }
          var definition = definitions[column];

          // Code from old code to keep node table code working.  Will look more into this after June.
          // TODO: support these attributes on the server too.
          switch (column) {
            case 'name':
              definition = _.extend(definition, {
                default_action: true,
                contextual_menu: false,
                editable: true,
                filter_key: 'name'
              });
              break;
            case 'type':
              definition = _.extend(definition, {
                default_action: true
              });
              break;
            case 'modify_date':
              definition = _.extend(definition, {
                initialSortingDescending: true
              });
              break;
          }

          colArray.push(_.extend({ column_key: column }, definition));
          return colArray;
        },
        []
      );
      return columns;
    },

    //
    // methods for REST API V1
    //

    // public
    resetColumns: function (response, options) {
      this.resetCollection(this.getV1Columns(response, options), options);
    },

    // private
    getV1Columns: function (response, options) {
      var definitions = response.definitions,
        columnKeys = options && options.columnsFromDefinitionsOrder ? response.definitions_order : _.keys(definitions);

      // merge definitions_order into definitions as definitions_order attribute
      if (response.definitions_order) {
        for (var idx = 0; idx < response.definitions_order.length; idx++) {
          var column_key = response.definitions_order[idx],
            definition = definitions[column_key];
          // definitions_order can be passed via options and does not need
          // to match with the server response; guard against mismatches
          if (definition) {
            definition.definitions_order = 500 + idx;
          }
        }
      }

      return this.getColumnModels(columnKeys, definitions);
    },

    //
    // methods for REST API V2
    //

    // public
    resetColumnsV2: function (response, options) {
      this.resetCollection(this.getV2Columns(response), options);
    },

    // private: convert v2 'metadata' to v1 'definitions' for backward code compatibility and
    //          reuse purpose
    getV2Columns: function (response) {
      // Note: from a long discussion with the server developer, use the common 'metadata' (or
      // called 'definitions' in v1) in the first element. Elements in the collection can have
      // different extended metadata (definitions).  If a business case arises that
      // extended definitions are needed, will discuss again with them and add that support.

      var definitions =
        (response.results &&
          response.results[0] &&
          response.results[0].metadata &&
          response.results[0].metadata.properties) ||
        {};

      // For v2 calls, the 'size' column is not available.  Either the 'container_size' or
      // 'file_size' is available.  Create a 'size' definition here for compatibility with existing
      // code.
      if (
        !definitions.size &&
        (definitions.container_size || (definitions.versions && definitions.versions.file_size))
      ) {
        definitions.size = definitions.container_size || definitions.versions.file_size;
        definitions.size.align = 'right';
        definitions.size.key = 'size';
        definitions.size.name = 'Size';
      }

      var columnKeys = _.keys(definitions);

      return this.getColumnModels(columnKeys, definitions);
    }
  });
  NodeChildrenColumnCollection.version = '1.0';

  return NodeChildrenColumnCollection;
});
