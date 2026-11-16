define([
    'nuc/lib/jquery',
    'nuc/lib/underscore',
    'd2/sdk/commands/command',
    'd2/sdk/utils/commandhelper',
    'd2/sdk/controls/globalmessage/globalmessage',
    'i18n!<%= namespace %>/commands/nls/lang'
], function ($, _, CommandModel, CommandHelper, GlobalMessage, lang) {
    'use strict';

    var OpenToastMessage = CommandModel.extend({
        defaults: {
            signature: 'OpenToastMessage',
            command_key: 'OpenToastMessage',
            name: lang.OpenToastMessage,
            scope: 'single'
        },

        enabled: function () {
            return true;
        },

        execute: function (status/*, options*/) {
            var node = CommandHelper.getJustOneNode(status);
            GlobalMessage.showMessage("success",  _.str.sformat(lang.AlertMessage, node.get("name")));
            return $.Deferred().resolve().promise();
        }
    });

    return OpenToastMessage;
});