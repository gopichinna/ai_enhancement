/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "d2/utils/contexts/factories/admin.workflow.summary.factory", "d2/widgets/workflow.summary/workflow.summary.view", "i18n!d2/widgets/workflow.summary/impl/nls/lang", "i18n!d2/widgets/admin/workflow.summary/impl/nls/lang" ], function(_, AdminWFSummaryFactory, WorkflowSummaryView, wfSummarylang, lang) {
  "use strict";
  return WorkflowSummaryView.extend({
    constructor: function AdminWFSummaryView(options) {
      options || (options = {});
      _.extend(options, {
        collectionFactory: AdminWFSummaryFactory,
        lang: _.defaults({}, lang, wfSummarylang)
      });
      WorkflowSummaryView.prototype.constructor.call(this, options);
      this.options.cssClass = "d2-admin-workflows d2-my-wfsummary wf-wfstatus";
    }
  });
});