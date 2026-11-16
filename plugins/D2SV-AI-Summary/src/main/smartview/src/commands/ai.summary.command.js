define([
  'nuc/lib/jquery',
  'd2/sdk/commands/command',
  'csui/utils/commandhelper',
  'd2/controls/globalmessage/globalmessage',
  'dctmw/utils/constants',
  'smart/controls/dialog/dialog.view',
  'd2svaisummary/dialogs/ai.summary.dialog.view'
], function ($, CommandModel, CommandHelper, GlobalMessage, Constants, DialogView, AiSummaryDialogView) {
  'use strict';

  var AiSummaryCommand = CommandModel.extend({
    defaults: {
      signature: 'AiSummary',
      command_key: 'AiSummary',
      scope: 'single'
    },

    // 1. Enable ONLY when 1 document is selected
    enabled: function (status) {
      var nodes = CommandHelper.getAtLeastOneNode(status);
      if (!nodes || nodes.length !== 1) {
        return false;
      }
      var node = nodes.at ? nodes.at(0) : (nodes.models ? nodes.models[0] : nodes[0]);
      return node && typeof node.get === 'function' && node.get('type') === Constants.Types.DOCUMENT;
    },

    // 2. Called when the backend Java action completes
    execute: function (status) {
      var deferred = $.Deferred();

      // Extract node flexibly
      var node = null;
      if (status) {
        var nodes = status.nodes || status.collection;
        if (nodes) {
          node = nodes.at ? nodes.at(0) : (nodes.models ? nodes.models[0] : nodes[0]);
        }
      }
      if (!node) {
        node = CommandHelper.getJustOneNode(status);
      }

      var objectName = node && node.get ? node.get('name') : 'Document';

      // Extract summary returned by AiSummaryAction.java
      var rawSummary = 'No summary returned.';
      if (status && status.data && status.data.summary) {
        rawSummary = status.data.summary;
      }

      // If response is a JSON string, extract the summary property
      var displayText = rawSummary;
      try {
        var parsed = JSON.parse(rawSummary);
        if (parsed.summary) {
          displayText = parsed.summary;
        } else if (parsed.response) {
          displayText = parsed.response;
        }
      } catch (e) {
        // Plain text
      }

      // Instantiate Marionette body view
      var bodyView = new AiSummaryDialogView({
        objectName: objectName,
        summaryText: displayText
      });

      // Launch Modal Dialog
      var dialog = new DialogView({
        title: 'AI Summary',
        largeSize: true,
        view: bodyView,
        buttons: [
          {
            id: 'copyBtn',
            label: 'Copy Summary',
            variant: 'primary',
            click: function (_args) {
              if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(displayText);
              } else {
                var el = document.createElement('textarea');
                el.value = displayText;
                document.body.appendChild(el);
                el.select();
                document.execCommand('copy');
                document.body.removeChild(el);
              }
              GlobalMessage.showMessage('success', 'Summary copied to clipboard!');
            }
          },
          {
            id: 'closeBtn',
            label: 'Close',
            close: true
          }
        ]
      });

      dialog.show();
      deferred.resolve();
      return deferred.promise();
    }
  });

  return AiSummaryCommand;
});
