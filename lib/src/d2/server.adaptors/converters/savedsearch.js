/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "d2/utils/constants", "i18n!d2/server.adaptors/nls/lang" ], function(_, constants, lang) {
  "use strict";
  var clientServerAttrNameMap = {
    id: "r_object_id",
    name: "object_name",
    modify_date: "r_modify_date",
    modify_user_id: "r_modifier",
    parent_id: "parent-id"
  }, serverClientAttrNameMap = {};
  _.map(clientServerAttrNameMap, function(value, key) {
    serverClientAttrNameMap[value] = key;
  });
  var ObjectTypeNameMapping = {
    d2c_query: lang.advanceSearch,
    d2c_query_category: lang.advanceSearchGroup,
    d2c_query_wizard: lang.advanceSearchForm,
    d2_queryform_config: lang.queryFormSearch
  };
  return {
    convertSavedSearch: function(entry) {
      var attributes = entry.properties || entry, properties = {
        links: entry.links
      };
      var unmappedAttributes = _.omit(attributes, _.keys(this.getServerClientAttrNameMap()));
      _.extend(properties, unmappedAttributes);
      var map = this.getClientServerAttrNameMap();
      _.map(map, function(value, key) {
        properties[key] = attributes[value];
      });
      if (attributes["r_object_type"] === "d2_queryform_config" && attributes["label"]) {
        properties["name"] = attributes["label"];
      }
      properties.type = constants.Types.SAVED_SEARCH_OBJECT;
      properties.type_name = this.getObjectTypeName(properties.r_object_type);
      properties.item_type = properties.type_name;
      properties["search-category"] = (properties["search-category"] || "").toUpperCase();
      if (attributes["r_object_type"] === "d2c_query" || attributes["r_object_type"] === "d2c_query_wizard") {
        properties["search-object-form-data"] = _.omit(entry, "properties", "links");
      }
      _.each(_.keys(entry), function(key) {
        delete entry[key];
      });
      _.extend(entry, properties);
      properties["csuiLazyActionsRetrieved"] = true;
      return properties;
    },
    getObjectTypeName: function(type) {
      return ObjectTypeNameMapping[type];
    },
    getClientServerAttrNameMap: function() {
      return clientServerAttrNameMap;
    },
    getServerClientAttrNameMap: function() {
      return serverClientAttrNameMap;
    }
  };
});