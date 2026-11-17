/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/mixins/view.state/node.view.state.mixin", "dctmw/controls/mixins/view.state/widget.view.state.mixin", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "d2/utils/server.query.utils", "hbs!d2/widgets/widget.container/impl/perspective.table.container", "i18n!d2/widgets/widget.container/impl/nls/lang", "css!d2/widgets/widget.container/impl/perspective.table.container" ], function($, _, Backbone, Marionette, NodesMixin, WidgetMixin, LayoutViewPropagationMixin, serverQueryUtils, template, lang) {
  "use strict";
  var PerspectiveTableContainer = Marionette.LayoutView.extend({
    template: template,
    className: "table-container",
    regions: {
      widgetContainer: ".table-container"
    },
    constructor: function PerspectiveTableContainer() {
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.context = this.options.context;
      this.propagateEventsToRegions();
    },
    onShow: function() {
      this.resolveDataForTable().done(() => {
        this.renderWidgetTable();
      });
    },
    resolveDataForTable: function() {
      return $.Deferred().resolve().promise();
    },
    renderWidgetTable: function() {
      var ViewClass = this.getWidgetViewClass(), viewOptions = this.getWidgetViewOptions(), viewInstance = new ViewClass(viewOptions);
      this.widgetContainer.show(viewInstance);
      this.options.collection && this.options.collection.ensureFetched();
    },
    getWidgetViewClass: function() {
      return;
    },
    getWidgetViewOptions: function() {
      return this.options;
    },
    getWidgetCollectionFromFactory: function(widgetFactory) {
      var widgetName = this.getViewStateWidgetName(), opts = {
        options: {
          expanded: true,
          widgetName: widgetName
        }
      }, widgetTableOption = {
        nodeListView: true,
        widgetName: widgetName
      }, factoryOptions = {
        options: _.extend(this._restoreCollectionOptionsFromViewState(), opts, widgetTableOption),
        widget: opts,
        detached: true
      }, addnlFactoryOptions = this.getAddnlFactoryOptions();
      if (addnlFactoryOptions) {
        _.extend(factoryOptions, addnlFactoryOptions);
      }
      return this.options.context.getCollection(widgetFactory, factoryOptions);
    },
    checkDataFetchedWithContext: function(CollectionFactory) {
      if (CollectionFactory) {
        this.options.collection = this.getWidgetCollectionFromFactory(CollectionFactory);
      }
      var dfd = $.Deferred(), widgetType = CollectionFactory ? this.options.collection.widgetType : this.getWidgetType(), widgetName = this.getViewStateWidgetName(), colPrefOpts = {
        widgetName: widgetName,
        widgetType: widgetType,
        connector: this.options.context.getObject("connector")
      };
      if (!widgetType) {
        this.options.context.rejectPerspective(new Backbone.Model(), new Error(lang.MissingFactoryAndWidgetType));
        return dfd.reject();
      }
      serverQueryUtils.fetchColumnPreferences(colPrefOpts).done(dfd.resolve).fail(() => {
        this.options.context.rejectPerspective(new Backbone.Model());
        dfd.reject();
      });
      return dfd.promise();
    },
    getWidgetType: function() {
      return;
    },
    getAddnlFactoryOptions: function() {
      return;
    }
  });
  _.extend(PerspectiveTableContainer.prototype, WidgetMixin);
  _.extend(PerspectiveTableContainer.prototype, NodesMixin);
  _.extend(PerspectiveTableContainer.prototype, LayoutViewPropagationMixin);
  return PerspectiveTableContainer;
});