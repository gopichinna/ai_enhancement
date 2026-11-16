/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/facet.bar/facet.bar.items.view", "hbs!csui/controls/facet.bar/impl/facet.bar", "i18n!csui/controls/facet.bar/impl/nls/lang", "csui/utils/commands", "csui/controls/facet.bar/savefilter.unsupported.list.ids", "css!csui/controls/facet.bar/impl/facet.view" ], function($, _, Backbone, Marionette, ExtendedFacetBarView, template, lang, commands, unsupportedList) {
  "use strict";
  var FacetBarContainerView = Marionette.LayoutView.extend({
    template: template,
    className: "csui-facet-bar-container-layout",
    ui: {
      saveFilter: ".csui-filter-save"
    },
    regions: {
      facetBarContainerRegion: ".csui-facet-bar-container",
      facetSaveBtnRegion: ".csui-filter-save"
    },
    childView: ExtendedFacetBarView,
    childEvents: {
      "clear:all:filters": "onClearAllFilters",
      "remove:facet:filter": "onRemoveFacetFilter",
      "facet:filters:updated": "onFiltersUpdate"
    },
    events: {
      "click @ui.saveFilter": "onClickSaveFilter",
      "keydown @ui.saveFilter": "onClickSaveFilter"
    },
    templateHelpers: function() {
      this.showSaveFilter = this.showOrHideSaveFilterButton();
      return {
        saveas: lang.saveAs,
        saveAsAria: lang.saveAsAria,
        showSaveFilter: this.showSaveFilter
      };
    },
    constructor: function FacetBarContainerView(options) {
      this.options = options;
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
    },
    onRender: function() {
      this.facetBarView = !this.facetBarView && new ExtendedFacetBarView(this.options);
      this.facetBarContainerRegion.show(this.facetBarView);
    },
    onFiltersUpdate: function() {
      if (this.showSaveFilter && this.facetBarView?.allTopicsCollection?.length > 0) {
        this.ui?.saveFilter[0]?.classList?.remove("binf-hidden");
        this.facetBarContainerRegion?.el?.classList?.add("with-saveas-btn");
      } else {
        this.ui?.saveFilter[0]?.classList?.add("binf-hidden");
        this.facetBarContainerRegion?.el?.classList?.remove("with-saveas-btn");
      }
    },
    onClearAllFilters: function() {
      if (this.ui.saveFilter && this.ui.saveFilter.length > 0) {
        this.ui.saveFilter.addClass("binf-hidden");
        this.facetBarContainerRegion?.el?.classList?.remove("with-saveas-btn");
      }
      this.trigger("remove:all");
    },
    onRemoveFacetFilter: function(childView) {
      this.trigger("remove:filter", childView.removeFilter);
    },
    showOrHideSaveFilterButton: function() {
      var self = this;
      if (unsupportedList.length > 0) {
        var isUnsupportedType = _.some(unsupportedList, function(ids) {
          var unsupportedTypes = typeof ids.saveFilterUnsupportedList === "function" ? ids.saveFilterUnsupportedList(self.options) : ids.saveFilterUnsupportedList, nodeType = self.options.context.getModel("node").attributes.type;
          if (_.isArray(unsupportedTypes) || _.isNumber(unsupportedTypes)) {
            return _.isArray(unsupportedTypes) ? _.contains(unsupportedTypes, nodeType) : unsupportedTypes === nodeType;
          } else {
            throw new Error("Unsupported object type");
          }
        });
        return !isUnsupportedType;
      } else if (_.has(this.options, "showSaveFilter")) {
        return this.options.showSaveFilter;
      } else {
        var objectTypes = this.options.context && this.options.context._factories.objecttypes && _.has(this.options.context._factories.objecttypes.property.attributes, "objecttypes") && this.options.context._factories.objecttypes.property.attributes.objecttypes;
        return !!_.find(objectTypes, function(object) {
          return object.type === 899;
        });
      }
    },
    onClickSaveFilter: function(event) {
      if (event.type === "click" || event.type === "keydown" && event.keyCode === 13) {
        event.preventDefault();
        event.stopPropagation();
        var context = this.options.context, connector = this.collection.connector, node = this.collection.node, facetCollection = this.collection, saveFilter = commands.get("SaveFilter"), promise = saveFilter.execute({
          context: context,
          nodes: new Backbone.Collection(node),
          facets: facetCollection,
          container: node,
          connector: connector,
          isKeyEvent: event?.type === "keydown" ?? false
        });
        const self = this;
        promise.always(function(status) {
          status.cancelled && self.ui.saveFilter.focus();
        });
      }
    }
  });
  return FacetBarContainerView;
});