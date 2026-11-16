define([], function(){
  'use strict';

  return [
    {
      command_key: 'D2-ViewPermission',
      decides: function (item) {
        return item.action === 'D2_ACTION_EXECUTE' &&
          item.actionParameters && item.actionParameters.eService === 'PermissionActionService';
      },
      iconName: '<%= namespace %>_action_view_perms32'
    }
  ];
});