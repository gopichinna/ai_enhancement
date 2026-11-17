/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/backbone", "csui/lib/marionette3", "csui/perspective.manage/impl/options.form.view", "csui/perspective.manage/sidebar/search.widget.item.view", "i18n!csui/perspective.manage/impl/nls/lang", "csui/models/widget/widget.collection", "csui/perspective.manage/sidebar/search.no.results.view", "hbs!csui/perspective.manage/impl/widget.item" ], function(_, Backbone, Marionette, WidgetOptionsFormView, SearchWidgetItemView, Lang, WidgetCollection, NoSearchResultsView, WidgetItemTemplate) {
  "use strict";
  const WidgetSearchResultsView = Marionette.CollectionView.extend({
    template: WidgetItemTemplate,
    className: "cs-module-list",
    childView: SearchWidgetItemView,
    emptyView: NoSearchResultsView,
    constructor: function WidgetSearchResultsView(options = {}) {
      this.options = options;
      this.allWidgets = new WidgetCollection(null, {
        includeView: false,
        includeToolItems: false
      });
      this.collection = new Backbone.Collection();
      Marionette.CollectionView.prototype.constructor.call(this, options);
      this.context = this.options.pmanView.context;
      this.fetchAllWidgets();
    },
    childViewOptions: function() {
      return {
        parentView: this,
        context: this.context,
        query: this.options.query
      };
    },
    fetchAllWidgets: function() {
      const self = this;
      this.allWidgets.fetch().done(function() {
        self.collection.reset(self.setWidgetsByModule().models);
      });
    },
    initiateFilterWidgets: function(query) {
      this.options.query = query;
      let groupedWidgets = this.setWidgetsByModule().models;
      this.collection.reset(groupedWidgets);
    },
    filterWidgetsBySearch: function(allWidgets, query) {
      let widgetNames = this.extractWidgetNames(allWidgets.models);
      let filteredWidgetNames = widgetNames.filter(function(widgetName) {
        return widgetName?.split(" ").join("").toLowerCase().includes(query);
      });
      return allWidgets.filter(function(widget) {
        return filteredWidgetNames.some(function(name) {
          return widget.get("manifest")?.title?.includes(name);
        });
      });
    },
    extractWidgetNames: function(WidgetModels) {
      return WidgetModels.map(function(widgetModel) {
        let widgetName = widgetModel.get("manifest")?.title?.trim();
        return widgetName;
      });
    },
    setWidgetsByModule: function() {
      let moduleCollection = new Backbone.Collection();
      let filteredWidgets = [];
      if (this.options?.query?.length) {
        filteredWidgets = this.filterWidgetsBySearch(this.allWidgets, this.options.query).filter(widget => {
          let manifest = widget.get("manifest");
          if (!manifest || !manifest.title || !manifest.description || manifest.deprecated) {
            return false;
          }
          let schema = JSON.parse(JSON.stringify(manifest.schema || {}));
          let options = JSON.parse(JSON.stringify(manifest.options || {}));
          if (!WidgetOptionsFormView._normalizeOptions(schema.properties, options.fields || {}, {})) {
            return false;
          }
          return true;
        }).map(widget => {
          let manifest = {
            allowMultiple: widget.get("manifest").allowMultiple || true,
            title: widget.get("manifest").title || Lang.noTitle
          };
          let canDragAndDrop = manifest.allowMultiple;
          if (!canDragAndDrop) {
            canDragAndDrop = !this.options.existsWidgetTypes.includes(widget.get("id"));
          }
          widget.set({
            allowMultiple: manifest.allowMultiple,
            canDragAndDrop: canDragAndDrop,
            title: manifest.title
          });
          return widget;
        });
        const groupedWidgets = {};
        filteredWidgets.forEach(widget => {
          let moduleId = widget.serverModule.id;
          if (!groupedWidgets[moduleId]) {
            groupedWidgets[moduleId] = [];
          }
          groupedWidgets[moduleId].push(widget);
        });
        for (let key in groupedWidgets) {
          if (groupedWidgets.hasOwnProperty(key)) {
            let val = groupedWidgets[key];
            let title = val[0].serverModule.get("title")?.replace(/OpenText /, "") || key.toUpperCase();
            moduleCollection.add({
              id: key,
              title: title,
              widgets: val
            });
          }
        }
      }
      return moduleCollection;
    }
  });
  return WidgetSearchResultsView;
});