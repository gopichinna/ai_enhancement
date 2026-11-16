define([
    'nuc/lib/jquery',
    'nuc/lib/underscore',
    'd2/sdk/commands/command',
    'd2/sdk/utils/commandhelper',
    'd2/sdk/controls/alerts/modal.alert',
    'i18n!<%= namespace %>/commands/nls/lang'
], function ($, _, CommandModel, CommandHelper, ModalAlert, lang) {
    'use strict';

    var OpenModalAlert = CommandModel.extend({
        defaults: {
            signature: 'OpenModelAlert',
            command_key: 'OpenModelAlert',
            name: lang.OpenModalAlert,
            scope: 'single'
        },

        enabled: function () {
            return true;
        },

        execute: function (status/*, options*/) {
            var node = CommandHelper.getJustOneNode(status);
            ModalAlert.showInformation(function (result) {
                console.log(result);
            }, _.str.sformat(lang.AlertMessage, node.get("name")), lang.AlertHeader, {
                buttons: {
                    showYes: true,
                    labelYes: lang.ButtonLabelOk,
                    showNo: false,
                    showCancel: false
                },
            });
            return $.Deferred().resolve().promise();
        }
    });

    return OpenModalAlert;
});