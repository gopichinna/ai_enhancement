/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/models/node.facets/facet.query.mixin", "csui/utils/contexts/factories/recycle.bin", "i18n!csui/widgets/recycle.items.table/impl/nls/lang" ], function(_, FacetQueryMixin, RecycleBinVolumeFactory, lang) {
  "use strict";
  var ServerAdaptorMixin = {
    mixin: function(prototype) {
      FacetQueryMixin.mixin(prototype);
      var originalSync = prototype.sync;
      return _.extend(prototype, {
        filterQueryParameterName: "filter",
        makeServerAdaptor: function(options) {
          return this;
        },
        url: function() {
          return;
        },
        sync: function(method, model, options) {
          return originalSync.apply(this, arguments);
        },
        parse: function(response, options) {},
        _parseFacets: function(facets) {
          let topics;
          if (facets) {
            topics = convertFacets(facets.selected, true).concat(convertFacets(facets.available, false));
          }
          this.reset(topics);
        },
        _setFacets: function(response) {
          let availableFacets = this.options.context.getModel(RecycleBinVolumeFactory).get("modes_available");
          availableFacets = availableFacets.slice(0, -1);
          const displayNames = {
            user_deleted_today: lang.myItemsToday,
            user_deleted: lang.myItems,
            anyone_deleted_today: lang.allItemsToday
          };
          const facetItems = availableFacets.map(facetValue => {
            return {
              value: facetValue,
              display_name: displayNames[facetValue]
            };
          });
          let facets = {
            available: [ {
              count_exceeded: false,
              display_name: lang.deletedItems,
              facet_items: facetItems,
              name: "recyclebin"
            } ]
          };
          return facets;
        }
      });
    }
  };
  function convertFacets(facets, selected) {
    return _.map(facets, function(facet) {
      let topics = _.map(facet.facet_items, function(topic) {
        return {
          name: topic.display_name,
          total: topic.count,
          value: topic.value,
          selected: selected,
          select_multiple: false,
          multiselect: false
        };
      });
      return {
        id: facet.name,
        name: facet.display_name,
        type: facet.type,
        topics: topics,
        items_to_show: 5
      };
    });
  }
  return ServerAdaptorMixin;
});