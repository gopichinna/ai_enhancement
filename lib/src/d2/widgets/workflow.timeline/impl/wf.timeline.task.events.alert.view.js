/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/marionette", "i18n!d2/widgets/workflow.timeline/impl/nls/lang", "hbs!d2/widgets/workflow.timeline/impl/wf.timeline.task.events.alert", "css!d2/widgets/workflow.timeline/impl/wf.timeline.task.events.alert" ], function(_, Marionette, lang, template) {
  "use strict";
  var WFTimelineTaskEventsErrorView = Marionette.LayoutView.extend({
    className: "d2-workflow-timeline-task-alert",
    template: template,
    constructor: function WFTimelineTaskEventsErrorView(options) {
      options = options || {};
      WFTimelineTaskEventsErrorView.__super__.constructor.call(this, options);
    },
    templateHelpers: function() {
      return _.extend({
        lang: lang
      }, this.options);
    },
    onRender: function() {
      this.$el.addClass("type-" + (this.options.alertType || "error"));
    }
  });
  return WFTimelineTaskEventsErrorView;
});