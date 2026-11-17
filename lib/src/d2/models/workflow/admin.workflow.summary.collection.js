/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/utils/url", "d2/utils/rest.linkrels", "d2/utils/widget.constants", "d2/models/workflow/workflow.summary.collection", "dctmw/utils/rest.resources" ], function(Url, RestLinkrels, widgetConstants, WorkflowSummaryCollection, RestResources) {
  "use strict";
  return WorkflowSummaryCollection.extend({
    widgetType: widgetConstants.D2.ADMIN_WORKFLOWS,
    constructor: function AdminWFSummaryCollection() {
      WorkflowSummaryCollection.prototype.constructor.apply(this, arguments);
    },
    getHref: function() {
      return Url.combine(RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.D2_ALL_WORKFLOWS_STATUS_SUMMARY));
    }
  });
});