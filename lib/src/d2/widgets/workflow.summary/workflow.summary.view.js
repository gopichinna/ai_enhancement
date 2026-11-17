/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "csui/behaviors/collection.state/collection.state.behavior", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "csui/utils/non-emptying.region/non-emptying.region", "dctmw/controls/list/list.state.view", "d2/controls/donut.chart/donut.chart.view", "d2/widgets/widgettile/widgettile.view", "d2/utils/task.utils", "d2/utils/contexts/factories/workflow.summary.factory", "d2/utils/constants", "dctmw/utils/user.preference.storage", "d2/utils/contexts/factories/widget.view.state.factory", "i18n!d2/widgets/workflow.summary/impl/nls/lang", "css!d2/widgets/workflow.summary/impl/workflow.summary" ], function(_, $, Marionette, CollectionStateBehavior, PerfectScrollingBehavior, NonEmptyingRegion, ListStateView, DonutChartView, WidgetTileView, TaskUtils, WFSummaryFactory, constants, userPreference, WidgetViewStateModelFactory, lang) {
  "use strict";
  var colorMap = {
    scheduled: "#7E929F",
    running: "#2E3D98",
    paused: "#EEB111"
  };
  return WidgetTileView.extend({
    constructor: function WFSummaryView(options) {
      var param = this.getFactoryParam() || "widget";
      options[param] = options[param] || {};
      options[param].options = options.data;
      options.attributes = options.data.widgetName && {
        id: _.uniqueId(options.data.widgetName.replace(/ /g, ""))
      };
      let collectionFactory = options.collectionFactory || WFSummaryFactory, collection = options.collection || options.context.getCollection(collectionFactory, options);
      collection.expanded = false;
      this.completeCollection = collection;
      _.defaults(options, {
        collectionFactory: WFSummaryFactory,
        lang: lang,
        cssClass: "d2-my-wfsummary wf-wfstatus",
        limited: false,
        collection: collection,
        hideSearch: true
      });
      this.ui = _.extend(this.ui || {}, {
        listContainer: ".binf-list-group",
        wfSummaryTileContent: ".tile-content"
      });
      this.behaviors = _.extend({
        CollectionState: {
          behaviorClass: CollectionStateBehavior,
          collection: function() {
            return this.completeCollection;
          },
          stateView: ListStateView,
          stateMessages: {
            empty: lang.NoWfSummary,
            failed: lang.failedListText,
            zeroResults: lang.NoWfSummary
          }
        }
      }, _.omit(this.behaviors, "CollectionState"));
      this.disableAppScopeBehavior = true;
      WidgetTileView.prototype.constructor.call(this, options);
      this.listenTo(this.collection, "update reset", this._renderChart);
      this.listenTo(this.context, "d2:workflow:started", function() {
        this.collection.fetch({
          reload: true
        });
      });
      this._isSearchInputVisible = _.noop;
      this._focusList = null;
    },
    getFactoryParam: function() {
      return "wfsummary";
    },
    onClickOpenPerspective: function(target) {
      var wfStates = target && target.name ? [ target.name ] : Object.keys(colorMap), widgetViewStateModel = this.context.getObject(WidgetViewStateModelFactory);
      widgetViewStateModel && widgetViewStateModel.set("qform-param", JSON.stringify({
        "wf-states": wfStates
      }));
      userPreference.saveLocalStorePreference(userPreference.StorageTypes.SEARCH_PANEL_VISIBILITY, constants.WidgetId.WORKFLOWS, true);
      this.setViewStateWidgetName(this.options.widgetName);
      this.context.viewStateModel.set("enabled", true);
      this.applicationScopeModel.set("id", this.options.applicationScope);
      this.trigger("open:workflows:perspective");
    },
    onShow: function() {
      this._renderChart();
      this.ui.wfSummaryTileContent.removeAttr("role aria-labelledby");
    },
    _renderChart: function() {
      if (this.collection.fetching || this.collection.isEmpty()) {
        return;
      }
      if (!this.$el.is(":visible")) {
        this.listenToOnce(this, "dom:refresh", this._renderChart);
        return;
      }
      if (!this.rgnDonutChart) {
        var $el = $("<div>").addClass("wfstatus-donut-chart").insertBefore(this.ui.listContainer);
        this.rgnDonutChart = new NonEmptyingRegion({
          el: $el
        });
      }
      this.ui.listContainer.addClass("binf-hidden");
      var donutDataSet = _.compact(this.collection.map(function(m) {
        var status = m.get("status"), category = status.toLowerCase(), label = TaskUtils.getStatusObject(status);
        if (m.get("count") > 0) {
          return {
            value: m.get("count"),
            name: category,
            label: label.statusName,
            color: colorMap[category],
            skip: category === "finished"
          };
        }
      })), options = {
        parent: this.rgnDonutChart,
        totalLabel: lang.labelTotal,
        dataset: donutDataSet
      }, view = new DonutChartView(options);
      this.rgnDonutChart.show(view);
      view.on("show:running:workflows show:scheduled:workflows show:paused:workflows show:my:workflows", this.onClickOpenPerspective.bind(this));
    },
    onBeforeDestroy: function() {
      this.rgnDonutChart && this.rgnDonutChart.reset().destroy();
    }
  });
});