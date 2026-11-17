/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/backbone", "csui/utils/url", "csui/models/node/node.model", "csui/utils/deepClone/deepClone" ], function(_, Backbone, Url, NodeModel) {
  "use strict";
  var RecentlyAccessed2Model = NodeModel.extend({
    parse: function(response, options) {
      var ra, ra_version, ra_propertiesUser, ra_parentIdExpanded;
      if (response.data && response.data.properties) {
        ra = response.data.properties;
        ra_version = response.data.versions;
        ra_propertiesUser = response.data.properties_user;
        ra_parentIdExpanded = response.data.properties.parent_id_expand;
      } else {
        ra = response;
        ra_version = response.versions;
        ra_propertiesUser = response.properties_user;
        ra_parentIdExpanded = response.parent_id_expanded;
      }
      ra.short_name = ra.name;
      if (!ra.size) {
        if (ra.container) {
          ra.size = ra.container_size;
        } else if (ra_version) {
          ra.size = ra_version.file_size;
        }
      }
      if (!ra.mime_type && ra_version && ra_version.mime_type) {
        ra.mime_type = ra_version.mime_type;
      }
      if (!ra.access_date_last && ra_propertiesUser && ra_propertiesUser.access_date_last) {
        ra.access_date_last = ra_propertiesUser.access_date_last;
      }
      ra.parent_name = "";
      if (!ra.parent_name && ra_parentIdExpanded && ra_parentIdExpanded.name) {
        ra.parent_name = ra_parentIdExpanded.name;
      }
      return NodeModel.prototype.parse.call(this, response, options);
    }
  });
  return RecentlyAccessed2Model;
});