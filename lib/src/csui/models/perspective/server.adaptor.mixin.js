/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/utils/url" ], function(_, $, Url) {
  "use strict";
  var ServerAdaptorMixin = {
    mixin: function(prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function(options) {
          return this;
        },
        isFetchableDirectly: function() {
          return this.get("id") > 0;
        },
        urlBase: function() {
          var id = this.get("id"), url = this.connector.connection.url;
          let query;
          if (this.has("personalize")) {
            query = Url.combineQueryString({
              personalize: this.get("personalize")
            });
          }
          if (!id) {
            url = Url.combine(url, "perspectives");
          } else if (!_.isNumber(id) || id > 0) {
            url = Url.combine(url, "perspectives", id);
          } else {
            throw new Error("Unsupported id value");
          }
          if (query) {
            url += "?" + query;
          }
          return url;
        },
        url: function() {
          var url = this.urlBase();
          return url;
        },
        parse: function(response) {
          var perspectives = response.perspectives;
          if (!perspectives) {
            return response;
          }
          if (perspectives.length === 0) {
            return {};
          }
          perspectives = _.each(perspectives, function(perspective) {
            perspective.cascading = perspective.cascading + "";
            perspective.containerType = perspective.container_type;
            perspective.constantData = perspective.constant_data;
            perspective.overrideType = perspective.override_type;
            perspective.overrideId = perspective.override_id;
            perspective.nodepath = perspective.node_path;
            perspective.rules = perspective.rule_data;
            perspective.perspective = JSON.parse(perspective.perspective);
            perspective.constant_extraction_mode = perspective.container_type;
            perspective.pnodepath = perspective.perspective_node_path;
          });
          return {
            perspectives: perspectives
          };
        }
      });
    }
  };
  return ServerAdaptorMixin;
});