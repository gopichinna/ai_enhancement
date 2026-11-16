define([
  'nuc/lib/underscore',
  'nuc/lib/jquery',
  'nuc/lib/marionette',
  'd2/sdk/controls/dialogs/stepper.wizard',
  '<%= namespace %>/dialogs/permissions/permissions.view',
  'i18n!<%= namespace %>/dialogs/permissions/impl/nls/lang'
], function(_, $, Marionette, StepperWizard, PermissionView, lang){
  'use strict';

  return {
    showPermissions: function (options) {
      var dfd = $.Deferred(), stepOptions = {
        steps:[{
          id: 'view_permissions',
          viewClass: PermissionView,
          title: _.str.sformat(lang.dialogTitle, options.nodes[0].get('name')),
          buttons:[
            {
              id: 'next',
              hidden: true
            }
          ]
        }],
        data: options,
        showPageLeavingWarning: false,
        className: 'd2-permissions-dialog'
      };

      var dialog = new StepperWizard(stepOptions);
      dialog.show().on('wizard:closed', dfd.resolve);

      return dfd.promise();
    }
  };
});