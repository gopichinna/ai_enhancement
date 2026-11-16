/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "esoc/controls/userwidget/userwidget.view", "d2/utils/format.utils", "i18n!d2/utils/impl/nls/lang", "i18n!d2/widgets/workflow.timeline/impl/nls/lang", "hbs!d2/widgets/workflow.timeline/impl/wf.simple.event.performer", "hbs!d2/widgets/workflow.timeline/impl/wf.timeline.item.wfevent", "css!d2/widgets/workflow.timeline/impl/wf.timeline.item", "css!d2/widgets/workflow.timeline/impl/wf.timeline.item.wfevent" ], function(_, $, Marionette, LayoutViewEventsPropagationMixin, UserWidgetView, formatUtil, utilLang, lang, templatePerformer, template) {
  "use strict";
  var EVNET_ID_TO_CLASSNAME_SUFFIX = {
    d2_workflow_started: "running",
    d2_workflow_scheduled: "scheduled",
    d2_workflow_running: "running",
    d2_workflow_halted: "paused",
    d2_workflow_update_supervisor: "supervisor_changed",
    d2_workflow_performers_update: "performer_updated",
    d2_workflow_resumed: "resumed",
    dm_finishworkflow: "finished",
    d2_workflow_aborted: "aborted"
  };
  var CustomUserWidgetView = UserWidgetView.extend({
    initialize: function() {
      UserWidgetView.prototype.initialize.apply(this, arguments);
      this.showProfilePic = true;
    },
    templateHelpers: function() {
      var options = UserWidgetView.prototype.templateHelpers.apply(this, arguments);
      options.messages.showUserDisplayName = true;
      return options;
    }
  });
  var SimpleEventPerformerView = Marionette.ItemView.extend({
    attributes: {
      tabindex: 0
    },
    className: "d2-simple-wf-event-performer",
    template: templatePerformer,
    templateHelpers: function() {
      return {
        performerIconClass: this.options && this.options.performerIconClass || "d2-icon-wf-performer-system",
        performerName: this.model && this.model.get("user_name") || lang.labelSystemPerformerName
      };
    }
  });
  var WFTimelineItemWFEventView = Marionette.LayoutView.extend({
    className: "d2-workflow-timeline-item-container d2-wf-timeline-event-container",
    template: template,
    regions: {
      rgnPerformerContainer: "> .d2-wf-timeline-event .performer-container"
    },
    constructor: function WFTimelineItemWFEventView(options) {
      options = options || {};
      WFTimelineItemWFEventView.__super__.constructor.call(this, options);
      this.propagateEventsToRegions();
    },
    templateHelpers: function() {
      var options = {
        itemProperties: [ {
          label: lang.labelDate,
          value: formatUtil.convertToClientFormat(this.model.get("time_stamp"), true)
        } ],
        summaryIconSuffix: EVNET_ID_TO_CLASSNAME_SUFFIX[this.model.get("event_id")]
      };
      if (this.model.get("event_id") === "d2_workflow_started") {
        options["event_name"] = utilLang.statusNameRunning;
      }
      return _.defaults(options, this.model.attributes);
    },
    onRender: function() {
      if (!this.eventPerformerView) {
        if (this.model.has("user_name") && this.model.get("user_name") !== "system") {
          this.eventPerformerView = new CustomUserWidgetView({
            userid: this.model.get("user_name"),
            context: this.options.context,
            connector: this.options.context.getObject("connector"),
            showUserWidgetFor: "",
            showMiniProfile: false,
            showUserProfileLink: false,
            showPresenceIndicator: false
          });
        } else {
          this.eventPerformerView = new SimpleEventPerformerView({
            model: this.model
          });
        }
        this.rgnPerformerContainer.show(this.eventPerformerView);
      }
    },
    onBeforeDestroy: function() {
      this.eventPerformerView && this.eventPerformerView.destroy();
    }
  });
  _.extend(WFTimelineItemWFEventView.prototype, LayoutViewEventsPropagationMixin);
  return WFTimelineItemWFEventView;
});