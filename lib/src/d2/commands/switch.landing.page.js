/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/contexts/factories/connector", "csui/models/command", "dctmw/utils/authenticators/session", "dctmw/utils/client.location", "i18n!d2/commands/nls/localized.strings", "d2/utils/landingpage/landingpage.preference.store" ], function(_, $, ConnectorFactory, CommandModel, Session, clientLocation, lang, landingPreferenceStore) {
  "use strict";
  const SwitchLandingPage = CommandModel.extend({
    defaults: {
      signature: "D2-SwitchLandingPage",
      command_key: "D2-SwitchLandingPage",
      name: lang.CommandNameSwitchLandingPage
    },
    enabled: function(status) {
      const lpName = status.data.svLandingConfigName;
      const storedLPName = landingPreferenceStore.getPreferredLPName();
      return storedLPName && lpName && lpName !== storedLPName;
    },
    execute: function(status) {
      const dfd = $.Deferred();
      const lpName = status.data.svLandingConfigName;
      landingPreferenceStore.savePreferredLPName(lpName).done(() => {
        const connector = Session.get().getContext().getObject(ConnectorFactory);
        clientLocation.navigate(connector.authenticator.getAppPageUrl(), {
          trigger: false,
          replace: true
        });
        clientLocation.reload();
        dfd.resolve();
      }).fail(dfd.reject);
      return dfd.promise();
    }
  });
  return SwitchLandingPage;
});