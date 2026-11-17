/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import Url from "nuc/utils/url";

import RestResources from "dctmw/utils/rest.resources";

import RestLinkrels from "d2/utils/rest.linkrels";

import ProfileMetadataPropertiesView from "d2/dialogs/new.file/profile.metadata.properties.view";

class CreateRelationPropertiesView extends ProfileMetadataPropertiesView {
  constructor(options = {}) {
    super(options);
    this.trackRelationTypeChange();
  }
  trackRelationTypeChange() {
    let selectedRelationModel = this.parent.options.shareableOptions.selectedRelationModel;
    this.listenTo(selectedRelationModel, "change", () => {
      this._updatePropertiesSource();
      this._updatePropertiesSourceUrl(this.options.node);
      this.refreshForms();
    });
  }
  _updatePropertiesSourceUrl(nodeModel) {
    let url = RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.D2_RELATION_PROPERTY_PAGE);
    let urlParams = {
      relation: this.parent.options.shareableOptions.selectedRelationModel.get("relationName"),
      type: this.parent.options.shareableOptions.selectedRelationModel.get("relationType")
    };
    url = Url.appendQuery(url, Url.combineQueryString(urlParams));
    nodeModel.propertiesSource = {
      url: url
    };
  }
  _initProfileMetadataProperties(nodeModel) {
    this._updatePropertiesSourceUrl(nodeModel);
  }
  _updatePropertiesSource() {
    if (this.options.node) {
      this.propertiesSourceUpdated = false;
      this.options.node.propertiesForceFetch = true;
    }
  }
}

Object.defineProperty(CreateRelationPropertiesView.prototype.constructor, "name", {
  value: "CreateRelationPropertiesView"
});

export default CreateRelationPropertiesView;