/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/marionette", "csui/utils/commands", "hbs!d2/controls/table/cells/wf.associations.count/impl/wf.associations.count.view", "i18n!d2/controls/table/cells/wf.associations.count/impl/nls/lang", "css!d2/controls/table/cells/wf.associations.count/impl/wf.associations.count.view" ], function(_, Marionette, commands, template, lang) {
  "use strict";
  return Marionette.ItemView.extend({
    tagName: "li",
    className: "d2-cell-wf-count-wrapper",
    template: template,
    events: {
      "click .d2-cell-wf-count-container": "_openWfPerspective",
      "keydown .d2-cell-wf-count-container": "_openWfPerspective"
    },
    templateHelpers: function() {
      return {
        title: _.str.sformat(lang.workflowAssociationTitle, this.model.get("d2_wf_association_count"))
      };
    },
    constructor: function WfAssociationCountView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    _openWfPerspective: function() {
      commands.get({
        signature: "D2-ShowWorkflowHistory"
      }).execute({
        context: this.options.context,
        nodes: [ this.options.model ]
      });
    }
  }, {
    enabled: function(status) {
      return status.node.get("d2_wf_association_count") > 0;
    }
  });
});