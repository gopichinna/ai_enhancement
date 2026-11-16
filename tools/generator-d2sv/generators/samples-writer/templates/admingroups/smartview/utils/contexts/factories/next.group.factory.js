define([
  'module',
  'nuc/lib/underscore',
  'nuc/lib/backbone',
  'd2/sdk/utils/contexts/factories/factory',
  'd2/sdk/utils/contexts/factories/connector',
  'd2/sdk/utils/commands',
  '<%= namespace %>/models/group.model'
], function (module, _, Backbone, ModelFactory, ConnectorFactory,
             commands, GroupModel) {
  'use strict';

  var GroupModelFactory = ModelFactory.extend({

      propertyPrefix: 'nextGroup',

      constructor: function GroupModelFactory(context, options) {
        ModelFactory.prototype.constructor.apply(this, arguments);

        var group = this.options.nextGroup || this.options.group || {};
        if (!(group instanceof Backbone.Model)) {
          var connector = context.getObject(ConnectorFactory, options),
            config = module.config(),
            creationOptions = _.extend({
              connector: connector,
              commands: commands.getAllSignatures()
            }, config.options, group.options);

          group = new GroupModel(group.attributes || config.attributes, creationOptions);
        }

        this.property = group;
      },

      fetch: function (options) {
        return this.property.fetch(options);
      },

      isFetchable: function () {
        return false;
      }

    },
    {
      defaultModel: GroupModel
    });

  return GroupModelFactory;

});
