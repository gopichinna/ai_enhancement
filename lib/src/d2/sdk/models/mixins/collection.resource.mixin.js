/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'nuc/lib/underscore',
  'd2/sdk/models/mixins/browsable.collection.mixin',
  'd2/sdk/models/mixins/commandable.mixin',
  'd2/sdk/models/mixins/resource.mixin'
], function (_, BrowsableCollectionMixin, CommandableMixin, ResourceMixin) {
  'use strict';

  /**
   * CollectionResource mixin. This is a utility to conveniently enable AJAX, Browsable & Commandable capabilities onto a `Backbone.Collection`.
   *
   * @example <caption>A typical collection using this mixin may look like</caption>
   * define([
   *  'nuc/lib/backbone',
   *  'd2/sdk/models/mixins/collection.resource.mixin'
   * ], function(Backbone, CollectionResourceMixin){
   *  'use strict';
   *
   *  var MyCollection = Backbone.Collection.extend({
   *    constructor: function MyCollection(models, options) {
   *      options = options || {};
   *      MyCollection.__super__.constructor.call(this, models, options);
   *
   *      this.makeCollectionResource(options);
   *    }
   *  });
   *
   *  CollectionResourceMixin.mixin(MyCollection.prototype);
   *
   *  return MyCollection;
   * });
   *
   * @module {d2/sdk/models/mixins/collection.resource.mixin} d2/sdk/models/mixins/"collection.resource.mixin"
   * @name CollectionResourceMixin
   * @extends {Object}
   */

  /**
   * @external ResourceMixin
   * @see ./resource.mixin
   */

  /**
   * @external CommandableMixin
   * @see ./commandable.mixin
   */

  /**
   * @external BrowsableCollectionMixin
   * @see ./browsable.collection.mixin
   */


  var CollectionResourceMixin = {
    /**
     * Fuse the mixable methods to a prototype
     * @param {Object} prototype - The target prototype where the mixin methods will be fused.
     * @returns {void}
     * @mixes external:ResourceMixin
     * @mixes external:CommandableMixin
     * @mixes external:BrowsableCollectionMixin
     * @memberOf module:CollectionResourceMixin
     */
    mixin: function (prototype) {
      ResourceMixin.mixin(prototype);
      CommandableMixin.mixin(prototype);
      BrowsableCollectionMixin.mixin(prototype);

      _.extend(prototype, {
        /**
         * Does the necessary setup on an instance of `Backbone.Collection` so that it is AJAX enabled. Also adds the
         * capability to autofetch menu actions associated with each model and then finally represent the collection as
         * a client-side paginated one.
         *
         * @param {Object} options - The options hash. See the original mixin options for supported parameters.
         * @returns {*} the collection instance itself.
         * @instance
         */
        makeCollectionResource: function (options) {
          return this.makeResource(options)
              .makeCommandable(options)
              .makeBrowsableCollection(options);
        }
      });
    }
  };

  return CollectionResourceMixin;
});