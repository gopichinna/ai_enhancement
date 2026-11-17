/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import $ from "nuc/lib/jquery";

import _ from "nuc/lib/underscore";

import RestLinkrels from "d2/utils/rest.linkrels";

import RestResources from "dctmw/utils/rest.resources";

import WidgetSettingsCollectionFactory from "csui/utils/contexts/factories/widget.settings.collection.factory";

import WidgetUtils from "d2/utils/widgets.utils";

import Session from "dctmw/utils/authenticators/session";

import ConnectorFactory from "nuc/contexts/factories/connector";

import constants from "d2/utils/constants";

export default class WorkflowAssociation {
  static enabled(options) {
    if (options.widgetType && options.widgetName) {
      const preferenceStorageId = WidgetUtils.getPreferenceStorageId(options.widgetType, options.widgetName), widgetSettingsCollection = Session.get().getContext().getCollection(WidgetSettingsCollectionFactory);
      return widgetSettingsCollection.length > 0 && widgetSettingsCollection.get(preferenceStorageId)?.get("showWFAssociationIcon") && options.ids.length > 0 || false;
    }
    return false;
  }
  static parseServerData(serverEntries) {
    return _.reduce(serverEntries || [], (output, entry) => {
      const associatedWfs = _.filter(entry.content["version_wf_associations"], obj => obj["r_object_id"] === entry.content["id"] && obj.workflows && obj.workflows.length > 0), associatedWfLength = associatedWfs.length === 1 && associatedWfs[0].workflows.length;
      if (associatedWfLength > 0) {
        output[entry.content.id] = {
          wf_associations: associatedWfLength
        };
      }
      return output;
    }, {});
  }
  static getData(options) {
    const url = this.getUrl(), me = this, deferred = $.Deferred(), connector = Session.get().getContext().getObject(ConnectorFactory), ids = options.ids, data = {
      "object-ids": ids
    };
    if (!this.enabled(options)) {
      deferred.resolve([]);
    } else {
      $.ajax(connector.extendAjaxOptions({
        url: url,
        type: "POST",
        headers: {
          Accept: constants.MediaTypes.DCTM_JSON,
          "Content-Type": constants.MediaTypes.DCTM_JSON
        },
        data: JSON.stringify(data),
        success: function(response) {
          deferred.resolve({
            d2_wf_association_count: me.parseServerData(response.entries)
          });
        },
        error: function(error) {
          deferred.reject(error);
        }
      }));
    }
    return deferred.promise();
  }
  static getUrl() {
    const currentRepoLinks = RestResources.getCurrentRepository().get("links");
    return RestLinkrels.getLink(currentRepoLinks, RestLinkrels.D2_WORKFLOWS_ASSOCIATION);
  }
}