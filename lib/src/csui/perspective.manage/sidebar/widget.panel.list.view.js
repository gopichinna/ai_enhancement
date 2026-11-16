/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/perspective.manage/impl/options.form.view", "i18n!csui/perspective.manage/impl/nls/lang", "csui/perspective.manage/impl/widget.list.view", "csui/perspective.manage/sidebar/widget.panel.item.view", "csui/perspective.manage/sidebar/search.widget.item.view", "csui/perspective.manage/sidebar/search.no.results.view", "css!csui/perspective.manage/sidebar/impl/widget.panel.list.css" ], function(_, $, Backbone, WidgetOptionsFormView, Lang, WidgetListView, WidgetPanelItemView, SearchWidgetItemView, NoSearchResultsView) {
  "use strict";
  const WidgetPanelListView = WidgetListView.extend({
    constructor: function WidgetPanelListView(options) {
      this.options = options || {};
      this.options.data || (options.data = {});
      WidgetListView.prototype.constructor.apply(this, arguments);
      this.noSearchResultsView = new NoSearchResultsView();
    },
    filterWidgetsBySearch: function(allWidgets, query) {
      let widgetNames = this.extractWidgetNames(allWidgets.models);
      let filteredWidgetNames = widgetNames.filter(function(widgetName) {
        return widgetName?.split(" ").join("").toLowerCase().includes(query);
      });
      return allWidgets.filter(function(widget) {
        return filteredWidgetNames.some(function(name) {
          return widget.get("manifest").title?.includes(name);
        });
      });
    },
    extractWidgetNames: function(WidgetModels) {
      return WidgetModels.map(function(widgetModel) {
        let widgetName = widgetModel.get("manifest").title?.trim();
        return widgetName;
      });
    },
    _groupWidgetsByModule: function() {
      let moduleCollection = new Backbone.Collection();
      if (this.options?.query?.length) {
        let filteredWidgets = this.filterWidgetsBySearch(this.allWidgets, this.options.query);
        if (!filteredWidgets.length) {
          this.renderNoSearchResults();
        }
        this.allWidgets = filteredWidgets;
      }
      let widgets = this.allWidgets.filter(function(widget) {
        let manifest = widget.get("manifest");
        if (!manifest || !_.has(manifest, "title") || !_.has(manifest, "description") || manifest.deprecated) {
          return false;
        }
        let schema = JSON.parse(JSON.stringify(manifest.schema || {})), options = JSON.parse(JSON.stringify(manifest.options || {})), isValidSchema = WidgetOptionsFormView._normalizeOptions(schema.properties, options.fields || {}, {});
        if (!isValidSchema) {
          return false;
        }
        return true;
      });
      _.each(widgets, _.bind(function(widget) {
        let manifest = _.defaults(widget.get("manifest"), {
          allowMultiple: true,
          title: Lang.noTitle
        }), canDragAndDrop = manifest.allowMultiple;
        if (!canDragAndDrop) {
          canDragAndDrop = $.inArray(widget.get("id"), this.options.existsWidgetTypes) === -1;
        }
        widget.set({
          allowMultiple: manifest.allowMultiple,
          canDragAndDrop: canDragAndDrop,
          title: manifest.title
        });
      }, this));
      _.each(_.groupBy(widgets, function(widget) {
        return widget.serverModule.id;
      }), function(val, key) {
        let title = _.first(val).serverModule.get("title");
        title = title ? title.replace(/OpenText /, "") : _.first(val).serverModule.get("id").toUpperCase();
        moduleCollection.add({
          id: key,
          title: title,
          widgets: val
        });
      });
      return moduleCollection;
    },
    renderItem: function(model) {
      let parentView = this;
      const itemView = this.options.query?.length ? new SearchWidgetItemView({
        model: model,
        parentView: parentView,
        context: this.context,
        query: this.options.query
      }) : new WidgetPanelItemView({
        model: model,
        parentView: parentView,
        context: this.context
      });
      itemView.render();
      this.listenTo(itemView, "widgets:expanded", _.bind(this.trigger, this, "dom:refresh", this));
      if (this.options?.query) {
        itemView.trigger("expand:header");
      }
      $(this.el).append(itemView.el);
    },
    renderNoSearchResults: function() {
      return this.noSearchResultsView.render();
    }
  });
  return WidgetPanelListView;
});