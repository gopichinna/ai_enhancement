/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'nuc/lib/underscore',
  'nuc/models/mixins/v2.delayed.commandable/v2.delayed.commandable.mixin',
  'd2/server.adaptors/models/node.multiple.actions.mixin'
], function(_, DelayedCommandableV2Mixin, NodeMultipleActionsMixin) {
  'use strict';

  /**
   * Commandable mixin. Add action capability to a `Backbone.Collection` or `Backbone.Model` such that when the collection or model instance is synced with server, it fetches
   * menu actions for the individual models.
   *
   * promoted actions are fetched immediately but non-promoted actions are delayed until an external trigger.
   *
   * @example <caption>A typical collection using this mixin may look like</caption>
   * define([
   *  'nuc/lib/backbone',
   *  'd2/sdk/models/mixins/commandable.mixin'
   * ], function(Backbone, CommandableMixin){
   *  'use strict';
   *
   *  var MyCollection = Backbone.Collection.extend({
   *    constructor: function MyCollection(models, options) {
   *      options = options || {};
   *      options.d2ActionsOptions = options.d2ActionsOptions || {
   *        menuType: 'MenuContext',
   *        widgetType: 'DoclistWidget'
   *      };
   *
   *      MyCollection.__super__.constructor.call(this, models, options);
   *
   *      this.makeCommandable(options);
   *    }
   *  });
   *
   *  CommandableMixin.mixin(MyCollection.prototype); //Can be equally mixed with a Backbone.Model prototype
   *
   *  return MyCollection;
   * });
   *
   * @module {d2/sdk/models/mixins/commandable.mixin} d2/sdk/models/mixins/"commandable.mixin"
   * @name CommandableMixin
   * @extends {Object}
   *
   */

  var CommandableMixin = {
    /**
     * Fuse the mixin methods to a prototype
     * @param {Object} prototype - The target prototype where the mixin methods will be fused.
     * @returns {void}
     * @memberOf module:CommandableMixin
     */
    mixin: function(prototype) {
      DelayedCommandableV2Mixin.mixin(prototype);
      NodeMultipleActionsMixin.mixin(prototype);

      var originalPrepareModel = prototype._prepareModel;

      _.extend(prototype, {
        /**
         * Does the necessary setup on an instance of `Backbone.Model` or `Backbone.Collection` so that it can fetch
         * associated menu actions.
         *
         * @param {object} options - Options hash
         * @param {ActionOption} [options.delayedActionsOptions] - Controls options for the delayed action fetch behavior
         * @param {ActionOption} [options.nonPromotedActionsOptions] - Controls options for the non-promoted action fetch behavior
         * @param {ActionOption} [options.additionalActionsOptions] - Controls options for the additional action fetch behavior
         * @param {ActionOption} [options.d2ActionsOptions] - Controls options for the delayed, non-promoted & additional action fetch behavior simultaneously
         * unless the above corresponding options are also explicitly specified.
         * @returns {*} the model/collection instance itself.
         * @instance
         */
        makeCommandable: function(options) {
          options = options || {};

          options.delayedActionsOptions = _.defaults({isDelayedActions: true}, options.delayedActionsOptions || options.d2ActionsOptions);
          options.nonPromotedActionsOptions = options.nonPromotedActionsOptions || options.d2ActionsOptions;
          options.additionalActionsOptions = options.additionalActionsOptions || options.d2ActionsOptions;

          return this.makeDelayedCommandableV2(options);
        },

        _prepareModel: function (attrs, options) {
          options = options || {};

          options.delayedActionsOptions = this.delayedActionsOptions;
          options.nonPromotedActionsOptions = this.nonPromotedActionsOptions;
          options.additionalActionsOptions = this.additionalActionsOptions;
          options.defaultActionCommands = this.defaultActionCommands;
          options.promotedActionCommands = this.promotedActionCommands;
          options.nonPromotedActionCommands = this.nonPromotedActionCommands;

          return originalPrepareModel.call(this, attrs, options);
        }
      });
    }
  };

  /**
   * @typedef {Object} ActionOption
   * @property {string} menuType - Controls the `type` query parameter sent during D2-REST `actions` endpoint invocation.
   * @property {string} widgetType - Controls the `widgetType` query parameter sent during D2-REST `actions` endpoint invocation.
   */

  return CommandableMixin;
});