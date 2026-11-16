define([
  'nuc/lib/jquery',
  'nuc/lib/underscore',
  'nuc/lib/backbone',
  'nuc/utils/url',
  'd2/sdk/models/mixins/collection.resource.mixin',
  'd2/sdk/utils/rest.resources',
  'd2/sdk/utils/rest.linkrels',
  'd2/sdk/utils/server.query.utils',
  '<%= namespace %>/models/member.model',
  '<%= namespace %>/utils/constants'
], function ($, _, Backbone, Url, CollectionResourceMixin,
  RestResources, RestLinkrels, serverQueryUtils, MemberModel, constants) {
  'use strict';

  var GroupMembersCollection = Backbone.Collection.extend({
    model: MemberModel,

    constructor: function GroupMembersCollection(models, options) {
      options = options || {};
      this.options = options;
      this.node = options.node;

      GroupMembersCollection.__super__.constructor.call(this, models, options);

      this.makeCollectionResource(options);
    },

    url: function () {
      var links = this.node.get('links');
      var url = RestLinkrels.getLink(links, constants.LinkrelID.GROUP_MEMBERS);

      var qParams = {
        //inline:true is automatically added by browsable.collection.mixin through server.query.utils
      };

      return Url.appendQuery(url, Url.combineQueryString(qParams));
    },

    parse: function (response/* , options */) {
      return _.map(response.entries || [], function (item) {
        var content = item.content, properties = content.properties;
        return _.extend(properties, _.pick(content, 'links'));
      });
    }
  });

  CollectionResourceMixin.mixin(GroupMembersCollection.prototype);

  var originalFetch = GroupMembersCollection.prototype.fetch;
  GroupMembersCollection.prototype.fetch = function (options) {
    if (this.node.get('links')) {
      return originalFetch.call(this, options);
    }

    return $.Deferred().resolve().promise();
  };

  return GroupMembersCollection;
});
