/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/utils/url" ], function(_, $, URL) {
  function verifyNodeAncestors(context) {
    var ancestorCollection, isAncestorReleaseOrRevision;
    ancestorCollection = _.has(context._factories.ancestors.property, "models") && context._factories.ancestors.property.models;
    isAncestorReleaseOrRevision = _.find(ancestorCollection, function(ancestor) {
      return _.contains([ 138, 139 ], ancestor.attributes.type);
    });
    if (!!isAncestorReleaseOrRevision) {
      return false;
    } else {
      return true;
    }
  }
  function getOrderNextValue(container) {
    const deferred = $.Deferred();
    const url = container.connector.getConnectionUrl().getApiBase("v2"), query = URL.combineQueryString({
      fields: [ "properties{order_next}" ]
    }), ajaxOptions = {
      url: URL.combine(url, "nodes", container?.get("id"), "?" + query),
      type: "GET",
      contentType: "application/x-www-form-urlencoded"
    };
    container && container.connector.makeAjaxCall(ajaxOptions).always(function(resp) {
      resp.results && container.set("order_next", resp.results.data.properties.order_next);
      deferred.resolve();
    });
    return deferred.promise();
  }
  return {
    verifyNodeAncestors: verifyNodeAncestors,
    getOrderNextValue: getOrderNextValue
  };
});