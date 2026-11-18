/* START_TEMPLATE */
csui.define('hbs!d2svaisummary/dialogs/impl/ai.summary.dialog',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"ai-summary-modal-container\" style=\"padding: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;\">\n  \n  <div style=\"background-color: #f0f7fb; border-left: 4px solid #0072aa; padding: 10px 14px; margin-bottom: 14px; border-radius: 4px;\">\n    <strong>Document:</strong> <span style=\"color: #0072aa; font-weight: 600;\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"objectName") || (depth0 != null ? lookupProperty(depth0,"objectName") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"objectName","hash":{},"loc":{"start":{"line":4,"column":79},"end":{"line":4,"column":93}}}) : helper)))
    + "</span>\n  </div>\n\n  <div style=\"font-weight: 600; margin-bottom: 6px; color: #333;\">AI Executive Summary:</div>\n\n  <div class=\"summary-text-area\" \n       style=\"max-height: 380px; overflow-y: auto; background-color: #fff; border: 1px solid #ccd1d5; border-radius: 4px; padding: 14px; font-size: 14px; line-height: 1.6; color: #222; white-space: pre-wrap;\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"summaryText") || (depth0 != null ? lookupProperty(depth0,"summaryText") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"summaryText","hash":{},"loc":{"start":{"line":10,"column":209},"end":{"line":10,"column":224}}}) : helper)))
    + "</div>\n\n</div>\n";
}});
Handlebars.registerPartial('d2svaisummary_dialogs_impl_ai.summary.dialog', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('d2svaisummary/dialogs/ai.summary.dialog.view',[
  'nuc/lib/marionette',
  'hbs!d2svaisummary/dialogs/impl/ai.summary.dialog'
], function (Marionette, template) {
  'use strict';

  return Marionette.ItemView.extend({
    template: template,

    templateHelpers: function () {
      return {
        objectName: this.options.objectName || 'Document',
        summaryText: this.options.summaryText || 'No summary available.'
      };
    }
  });
});


csui.define('d2svaisummary/commands/ai.summary.command',[
  'nuc/lib/jquery',
  'd2/sdk/commands/command',
  'csui/utils/commandhelper',
  'd2/controls/globalmessage/globalmessage',
  'dctmw/utils/constants',
  'smart/controls/dialog/dialog.view',
  'd2svaisummary/dialogs/ai.summary.dialog.view'
], function ($, CommandModel, CommandHelper, GlobalMessage, Constants, DialogView, AiSummaryDialogView) {
  'use strict';

  console.log('[D2SV-AI-Summary] >>> ai.summary.command module loaded successfully! <<<');

  var AiSummaryCommand = CommandModel.extend({
    defaults: {
      signature: 'AiSummary',
      command_key: 'AiSummary',
      scope: 'single'
    },

    // 1. Enable ONLY when 1 document is selected (strictly exclude folders & cabinets)
    enabled: function (status) {
      console.log('[D2SV-AI-Summary] enabled() called with status:', status);
      var nodes = CommandHelper.getAtLeastOneNode(status);
      if (!nodes || nodes.length !== 1) {
        console.log('[D2SV-AI-Summary] enabled() => false (not exactly 1 node selected)');
        return false;
      }
      var node = nodes.at ? nodes.at(0) : (nodes.models ? nodes.models[0] : nodes[0]);
      if (!node || typeof node.get !== 'function') {
        console.log('[D2SV-AI-Summary] enabled() => false (invalid node object)');
        return false;
      }

      // Exclude if marked as a container
      if (node.get('container') === true || node.get('is_container') === true) {
        console.log('[D2SV-AI-Summary] enabled() => false (is container)');
        return false;
      }

      // Exclude folder/cabinet/repo type codes (0 = FOLDER, 142 = CABINET, 141 = REPO)
      var nodeType = node.get('type');
      if (nodeType === 0 || nodeType === '0' || nodeType === 142 || nodeType === '142' || nodeType === 141 || nodeType === '141') {
        console.log('[D2SV-AI-Summary] enabled() => false (nodeType is folder/cabinet/repo:', nodeType, ')');
        return false;
      }

      // Exclude by type_name
      var typeName = (node.get('type_name') || node.get('typeName') || '').toLowerCase();
      if (typeName === 'dm_folder' || typeName === 'dm_cabinet' || typeName.indexOf('folder') !== -1 || typeName.indexOf('cabinet') !== -1) {
        console.log('[D2SV-AI-Summary] enabled() => false (typeName indicates folder/cabinet:', typeName, ')');
        return false;
      }

      // Accept document types (144 / Constants.Types.DOCUMENT or non-container)
      var isDoc = (nodeType == 144 || nodeType === Constants.Types.DOCUMENT || node.get('container') === false);
      console.log('[D2SV-AI-Summary] enabled() =>', isDoc, '(nodeType:', nodeType, 'typeName:', typeName, ')');
      return isDoc;
    },

    // 2. Called when the backend Java action completes
    execute: function (status) {
      console.log('[D2SV-AI-Summary] >>> execute() called! <<< status:', status);
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
      console.log('[D2SV-AI-Summary] Target document name:', objectName);

      // Extract summary returned by AiSummaryAction.java
      var rawSummary = 'No summary returned.';
      if (status && status.data) {
        console.log('[D2SV-AI-Summary] Raw status.data:', status.data);
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

      console.log('[D2SV-AI-Summary] Display summary text:', displayText);


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
    console.log('[D2SV-AI-Summary] Static AiSummaryCommand.execute invoked! Calling instance.execute...');
    var instance = new AiSummaryCommand();
    return instance.execute(status);
  };

  return AiSummaryCommand;
});


csui.define('bundles/d2svaisummary-bundle',[
  'd2svaisummary/commands/ai.summary.command',
  'd2svaisummary/dialogs/ai.summary.dialog.view'
], {});

//# sourceMappingURL=d2svaisummary-bundle.js.map