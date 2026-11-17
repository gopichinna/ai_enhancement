/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/utils/url", "nuc/models/node/node.model", "nuc/models/mixins/connectable/connectable.mixin", "nuc/models/mixins/fetchable/fetchable.mixin", "nuc/models/browsable/browsable.mixin", "nuc/models/mixins/v2.delayed.commandable/v2.delayed.commandable.mixin", "nuc/models/mixins/v2.additional.resources/v2.additional.resources.mixin", "d2/server.adaptors/models/d2.fetchable.mixin", "d2/widgets/advanced.search.results/search.facets", "d2/widgets/advanced.search.results/advanced.search.results.mixin", "i18n!csui/models/widget/nls/lang", "nuc/utils/deepClone/deepClone" ], function(_, $, Backbone, Url, NodeModel, ConnectableMixin, FetchableMixin, BrowsableMixin, DelayedCommandableV2Mixin, AdditionalResourcesV2Mixin, D2FetchableMixin, SearchFacetCollection, ServerAdaptorMixin, lang) {
  "use strict";
  var SearchResultCollection = Backbone.Collection.extend({
    model: NodeModel,
    constructor: function SearchResultCollection(models, options) {
      this.options = options || (options = {});
      this.expand = options.expand || {
        properties: "reserved_user_id"
      };
      Backbone.Collection.prototype.constructor.call(this, models, options);
      this.includeCommands = options.commands || [];
      this.title = lang.searchResults;
      this.searchFacets = new SearchFacetCollection();
      this.makeConnectable(options).makeFetchable(options).makeAdditionalResourcesV2Mixin(options).makeBrowsable(options).makeDelayedCommandableV2(options).makeServerAdaptor(options).makeD2Fetchable(options);
    },
    clone: function() {
      return new this.constructor(this.models, {
        connector: this.connector,
        skip: this.skipCount,
        top: this.topCount,
        filter: _.deepClone(this.filters),
        orderBy: _.clone(this.orderBy),
        expand: _.clone(this.expand),
        includeActions: this.includeActions,
        commands: _.clone(this.includeCommands),
        includeCommands: _.clone(this.includeCommands),
        defaultActionCommands: _.clone(this.defaultActionCommands),
        delayRestCommands: this.delayRestCommands
      });
    },
    getResourceScope: function() {
      return _.deepClone({
        includeResources: this._additionalResources,
        includeCommands: this.includeCommands,
        commands: this.includeCommands,
        defaultActionCommands: this.defaultActionCommands
      });
    },
    setResourceScope: function(scope) {
      this.excludeResources();
      scope.includeResources && this.includeResources(scope.includeResources);
      this.resetCommands();
      scope.commands && this.setCommands(scope.commands);
      scope.includeCommands && (this.includeCommands = scope.includeCommands);
      this.resetDefaultActionCommands();
      scope.defaultActionCommands && this.setDefaultActionCommands(scope.defaultActionCommands);
    }
  });
  BrowsableMixin.mixin(SearchResultCollection.prototype);
  ConnectableMixin.mixin(SearchResultCollection.prototype);
  FetchableMixin.mixin(SearchResultCollection.prototype);
  AdditionalResourcesV2Mixin.mixin(SearchResultCollection.prototype);
  ServerAdaptorMixin.mixin(SearchResultCollection.prototype);
  DelayedCommandableV2Mixin.mixin(SearchResultCollection.prototype);
  D2FetchableMixin.mixin(SearchResultCollection.prototype);
  _.extend(SearchResultCollection.prototype, {
    isFetchable: function() {
      return true;
    },
    cacheId: "",
    setCacheId: function() {
      this.cacheId = "";
    },
    setDefaultPageNum: function() {
      this.skipCount = 0;
    },
    setPreviousOrder: function(attributes, fetch) {
      if (this.previousOrderBy !== attributes) {
        this.previousOrderBy = attributes;
        if (fetch !== false) {
          this.fetch({
            skipSort: false
          });
        }
        return true;
      }
    }
  });
  return SearchResultCollection;
});