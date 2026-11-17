/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import AboutInfoView from "dctmw/dialogs/about/impl/about.info.view";

import SystemInfoView from "dctmw/dialogs/about/impl/system.info.view";

import ClientInfoView from "dctmw/dialogs/about/impl/client.info.view";

import lang from "i18n!dctmw/dialogs/about/impl/nls/lang";

export default function getAboutTabs(options = {}) {
  const requiredTabs = [ {
    sequence: 1,
    title: lang.TabLabelAbout,
    name: lang.TabNameAbout,
    contentView: AboutInfoView
  }, {
    sequence: 99,
    title: lang.TabLabelSystemInformation,
    name: lang.TabNameSystemInformation,
    contentView: SystemInfoView
  } ];
  const optionalTabs = [ {
    sequence: 50,
    title: lang.TabLabelD2Information,
    name: lang.TabNameD2Information,
    contentView: ClientInfoView
  } ];
  let combinedTabs;
  if (options.disableOptionalTabs) {
    combinedTabs = requiredTabs;
  } else {
    combinedTabs = requiredTabs.concat(optionalTabs);
  }
  const userTabs = Array.isArray(options.tabs) ? options.tabs : [];
  let mergedTabs = combinedTabs.concat(userTabs);
  mergedTabs = _.sortBy(mergedTabs, "sequence");
  return mergedTabs;
}