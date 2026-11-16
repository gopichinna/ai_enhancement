/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'dctmw/models/mixins/collection.delayed.data.mixin'
], function(DelayedDataMixinImpl){
  'use strict';

  /**
   * DelayedCollectionData mixin. Can be mixed with any `Backbone.Collection` to create an interface that can be used to
   * retrieve additional data like permission, favorited status, location, etc. and associated those with each model to fully
   * represent them in any view context.
   * This additional data retrieval happens only after the primary collection data has been fetched and thus the name DelayedCollectionData.
   *
   * Collections using this mixin must override `fetchDelayedData()` method to actually fetch the additional data and must call `enableDelayedDataFetch()`
   * post construction to enable the lifecycle hooks associated with this mixin.
   * @see {@link ../../utils/server.query.utils|ServerQueryUtils}
   *
   *
   * @example <caption>A typical collection using this mixin may look like</caption>
   * define([
   *  'nuc/lib/jquery',
   *  'nuc/lib/backbone',
   *  'd2/sdk/models/mixins/collection.delayed.data.mixin'
   * ], function($, Backbone, DelayedCollectionDataMixin){
   *  'use strict';
   *
   *  var MyCollection = Backbone.Collection.extend({
   *    constructor: function MyCollection(models, options) {
   *      options = options || {};
   *      MyCollection.__super__.constructor.call(this, models, options);
   *
   *      this.enableDelayedDataFetch(options);
   *    },
   *
   *    fetchDelayedData: function(options) {
   *      var dfd = $.Deferred();
   *
   *      //Custom logic to fetch the delayed data
   *      //once done, `dfd` should be resolved with the retrieved data.
   *
   *      return dfd.promise();
   *    }
   *  });
   *
   *  DelayedCollectionDataMixin.mixin(MyCollection.prototype);
   *
   *  return MyCollection;
   * });
   *
   * @module {d2/sdk/models/mixins/collection.delayed.data.mixin} d2/sdk/models/mixins/"collection.delayed.data.mixin"
   * @name DelayedCollectionDataMixin
   * @extends {Object}
   *
   */

  var CollectionDelayedDataMixin = {
    /**
     * @name mixin
     * @function
     * @description Fuse the mixin methods to a collection prototype
     * @param {Object} prototype - Target collection prototype where the mixin methods will be fused.
     * @returns {void}
     * @memberOf module:DelayedCollectionDataMixin
     */
    mixin: DelayedDataMixinImpl.mixin
  };

  /**
   * @name enableDelayedDataFetch
   * @function
   * @description To enable binding on the collection lifecycle hooks that will later trigger `fetchDelayedData()` on every collection sync.
   * @param {object} options - constructor options as created and passed during instantiation of the collection.
   * @param {boolean} options.mergeDelayedDataSilently - This controls whether or not to merge the additional data on individual models in silent manner.
   * @returns {*} Reference to the same instance of the collection on which it is called.
   * @instance
   */

  /**
   * @name fetchDelayedData
   * @function
   * @description Triggered every time the collection fetches its primary data. An implementation of this function enables the actual additional data fetch.
   * The default implementation basically does nothing.
   * @param {object} options - Input parameters for the invocation.
   * @param {string[]} options.nodes - The list of id of all the models currently inside this collection.
   * @returns {jQuery.Promise} The returned promise should be resolved with fetched additional data to indicate successful retrieval or should be rejected otherwise.
   * @instance
   * @abstract
   *
   */

  return CollectionDelayedDataMixin
});