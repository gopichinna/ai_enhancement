define([
  'nuc/lib/jquery',
  'nuc/lib/underscore',
  'nuc/lib/marionette',
  'd2/sdk/controls/dialogs/stepper.wizard',
  '<%= namespace %>/dialogs/manage.group/manage.group.view',
  '<%= namespace %>/utils/alert.util',
  'i18n!<%= namespace %>/dialogs/manage.group/impl/nls/lang'
], function($, _, Marionette, StepperWizard, ManageGroupView, alertUtil, lang){
  'use strict';

  var ManageGroupDialog = Marionette.Object.extend({
    constructor: function ManageGroupDialog(options) {
      options = options || {};

      ManageGroupDialog.__super__.constructor.call(this, options);
    },

    show: function() {
      this.deferred = $.Deferred();
      this._showWizard();
      return this.deferred.promise();
    },

    _showWizard: function() {
      var me = this, updatedMembers, stepOptions = {
        steps:[{
          id: 'gr_mgr',
          viewClass: ManageGroupView,
          title: _.str.sformat(lang.dialogTitle, this.options.node.get('name')),
          buttons:[
            {
              id: 'next',
              label: lang.labelSave,
              clickHandler: function() {
                if(this.hasMembersChanged()) {
                  updatedMembers = this.getUpdatedMembers();
                }

                this.options.wizard && this.options.wizard.close();
              }
            }
          ],
          onCancel: function() {
            if(this.hasMembersChanged()) {
              return alertUtil.showConfirmationAlert('',lang.confirmationAlertMessage, lang.confirmationAlertYesButtonLabel);
            }
          }
        }],
        data: this.options,
        showPageLeavingWarning: false,
        className: 'd2-manage-group-dialog'
      };

      var dialog = new StepperWizard(stepOptions);
      dialog.show().on('wizard:closed', function(isCancelled){
        me.deferred.resolve(isCancelled, updatedMembers);
      });
    }
  });

  return ManageGroupDialog;
});