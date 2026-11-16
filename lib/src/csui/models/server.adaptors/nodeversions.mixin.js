/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/utils/url" ], function(_, Url) {
  "use strict";
  var ServerAdaptorMixin = {
    mixin: function(prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function(options) {
          return this;
        },
        url: function() {
          return this.options.useV2RestApi ? _useV2Url.call(this) : _useV1Url.call(this);
        },
        parse: function(response) {
          return this.options.useV2RestApi ? _parseV2Response.call(this, response) : _parseV1Response.call(this, response);
        },
        getColumnModels: function(columnKeys, definitions) {
          var columns = _.reduce(columnKeys, function(colArray, column) {
            if (column.indexOf("_formatted") >= 0) {
              var shortColumnName = column.replace(/_formatted$/, "");
              if (definitions[shortColumnName]) {
                return colArray;
              }
            } else {
              var definition_short = definitions[column];
              if (!definition_short.definitions_order) {
                var definition_formatted = definitions[column + "_formatted"];
                if (definition_formatted && definition_formatted.definitions_order) {
                  definition_short.definitions_order = definition_formatted.definitions_order;
                }
              }
            }
            var definition = definitions[column];
            switch (column) {
             case "name":
              definition = _.extend(definition, {
                default_action: true,
                contextual_menu: false,
                editable: true,
                filter_key: "name"
              });
              break;
            }
            definition.sort = true;
            colArray.push(_.extend({
              column_key: column
            }, definition));
            return colArray;
          }, []);
          return columns;
        }
      });
    }
  };
  function _useV2Url() {
    return Url.combine(this.connector.getConnectionUrl().getApiBase("v2"), "/nodes/" + this.node.get("id"), "/versions?expand=" + encodeURIComponent("versions{owner_id,locked_user_id}") + "&metadata&" + Url.combineQueryString(this.getRequestedCommandsUrlQuery()));
  }
  function _useV1Url() {
    var query = Url.combineQueryString(this.getExpandableResourcesUrlQuery(), {
      extra: false,
      commands: this.options.commands || []
    });
    return Url.combine(this.node.urlBase(), "/versions?" + query);
  }
  function _parseV1Response(response) {
    var definitions = response.definitions;
    var columnKeys = _.keys(definitions);
    if (!this.options.onlyClientSideDefinedColumns) {
      if (response.definitions_order) {
        for (var idx = 0; idx < response.definitions_order.length; idx++) {
          var column_key = response.definitions_order[idx];
          definitions[column_key].definitions_order = 500 + idx;
        }
      }
    }
    this.columns.reset(this.getColumnModels(columnKeys, definitions));
    if (response.data) {
      _.each(response.data, function(version) {
        version.id_expand = {};
        version.id_expand.type = this.node.get("type");
      }, this);
    }
    return response.data;
  }
  function _parseV2Response(response) {
    var definitions = response.results[0].metadata.versions, finalresponse = [];
    definitions.reserved = {
      key: "reserved",
      name: "reserve"
    };
    var columnKeys = _.keys(definitions);
    this.columns.reset(this.getColumnModels(columnKeys, definitions));
    if (response.results) {
      _.each(response.results, function(version) {
        if (version?.data?.versions) {
          version.data.versions.id_expand = {};
          version.data.versions.id_expand.type = this.node.get("type");
          _parseActions(version.actions, version.data.versions);
          finalresponse.push(version.data.versions);
        }
      }, this);
    }
    return finalresponse;
  }
  function _parseActions(actions, version) {
    version.actions = _.chain(actions.data).keys().map(function(key) {
      var attributes = actions.data[key];
      attributes.signature = key;
      return attributes;
    }).value();
  }
  return ServerAdaptorMixin;
});