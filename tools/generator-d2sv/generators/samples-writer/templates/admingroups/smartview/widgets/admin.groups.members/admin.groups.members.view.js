define([
  'd2/sdk/controls/blocker/blocker',
  'd2/sdk/utils/contexts/factories/connector',
  'd2/sdk/widgets/list.tile/list.tile.view',
  '<%= namespace %>/models/group.members.collection',
  '<%= namespace %>/utils/contexts/factories/next.group.factory',
  'i18n!<%= namespace %>/widgets/admin.groups.members/impl/nls/lang',
  'css!<%= namespace %>/widgets/admin.groups.members/impl/admin.groups.members'
], function (BlockingView, ConnectorFactory, ListTileWidget, GroupMembersCollection, NextGroupModelFactory, lang) {
  'use strict';

  var AdminGroupsMembersView = ListTileWidget.extend({
    constructor: function AdminGroupsMembersView(options) {
      options = options || {};
      options.data = options.data || {};
      options.title = lang.title;
      options.cssClass = 'd2-tile-admingroups-members';
      options.showInlineActionBar = false;
      options.hideSearch = true;

      this.context = options.context;
      this.nextGroupModel = this.context.getModel(NextGroupModelFactory);
      options.collection = new GroupMembersCollection([], {
        connector: this.context.getObject(ConnectorFactory),
        node: this.nextGroupModel,
        autoreset: true
      });

      AdminGroupsMembersView.__super__.constructor.call(this, options);

      BlockingView.imbue(this);

      this.nextGroupModel && this
        .listenTo(this.nextGroupModel, 'change:id', this._reloadMembers)
        .listenTo(options.collection, 'request', this.blockActions)
        .listenTo(options.collection, 'sync error', this.unblockActions);
    },

    childViewOptions: function () {
      var retVal = AdminGroupsMembersView.__super__.childViewOptions.apply(this, arguments);

      retVal = retVal || {};
      retVal.checkDefaultAction = false;

      return retVal;
    },

    _reloadMembers: function () {
      this.collection.fetch({ reload: true });
    }
  });

  return AdminGroupsMembersView;
});