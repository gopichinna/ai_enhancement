define([], function(){
  'use strict';

  return [
    {
      command_key: 'D2-ManageGroup',
      decides: function (item) {
        return item.action === 'D2_ACTION_EXECUTE_MANAGER' &&
          item.actionParameters && item.actionParameters.MANAGER === 'GroupManager';
      },
      iconName: 'csui_action_edit32'
    }
  ];
});
