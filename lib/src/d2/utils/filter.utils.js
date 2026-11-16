/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/utils/url", "nuc/utils/base", "d2/utils/rest.linkrels", "dctmw/utils/rest.resources", "i18n!d2/utils/impl/nls/lang" ], function($, _, Backbone, Url, base, RestLinkrels, RestResources, lang) {
  "use strict";
  var FilterUtils = function() {
    function _getD2FilterServerConfig(options) {
      var deferred = $.Deferred();
      var url = RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.D2_MY_FILTER_CONFIGS);
      if (options.container_id) {
        url = Url.appendQuery(url, Url.combineQueryString({
          folder_id: options.container_id
        }));
      }
      $.ajax(options.connector.extendAjaxOptions({
        url: url
      })).done(function(data) {
        var filterConfigs = {
          id: "filter",
          name: lang.filterConfigsListLabel,
          type: "filter",
          topics: parseResult(data)
        };
        deferred.resolve(filterConfigs);
      }).fail(deferred.reject);
      return deferred.promise();
    }
    function parseResult(data) {
      var result = [];
      var index = 0;
      _.each(data.entries, function(entry) {
        var properties = entry.content.properties;
        var label = _.isString(properties.label) ? properties.label : properties.label[0];
        label = _.isEmpty(label) ? properties["object_name"] : label;
        result.push({
          id: "filterConfig" + index++,
          multiselect: false,
          label: label,
          name: label,
          total: 0,
          value: properties["object_name"],
          "facet-value": properties["object_name"],
          checked: false,
          level: 0,
          "facet-id": "filter",
          "parent-id": "",
          type: "filter",
          showTotal: false,
          default: properties["is_default"],
          all_versions: properties["all_versions"]
        });
      });
      return result;
    }
    function _fetchFilterConfig(options) {
      var useDefault = options.selectedFilterName === undefined || options.selectedFilterName === "";
      var data = options.d2FilterConfigs;
      var found = false;
      function checkAndApplyFilter() {
        _.each(data?.topics, function(topic) {
          if (!found) {
            if (topic["facet-value"] === options.selectedFilterName) {
              topic.checked = true;
              found = true;
            }
            if (topic.default && useDefault) {
              topic.checked = true;
              topic.defaultUsed = true;
              found = true;
            }
          }
        });
      }
      checkAndApplyFilter();
      if (!found) {
        useDefault = true;
        checkAndApplyFilter();
      }
      if (!found && data?.topics?.length > 0) {
        data.topics[0].checked = true;
      }
      return data;
    }
    function _resetCheckedFilter(options) {
      _.each(options.d2FilterConfigs.topics, function(topic) {
        topic.checked = false;
      });
    }
    function _getSelectedFilter(options) {
      var topic = _.find(options.d2FilterConfigs.topics, function(topic) {
        return topic.checked === true;
      });
      return {
        id: "filter",
        values: [ topic ]
      };
    }
    return {
      fetchFilterConfig: _fetchFilterConfig,
      resetFilterChecked: _resetCheckedFilter,
      getD2FilterServerConfig: _getD2FilterServerConfig,
      getSelectedFilter: _getSelectedFilter
    };
  };
  return FilterUtils();
});