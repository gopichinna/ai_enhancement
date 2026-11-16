define([
  'module',
  'nuc/lib/underscore',
  'nuc/lib/backbone',
  'd2/sdk/utils/contexts/factories/factory',
  'd2/sdk/utils/contexts/factories/connector',
  'd2/sdk/utils/commands',
  '<%= namespace %>/models/<%= typedModulePrefix %>.collection'
], function (module, _, Backbone, CollectionFactory, ConnectorFactory,
  commands, <%= typedNamePrefix %>Collection) {
  'use strict';

  var <%= typedNamePrefix %>CollectionFactory = CollectionFactory.extend({

    propertyPrefix: '<%= applicationScope %>',

    constructor: function <%= typedNamePrefix %>CollectionFactory(context, options) {
      <%= typedNamePrefix %>CollectionFactory.__super__.constructor.call(this, context, options);

      var <%= applicationScope %> = this.options.widget || this.options.<%= applicationScope %> || {};
      if (!(<%= applicationScope %> instanceof Backbone.Collection)) {
        var connector = context.getObject(ConnectorFactory, options),
          config = module.config();
          <%= applicationScope %> = new <%= typedNamePrefix %>Collection(<%= applicationScope %>.models, _.extend(
          { connector: connector },
          <%= applicationScope %>.options, config.options,
          <%= typedNamePrefix %>CollectionFactory.getDefaultResourceScope(),
          { autoreset: true }));
      }
      this.property = <%= applicationScope %>;
    },

    fetch: function (options) {
      return this.property.fetch(options);
    }

  },
    {

      getDefaultResourceScope: function () {
        return _.deepClone({
          commands: commands.getAllSignatures()
        });
      }

    });

  return <%= typedNamePrefix %>CollectionFactory;

});
