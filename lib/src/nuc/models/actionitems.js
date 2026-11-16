/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['nuc/lib/underscore', 'nuc/lib/backbone', 'nuc/models/actionitem'], function (_, Backbone, ActionItemModel) {
  'use strict';

  var ActionItemCollection = Backbone.Collection.extend({
    model: ActionItemModel,
    comparator: 'sequence',

    constructor: function ActionItemCollection(_models, _options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    },

    findByNode: function (node) {
      return this.find(function (item) {
        return item.enabled(node);
      });
    },

    getAllSignatures: function () {
      return _.chain(this.pluck('signature')).unique().value();
    },

    // This method does not return command signatures, but command keys.
    getAllCommandSignatures: function (commands) {
      return _.chain(this.getAllSignatures())
        .map(function (signature) {
          var command = commands.get(signature);
          if (command) {
            var commandKey = (command.getCommandKey && command.getCommandKey()) || command.get('command_key') || [];
            // If there are multiple command keys to check, take just the
            // first one, which is the V2 one needed for the URL query
            var firstCommandKey = commandKey[0];
            // If the 'default' command key is requested, add the concrete
            // key too; v1 expects 'default' and v2 'open', while the
            // concrete action would be at the third place then.
            if (firstCommandKey === 'default') {
              return ['default', 'open', commandKey[2]];
            }
            return commandKey;
          }
        })
        .flatten()
        .compact()
        .invoke('toLowerCase')
        .unique()
        .value();
    },

    getPromotedCommandsSignatures: function () {
      return _.chain(this.getAllSignatures()).flatten().compact().invoke('toLowerCase').unique().value();
    }
  });

  return ActionItemCollection;
});
