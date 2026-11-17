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

    // 1. Enable ONLY when 1 document is selected (strictly exclude folders & cabinets)
    enabled: function (status) {
      var nodes = CommandHelper.getAtLeastOneNode(status);
      if (!nodes || nodes.length !== 1) {
        return false;
      }
      var node = nodes.at ? nodes.at(0) : (nodes.models ? nodes.models[0] : nodes[0]);
      if (!node || typeof node.get !== 'function') {
        return false;
      }

      // Exclude if marked as a container
      if (node.get('container') === true || node.get('is_container') === true) {
        return false;
      }

      // Exclude folder/cabinet/repo type codes (0 = FOLDER, 142 = CABINET, 141 = REPO)
      var nodeType = node.get('type');
      if (nodeType === 0 || nodeType === '0' || nodeType === 142 || nodeType === '142' || nodeType === 141 || nodeType === '141') {
        return false;
      }

      // Exclude by type_name
      var typeName = (node.get('type_name') || node.get('typeName') || '').toLowerCase();
      if (typeName === 'dm_folder' || typeName === 'dm_cabinet' || typeName.indexOf('folder') !== -1 || typeName.indexOf('cabinet') !== -1) {
        return false;
      }

      // Accept document types (144 / Constants.Types.DOCUMENT or non-container)
      return nodeType == 144 || nodeType === Constants.Types.DOCUMENT || node.get('container') === false;
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
      if (status && status.data) {
        if (typeof status.data === 'string') {
          rawSummary = status.data;
        } else if (status.data.summary) {
          rawSummary = status.data.summary;
        } else if (status.data.result) {
          rawSummary = status.data.result;
        } else if (status.data.RETURNED) {
          rawSummary = status.data.RETURNED;
        } else if (status.data.output) {
          rawSummary = status.data.output;
        } else if (status.data.ai_summary) {
          rawSummary = status.data.ai_summary;
        }
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

  // Support both instance and static invocation from D2 CallService
  AiSummaryCommand.execute = function (status) {
    var instance = new AiSummaryCommand();
    return instance.execute(status);
  };

  return AiSummaryCommand;
});
