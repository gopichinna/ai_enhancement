define([
  'nuc/lib/jquery',
  'nuc/lib/underscore',
  'nuc/lib/marionette',
  '<%= namespace %>/dialogs/manage.group/impl/group.members.form.view',
  '<%= namespace %>/models/group.members.collection',
  'hbs!<%= namespace %>/dialogs/manage.group/impl/manage.group',
  'css!<%= namespace %>/dialogs/manage.group/impl/manage.group'
], function($, _, Marionette, GroupMembersFormView, GroupMembers, template){
  'use strict';

  var ManageGroupView = Marionette.LayoutView.extend({
    className: 'd2-manage-group-view',

    template: template,

    regions: {
      rgnFormContainer: '>.d2-manage-group-form-container'
    },

    constructor: function ManageGroupView(options) {
      options = options || {};

      this.context = options.context;
      this.node = options.node;
      this.groupMembers = new GroupMembers([], {node: this.node, connector: this.node.connector});

      ManageGroupView.__super__.constructor.call(this, options);
    },

    onRender: function() {
      if(!this.groupMembers.fetched) {
        this.groupMembers.fetch().always(this.render.bind(this));
        return;
      }
      
      if(!this.formView) {
        var options = _.extend({initialMembers: this.groupMembers}, this.options);
        this.formView = new GroupMembersFormView(options);
        this
          .listenTo(this.formView, 'members:init', function(m){this.options.initMembers = m;})
          .listenTo(this.formView, 'members:change', function(m){this.options.updatedMembers = m;});
      }
      this.rgnFormContainer.show(this.formView);
    },

    hasMembersChanged: function() {
      this.collectMembers();
      return !_.isEqual(this.options.initMembers, this.getUpdatedMembers());
    },

    getUpdatedMembers: function() {
      return [].concat(this.options.updatedMembers);
    },
    
    collectMembers: function() {
      this.formView && this.formView.collectMembers();
    },

    onBeforeDestroy: function() {
      this.formView && this.formView.destroy();
    }
  });

  return ManageGroupView;
});