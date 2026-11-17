/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'dctmw/models/mixins/resource.mixin'
], function (ResourceMixinImpl) {
  'use strict';

  /**
   * Resource mixin. Can be mixed with any `Backbone.Model` or `Backbone.Collection` to make it AJAX worthy.
   *
   * @example <caption>A typical collection using this mixin may look like</caption>
   * define([
   *  'nuc/lib/backbone',
   *  'd2/sdk/models/mixins/resource.mixin'
   * ], function(Backbone, ResourceMixin){
   *  'use strict';
   *
   *  var MyModel = Backbone.Model.extend({
   *    constructor: function MyModel(attr, options) {
   *      options = options || {};
   *      MyModel.__super__.constructor.call(this, attr, options);
   *
   *      this.makeResource(options);
   *    }
   *  });
   *
   *  ResourceMixin.mixin(MyModel.prototype); //Can be equally mixed with a Backbone.Collection prototype
   *
   *  return MyModel;
   * });
   *
   * @module {d2/sdk/models/mixins/resource.mixin} d2/sdk/models/mixins/"resource.mixin"
   * @name ResourceMixin
   * @extends {Object}
   *
   */

  /**
   * @external ConnectableMixin
   * @see ../../../nuc/models/mixins/connectable/connectable.mixin
   */

  /**
   * @external FetchableMixin
   * @see ../../../nuc/models/mixins/fetchable/fetchable.mixin
   */

  var ResourceMixin = {
    /**
     * Fuse the mixin methods to a prototype
     * @param {Object} prototype - The target prototype where the mixin methods will be fused.
     * @returns {void}
     * @mixes external:ConnectableMixin
     * @mixes external:FetchableMixin
     * @memberOf module:ResourceMixin
     */
    mixin: ResourceMixinImpl.mixin
  };
  
  /**
   * @name makeResource
   * @function
   * @description Does the necessary setup on an instance of `Backbone.Model` or `Backbone.Collection` so that it can connect & fetch
   * resource from server using AJAX.
   * @param {object} options - Options hash
   * @param {Connector} options.connector - The transport that lets the model or collection to connect to server. See {@link ../../utils/contexts/factories/connector|ConnectorFactory}
   * @returns {*} the model/collection instance itself.
   * @instance
   */

  return ResourceMixin;
});