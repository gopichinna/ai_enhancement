/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "d2/utils/server.query.utils", "d2/utils/constants", "dctmw/utils/utils", "d2/utils/graphics/graphics.resources", "d2/utils/widget.constants" ], function($, _, Backbone, serverQueryUtils, constants, utils, GraphicsResources, widgetConstants) {
  "use strict";
  return {
    isCurrentVersion: function(nodeModel, versionPropertyName) {
      return this.hasVersionLabel(nodeModel, "CURRENT", versionPropertyName);
    },
    hasVersionLabel: function(nodeModel, label, versionPropertyName) {
      if (nodeModel instanceof Backbone.Model) {
        var versionLabels = nodeModel.get(versionPropertyName || "r_version_label");
        if (_.isString(versionLabels)) {
          versionLabels = [ versionLabels ];
        }
        return _.contains(_.invoke(versionLabels, "trim"), label);
      }
      return false;
    },
    fetchVersionModelData: function(response, isDisableLocationColumn, connector) {
      var me = this, deferred = $.Deferred();
      response = serverQueryUtils.parseResponse(response, {
        scope: me
      });
      _.each(response, function(entry) {
        entry.version_number_name = _.isArray(entry.r_version_label) ? entry.r_version_label[0] : entry.r_version_label;
      });
      var parameters = {
        ids: _.pluck(response, "id"),
        connector: connector,
        permissions: {
          permissionLevel: "read"
        },
        actions: {
          menuType: constants.MenuTypes.DETAIL_VERSIONS,
          widgetType: widgetConstants.D2.VERSIONS
        }
      };
      if (utils.isMobile()) {
        parameters.favorites = true;
      }
      if (!isDisableLocationColumn) {
        _.extend(parameters, {
          locations: {
            fullPath: false,
            ancestorDetails: GraphicsResources.hasConditionAttributes()
          }
        });
      }
      serverQueryUtils.fetchDataForObjects(parameters).done(function(output) {
        _.each(response, function(item) {
          item.actions = output.actions[item.id];
          if (output.locations && output.locations[item.id]) {
            item.parent_id_expand = output.locations[item.id];
            item.parent_name = item.parent_id_expand.name;
          }
          utils.isMobile() ? item.actions.push({
            signature: "properties"
          }) : item.actions.push({
            signature: "VersionProperties"
          });
          var permission = output.permissions[item.id];
          if (permission && permission["base-permission"] && permission["base-permission"].read === true) {
            item.actions.push({
              signature: "open"
            });
          }
          if (output.externalShare && output.externalShare[item.id]) {
            item["externalShare"] = output.externalShare[item.id];
          }
          if (parameters.favorites === true) {
            var favorite = output.favorites[item.id];
            item["favorite"] = favorite ? favorite.favorite : false;
          }
        });
        deferred.resolve(response);
      }).fail(function(err) {
        deferred.reject(err);
      });
      return deferred.promise();
    }
  };
});