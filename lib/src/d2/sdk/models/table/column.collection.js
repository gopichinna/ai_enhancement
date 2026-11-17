/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'd2/models/table/column.collection'
], function(ColumnCollectionImpl){
  'use strict';

  /**
   * A generic Column collection. Used in the context of a {@link ../mixins/browsable.collection.mixin|BrowsableMixin} to contain and define column definitions for a table like view.
   *
   * @module {d2/sdk/models/table/column.collection} d2/sdk/models/table/"column.collection"
   * @name ColumnCollection
   * @extends {external:Backbone.Collection}
   *
   */

  /**
   * @external "Backbone.Model"
   * @see https://backbonejs.org/#Model
   */

  /**
   * @external "Backbone.Collection"
   * @see https://backbonejs.org/#Collection
   */


  var ColumnCollection = ColumnCollectionImpl.extend({});

  return ColumnCollection;
});