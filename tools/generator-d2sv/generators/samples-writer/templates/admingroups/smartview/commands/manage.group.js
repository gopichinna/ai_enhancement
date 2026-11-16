define([
  'nuc/lib/jquery',
  'nuc/lib/underscore',
  'd2/sdk/commands/command',
  'd2/sdk/controls/globalmessage/globalmessage',
  'd2/sdk/utils/commandhelper',
  'd2/sdk/utils/contexts/factories/connector',
  'd2/sdk/utils/rest.linkrels',
  'd2/sdk/utils/constants',
  'i18n!<%= namespace %>/commands/nls/lang',
  '<%= namespace %>/utils/constants'
], function($, _, CommandModel, GlobalMessage, CommandHelper, ConnectorFactory, RestLinkrels, d2Constants, lang, constants){
  'use strict';

  var CommandManageGroup = CommandModel.extend({
    defaults: {
      signature: 'D2-ManageGroup',
      command_key: 'D2-ManageGroup',
      name: lang.CommandNameManageGroup,
      scope: 'single'
    },

    enabled: function(status, options) {
      return CommandManageGroup.__super__.enabled.call(this, status, options);
    },

    execute: function(status/*, options*/) {
      var dfd = $.Deferred(),
        me = this,
        node = CommandHelper.getJustOneNode(status);

      require([
        '<%= namespace %>/dialogs/manage.group/manage.group.dialog'
      ], function(ManageGroupDialog){

        var dialog = new ManageGroupDialog({node: node, context: status.context});
        dialog.show().done(function(isCancelled, updatedMembers){
          if(isCancelled === true) {
            dfd.resolve();
          } else {
            me.updateGroupMembers(status.context, node, updatedMembers).done(function(){
              node.trigger('members:changed', node);
              GlobalMessage.showMessage('success', _.str.sformat(lang.CommandManageGroupSuccessMessage, node.get('name')));
              dfd.resolve();
            }).fail(dfd.reject);
          }
        }).fail(dfd.reject);
      }, dfd.reject);

      return dfd.promise();
    },

    updateGroupMembers: function(context, group, members) {
      var dfd = $.Deferred(),
        url = RestLinkrels.getLink(group.get('links'), constants.LinkrelID.GROUP_MEMBERS),
        connector = context.getObject(ConnectorFactory);

      if(!_.isEmpty(members)) {
        $.ajax(connector.extendAjaxOptions({
          url: url,
          type: 'PUT',
          data: JSON.stringify({members: members}),
          contentType: d2Constants.MediaTypes.DCTM_JSON
        })).done(dfd.resolve).fail(dfd.reject);
      } else {
        dfd.resolve();
      }

      return dfd.resolve().promise();
    }
  });

  return CommandManageGroup;
});