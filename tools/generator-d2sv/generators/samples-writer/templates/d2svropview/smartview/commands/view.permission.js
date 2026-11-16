define([
  'd2/sdk/commands/call.service.command',
  'i18n!<%= namespace %>/commands/impl/nls/lang'
], function(CallServiceCommand, lang){
  'use strict';

  var ViewPermissionCommand = CallServiceCommand.extend({
    defaults: {
      signature: 'D2-ViewPermission',
      command_key: 'D2-ViewPermission',
      name: lang.cmdViewPermission
    },

    constructor: function ViewPermissionCommand(attr, options) {
      ViewPermissionCommand.__super__.constructor.call(this, attr, options);
    }
  });

  return ViewPermissionCommand;
});