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

    propertyPrefix: '<%= typedNamePrefix %>Col',

    constructor: function <%= typedNamePrefix %>CollectionFactory(context, options) {
      <%= typedNamePrefix %>CollectionFactory.__super__.constructor.call(this, context, options);

      var <%= typedNamePrefix %>Col = this.options.widget || this.options.<%= typedNamePrefix %>Col || {};
      if (!(<%= typedNamePrefix %>Col instanceof Backbone.Collection)) {
        var connector = context.getObject(ConnectorFactory, options),
          config = module.config();
          <%= typedNamePrefix %>Col = new <%= typedNamePrefix %>Collection(<%= typedNamePrefix %>Col.models, _.extend(
          { connector: connector },
          <%= typedNamePrefix %>Col.options, config.options,
          <%= typedNamePrefix %>CollectionFactory.getDefaultResourceScope(),
          { autoreset: true }));
      }
      this.property = <%= typedNamePrefix %>Col;
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
