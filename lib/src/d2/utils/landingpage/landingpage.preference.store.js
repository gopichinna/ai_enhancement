/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import $ from "nuc/lib/jquery";

import Backbone from "nuc/lib/backbone";

import ConnectorFactory from "nuc/contexts/factories/connector";

import CurrentUserPreference from "dctmw/models/session/current.user.preference";

import Session from "dctmw/utils/authenticators/session";

import RestResources from "dctmw/utils/rest.resources";

const LP_PROPERTY_NAME = "sv_landing_page";

function getPreferenceModel() {
  const currentUser = RestResources.getCurrentUser();
  if (currentUser instanceof Backbone.Model) {
    const preferenceModel = currentUser.get("preferencesModel");
    if (preferenceModel instanceof CurrentUserPreference) {
      return preferenceModel;
    }
  }
  return new CurrentUserPreference(undefined, {
    connector: Session.get().getContext().getObject(ConnectorFactory)
  });
}

const lpPreferenceStore = {
  getPreferredLPName: () => {
    return getPreferenceModel().get(LP_PROPERTY_NAME);
  },
  savePreferredLPName: name => {
    const dfd = $.Deferred();
    const preferenceModel = getPreferenceModel();
    if (!name || name === preferenceModel.get(LP_PROPERTY_NAME)) {
      dfd.resolve();
    } else {
      preferenceModel.save(LP_PROPERTY_NAME, name).done(() => {
        dfd.resolve(name);
      }).fail(dfd.reject);
    }
    return dfd.promise();
  }
};

export default lpPreferenceStore;