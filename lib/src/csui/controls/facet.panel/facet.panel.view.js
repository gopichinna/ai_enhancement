/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/utils/base", "csui/models/facets", "csui/models/facettopics", "csui/models/nodefacets2", "smart/controls/facet.panel/facet.panel.view", "i18n!csui/controls/facet.panel/impl/nls/lang" ], function(_, $, base, FacetCollection, FacetTopicCollection, NodeFacet2Collection, SmartFacetPanelView, lang) {
  "use strict";
  var FacetPanelView = SmartFacetPanelView.extend({
    behaviors: function() {
      return _.extend(SmartFacetPanelView.behaviors || {}, {});
    },
    constructor: function FacetPanelView(options = {}) {
      this.facets = options.collection;
      options.collection = this._getAvailableFacets();
      options.displayCountProps = options.displayCountProps;
      options.maxFacetSelection = options.maxFacetSelection ?? 20;
      SmartFacetPanelView.prototype.constructor.call(this, options);
      this.listenTo(this, "fetch:more:facets", _.bind(this.fetchMoreFacets, this));
    },
    onRender: function() {
      this._toggleCollectionStateView();
    },
    _toggleCollectionStateView: function() {
      if (this.collection.length === 0) {
        this.$el.find(".csui-collection-state").addClass("binf-hidden");
      }
    },
    fetchMoreFacets: function(childView) {
      var self = this, deferred = $.Deferred();
      this.nodeFacetsCollection = childView.model.get("nodeFacetsCollection");
      var facetId = childView.model.get("id"), options = {
        filters: this.nodeFacetsCollection.filters,
        facetIds: [ facetId ],
        node: this.nodeFacetsCollection.node
      }, nodeFacets = new NodeFacet2Collection(null, options);
      this.blockActions && this.blockActions();
      nodeFacets.fetch().always(function() {
        self.unblockActions && self.unblockActions();
      }).done(function() {
        childView.model.topics.reset(nodeFacets.get(facetId).topics.models, {
          silent: true
        });
        childView.collection.reset(childView.model.topics.models);
        deferred.resolve();
        childView.collection.trigger("more:facets:fecthed");
      }).fail(function(err) {
        var error = new base.Error(err);
        childView.collection.trigger("more:facets:fetch:failed", error);
        deferred.reject(error);
      });
      return deferred.promise();
    },
    _getAvailableFacets: function() {
      var availableFacets = this.facets.getAvailableFacets();
      this.listenTo(this.facets, "reset", function() {
        var availableFacets = this.facets.getAvailableFacets();
        this.collection.reset(availableFacets);
      });
      var self = this;
      this.listenTo(this.facets, "request", function() {
        self.originatingView && self.originatingView.blockActions();
      });
      this.listenTo(this.facets, "sync", function() {
        self.originatingView && self.originatingView.unblockActions();
        if (self?.originatingView?.filterToolItemModel?.get("isKeyEvent")) {
          $(self.$el.find(".csui-facet")[0]).trigger("focus");
        }
        this._toggleCollectionStateView();
      });
      this.listenTo(this.facets, "destroy", function() {
        self.originatingView && self.originatingView.unblockActions();
      });
      this.listenTo(this, "destroy", function() {
        self.originatingView && self.originatingView.unblockActions();
      });
      this.listenTo(this.facets, "error", function() {
        self.originatingView && self.originatingView.unblockActions();
      });
      this.listenTo(this, "error", function() {
        self.originatingView && self.originatingView.unblockActions();
      });
      return new FacetCollection(availableFacets);
    }
  });
  return FacetPanelView;
});