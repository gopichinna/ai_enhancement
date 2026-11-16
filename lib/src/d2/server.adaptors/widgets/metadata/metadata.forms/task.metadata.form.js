/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "d2/models/workflow/workflow.audit.task", "d2/models/workflow/workflow.audit.task.event", "d2/utils/constants", "json!d2/server.adaptors/widgets/metadata/metadata.forms/task.metadata.template.json", "i18n!d2/server.adaptors/widgets/metadata/metadata.forms/nls/lang" ], function(_, Backbone, WorkflowAuditTask, WorkflowAuditTaskEvent, constants, templateJSON, lang) {
  "use strict";
  var substituteMatcher = /{{([\w-]|(lang.\w))*}}/g;
  function getJSToLimitScope() {
    var jsScopeLimit = "";
    _.each(_.keys(window), function(k) {
      if (!_.isEmpty(k) && k !== "0" && !(k.indexOf("-") !== -1)) {
        jsScopeLimit += "var " + k + " = undefined;";
      }
    });
    return jsScopeLimit;
  }
  function replaceNbsps(str) {
    var re = new RegExp(String.fromCharCode(160), "g");
    return str.replace(re, " ");
  }
  function safelyEval(expr) {
    return eval("(function(){" + getJSToLimitScope() + "; return " + expr + ";})()");
  }
  function createReplacer(context) {
    context = context instanceof Backbone.Model ? context.attributes : context;
    return function(key, value) {
      if (_.isString(value) && !_.isEmpty(value)) {
        var targetVal = value, substitutes = targetVal.match(substituteMatcher), isExpression = false;
        if (substitutes) {
          for (var i = 0; i < substitutes.length; i++) {
            var sub = substitutes[i], actualSub = sub.replace(/[{}]/g, ""), targetContext = context, subValue;
            if (actualSub.startsWith("lang")) {
              targetContext = lang;
              actualSub = actualSub.replace("lang.", "");
            }
            subValue = _.property(actualSub)(targetContext);
            if (subValue === undefined) {
              subValue = "";
            }
            if (_.isString(subValue)) {
              subValue = replaceNbsps(subValue);
            }
            if (substitutes.length === 1 && targetVal.length === sub.length) {
              targetVal = subValue;
            } else {
              isExpression = true;
              if (_.isString(subValue)) {
                subValue = subValue.replace(/(['\\])/g, "\\$&");
              }
              targetVal = targetVal.replace(sub, subValue);
            }
          }
          if (isExpression) {
            targetVal = safelyEval(targetVal);
          }
          return targetVal;
        }
      }
      return value;
    };
  }
  return {
    getMetadataForTask: function(task) {
      var eventDetailsIndex = _.findIndex(templateJSON["page-content"]["dialog"]["content"]["fieldset"]["html-editor"], {
        id: "event_details"
      }), field = eventDetailsIndex <= -1 ? "list" : "html-editor";
      eventDetailsIndex = eventDetailsIndex > -1 ? eventDetailsIndex : _.findIndex(templateJSON["page-content"]["dialog"]["content"]["fieldset"]["list"], {
        id: "event_details"
      });
      if (eventDetailsIndex > -1) {
        templateJSON["page-content"]["dialog"]["content"]["fieldset"][field].splice(eventDetailsIndex, 1);
      }
      if (task instanceof WorkflowAuditTask || task instanceof WorkflowAuditTaskEvent) {
        if (!task.get("is_digital_signature_awaiting_task")) {
          if (_.isUndefined(_.findWhere(templateJSON["page-content"]["dialog"]["content"]["fieldset"]["list"], {
            id: "performerName"
          }))) {
            var performerField = {
              id: "performerName",
              label: lang.performerLabel,
              value: "{{assignee}}",
              field_content_type: "USER_OR_GROUP",
              assistance_type: "custom",
              repeating: false,
              order: 7
            };
            templateJSON["page-content"]["dialog"]["content"]["fieldset"]["list"].push(performerField);
          }
        } else {
          var performerIndex = _.findIndex(templateJSON["page-content"]["dialog"]["content"]["fieldset"]["list"], {
            id: "performerName"
          });
          if (performerIndex > -1) {
            templateJSON["page-content"]["dialog"]["content"]["fieldset"]["list"].splice(performerIndex, 1);
          }
        }
        if (task.get("event_details")) {
          var isDelegateEvent = task.get("delegated_to"), eventDetails = _.extend({
            id: "event_details",
            label: "{{lang.eventDetailsLabel}}",
            repeating: false,
            order: 4
          }, isDelegateEvent ? {
            o: "{{event_details}}",
            field_content_type: "USER_OR_GROUP",
            assistance_type: "custom"
          } : {
            value: "{{event_details}}",
            property_type: "string"
          }), fieldType = isDelegateEvent ? "list" : "html-editor";
          templateJSON["page-content"]["dialog"]["content"]["fieldset"][fieldType].push(eventDetails);
        }
      } else {
        var performerFieldIndex = _.findIndex(templateJSON["page-content"]["dialog"]["content"]["fieldset"]["list"], {
          id: "performerName"
        });
        if (performerFieldIndex > -1) {
          templateJSON["page-content"]["dialog"]["content"]["fieldset"]["list"].splice(performerFieldIndex, 1);
        }
      }
      return JSON.parse(JSON.stringify(templateJSON, createReplacer(task)));
    }
  };
});