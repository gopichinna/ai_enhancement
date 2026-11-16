define([
  'module',
  'nuc/lib/underscore',
  'nuc/lib/backbone',
  'd2/sdk/utils/contexts/factories/factory',
  'd2/sdk/utils/contexts/factories/connector',
  'd2/sdk/utils/commands',
  '<%= namespace %>/models/admin.groups.collection'
], function (module, _, Backbone, CollectionFactory, ConnectorFactory,
             commands, AdminGroupsCollection) {
  'use strict';

  var AdminGroupsCollectionFactory = CollectionFactory.extend({

      propertyPrefix: 'userGroups',

      constructor: function AdminGroupsCollectionFactory(context, options) {
        CollectionFactory.prototype.constructor.apply(this, arguments);

        var userGroups = this.options.widget || this.options.userGroups || {};
        if (!(userGroups instanceof Backbone.Collection)) {
          var connector = context.getObject(ConnectorFactory, options),
            config = module.config();
          userGroups = new AdminGroupsCollection(userGroups.models, _.extend(
            { connector: connector },
            userGroups.options, config.options,
            AdminGroupsCollectionFactory.getDefaultResourceScope(),
            { autoreset: true }));
        }
        this.property = userGroups;
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

  return AdminGroupsCollectionFactory;

});
