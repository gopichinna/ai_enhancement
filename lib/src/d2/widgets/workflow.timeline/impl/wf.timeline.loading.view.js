/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/marionette", "i18n!d2/widgets/workflow.timeline/impl/nls/lang", "hbs!d2/widgets/workflow.timeline/impl/wf.timeline.loading", "css!d2/widgets/workflow.timeline/impl/wf.timeline.loading" ], function(Marionette, lang, template) {
  "use strict";
  var WFTimelineLoadingView = Marionette.LayoutView.extend({
    className: "d2-workflow-timeline-loading-container",
    template: template,
    constructor: function WFTimelineLoadingView(options) {
      options = options || {};
      WFTimelineLoadingView.__super__.constructor.call(this, options);
    },
    templateHelpers: function() {
      return {
        lang: lang
      };
    }
  });
  return WFTimelineLoadingView;
});