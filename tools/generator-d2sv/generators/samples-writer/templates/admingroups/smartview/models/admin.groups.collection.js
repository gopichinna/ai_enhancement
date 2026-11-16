define([
  'nuc/lib/jquery',
  'nuc/lib/underscore',
  'nuc/lib/backbone',
  'nuc/utils/url',
  'd2/sdk/models/mixins/collection.resource.mixin',
  'd2/sdk/utils/rest.resources',
  'd2/sdk/utils/rest.linkrels',
  'd2/sdk/utils/server.query.utils',
  '<%= namespace %>/models/group.model',
  '<%= namespace %>/utils/constants'
], function ($, _, Backbone, Url, CollectionResourceMixin, RestResources, RestLinkrels, serverQueryUtils, GroupModel, constants) {
  'use strict';

  var AdminGroupsCollection = Backbone.Collection.extend({
    model: GroupModel,
    widgetType: constants.WidgetTypes.ADMIN_GROUPS,

    constructor: function AdminGroupsCollection(models, options) {
      options = options || {};
      this.options = options;

      options.d2ActionsOptions = options.d2ActionsOptions || {
        menuType: constants.MenuTypes.ADMIN_GROUP_CONTEXT,
        widgetType: AdminGroupsCollection.prototype.widgetType
      };

      AdminGroupsCollection.__super__.constructor.call(this, models, options);

      this
        .makeCollectionResource(options);
    },

    url: function () {
      var links = RestResources.getCurrentRepository().get('links');
      var url = Url.combine(RestLinkrels.getLink(links, RestLinkrels.SELF), '<%= namespace %>', 'groups');

      var qParams = {
        //inline:true is automatically added by browsable.collection.mixin through server.query.utils
      };

      return Url.appendQuery(url, Url.combineQueryString(qParams));
    },

    parse: function (response/*, options*/) {
      return _.map(response.entries|| [], function (item) {
        var content = item.content, properties = content.properties;
        return _.extend(properties, _.pick(content, 'links'));
      });
    }
  });

  CollectionResourceMixin.mixin(AdminGroupsCollection.prototype);

  return AdminGroupsCollection;
});
