/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/marionette3", "csui/perspective.manage/sidebar/search.widget.view", "csui/perspective.manage/sidebar/widget.panel.list.view", "hbs!csui/perspective.manage/sidebar/impl/widget.panel", "css!csui/perspective.manage/sidebar/impl/widget.panel" ], function(_, Marionette, SearchWidgetView, WidgetPanelListView, template) {
  "use strict";
  let WidgetPanelView = Marionette.View.extend({
    template: template,
    className: "csui-new-widget-panel",
    ui: {
      widgetTab: ".csui-widget-list-panel"
    },
    regions: {
      searchRegion: ".csui-search-widget-view",
      accordionRegion: ".csui-widget-list-panel"
    },
    constructor: function WidgetPanelView(options) {
      this.options = options || {};
      this.options.data || (options.data = {});
      this.options.pmanView = options.context.pmanView;
      this.options.existsWidgetTypes = this._getExistsWidgetTypes() || [];
      Marionette.View.prototype.constructor.apply(this, arguments);
    },
    onRender: function() {
      this.showChildView("searchRegion", new SearchWidgetView(this.options));
      let accordionView = new WidgetPanelListView(this.options);
      this.showChildView("accordionRegion", accordionView);
      this.listenTo(this.getChildView("searchRegion"), "search:performed", function(query) {
        let widgetSearchResultsView = new WidgetPanelListView(_.extend({
          query: query
        }, this.options));
        this.showChildView("accordionRegion", widgetSearchResultsView);
      });
      this.listenTo(this.getChildView("searchRegion"), "search:closed", function() {
        let accordionView = new WidgetPanelListView(this.options);
        this.showChildView("accordionRegion", accordionView);
      });
    },
    _getExistsWidgetTypes: function() {
      let perspective = this.options.context.perspective;
      let type = perspective.get("type");
      let perpeCollection = {};
      let existsWidgetTypes = [];
      if (type == "flow") {
        perpeCollection = perspective.get("options");
        perpeCollection.widgets.forEach(_.bind(function(widget) {
          if (!!widget.type) {
            existsWidgetTypes.push(widget.type);
          }
        }, this));
      } else if (type == "left-center-right") {
        perpeCollection = perspective.get("options");
        perpeCollection.center && existsWidgetTypes.push(perpeCollection.center.type);
        perpeCollection.right && existsWidgetTypes.push(perpeCollection.right.type);
        perpeCollection.left && existsWidgetTypes.push(perpeCollection.left.type);
      }
      return existsWidgetTypes;
    }
  });
  return WidgetPanelView;
});