/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'csui/utils/contexts/factories/factory'
], function(FactoryImpl){
  'use strict';

  /**
   * Interface for classes that want to implement a factory to create a `Backbone.Model` or `Backbone.Collection` or just a plain `Object`.
   *
   * The created model/collection/object is attached to the applicable `context` and all such instances are fetched when the `context` is fetched.
   *
   * @example <caption>To create a collection factory</caption>
   *
   * define([
   *   'module',
   *   'nuc/lib/underscore',
   *   'nuc/lib/backbone',
   *   'd2/sdk/utils/contexts/factories/factory',
   *   'd2/sdk/utils/contexts/factories/connector',
   *   'd2/sdk/utils/commands',
   *   'mybundle/models/sample.collection'
   *   ], function (module, _, Backbone, CollectionFactory, ConnectorFactory,
   *    commands, SampleCollection) {
   *      'use strict';
   *
   *      var SampleCollectionFactory = CollectionFactory.extend({
   *
   *          propertyPrefix: 'sampleCollection',
   *
   *          constructor: function SampleCollectionFactory(context, options) {
   *            CollectionFactory.prototype.constructor.apply(this, arguments);
   *
   *            var collection = this.options.widget || this.options.sampleCollection || {}; //It is customary to use the same name as propertyPrefix
   *            if (!(collection instanceof Backbone.Collection)) {
   *              var connector = context.getObject(ConnectorFactory, options),
   *                config = module.config();
   *
   *              collection = new SampleCollection(collection.models, _.extend(
   *              { connector: connector },
   *              collection.options, config.options,
   *              SampleCollectionFactory.getDefaultResourceScope(),
   *              { autoreset: true }));
   *           }
   *
   *           this.property = collection;
   *         },
   *
   *         fetch: function (options) {
   *            return this.property.fetch(options);
   *         }
   *
   *      },
   *      {
   *
   *          getDefaultResourceScope: function () {
   *            return _.deepClone({
   *              commands: commands.getAllSignatures()
   *            });
   *          }
   *
   *      });
   *
   *      return SampleCollectionFactory;
   *
   * });
   *
   * @example <caption>Whereas the sample collection could be simply defined as</caption>
   *
   * define([
   *   'nuc/lib/backbone',
   *   'd2/sdk/models/mixins/collection.resource.mixin'
   * ], function(Backbone, CollectionResourceMixin){
   *  'use strict';
   *
   *  var SampleCollection = Backbone.Collection.extend({
   *    constructor: function SampleCollection(models, options) {
   *      options = options || {};
   *      this.options = options;
   *
   *      SampleCollection.__super__.constructor.call(this, models, options);
   *
   *      this.makeCollectionResource(options);
   *    }
   *  });
   *
   *  CollectionResourceMixin.mixin(SampleCollection.prototype);
   *
   *  return SampleCollection;
   * });
   *
   * @module {d2/sdk/utils/contexts/factories/factory} d2/sdk/utils/contexts/factories/factory
   * @name BaseFactory
   * @extends {Object}
   *
   */

  var Factory = FactoryImpl.extend({
    constructor: function Factory(context, options) {
      Factory.__super__.constructor.call(this, context, options);
    }
  });

  /**
   * Name against which the created model/collection/object is to be saved.
   * @name propertyPrefix
   * @type {string}
   * @memberOf module:BaseFactory
   * @instance
   * @abstract
   */

  /**
   * @name isFetchable
   * @function
   * @memberOf module:BaseFactory
   * @description Whether this factory instance is fetchable or not.
   * @returns {boolean} should return `true` when the model associated with this factory is fetchable, `false` otherwise.
   * @instance
   * @abstract
   */

  /**
   * @name fetch
   * @function
   * @memberOf module:BaseFactory
   * @description Should delegate this fetch to actually fetch the model/collection/object created by this factory.
   * @returns {void}
   * @instance
   * @abstract
   */

  return Factory;
});