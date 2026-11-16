/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/utils/url", "csui/models/command", "csui/utils/commandhelper", "csui/utils/contexts/factories/connector", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "d2/utils/constants", "d2/utils/widget.constants", "d2/dialogs/external.widget.dialog/external.widget.dialog.view", "i18n!d2/commands/nls/localized.strings" ], function(_, $, Url, CommandModel, CommandHelper, ConnectionFactory, RestResources, RestLinkrels, constants, widgetConstants, ExternalWidgetDialogView, lang) {
  "use strict";
  return CommandModel.extend({
    defaults: {
      signature: "D2-ShowExternal",
      command_key: "D2-ShowExternal",
      name: lang.CommandNameShowExternal
    },
    enabled: function() {
      return true;
    },
    execute: function(status) {
      const dfd = $.Deferred();
      this.fetchWidgetConfig(status).done(function(WidgetConfig) {
        this.loadExternalWidgetSidePanel(status, WidgetConfig);
        dfd.resolve();
      }.bind(this)).fail(dfd.reject);
      return dfd.promise();
    },
    loadExternalWidgetSidePanel: function(status, WidgetConfig) {
      this.externalWidgetDialogView = new ExternalWidgetDialogView({
        context: status.context,
        widgetConfig: WidgetConfig,
        nodes: status.nodes
      });
      this.externalWidgetDialogView.show();
    },
    fetchWidgetConfig: function(status) {
      var dfd = $.Deferred();
      const externalWidgetName = status.data.svExtenalWidgetName;
      if (!externalWidgetName) {
        return dfd.reject("Parameter svExtenalWidgetName is missing");
      } else {
        var url = this.urlWidgetConfigUrl(externalWidgetName);
        var connector = status.context.getObject(ConnectionFactory);
        $.ajax(connector.extendAjaxOptions({
          url: url,
          type: "GET",
          headers: {
            "Content-Type": constants.MediaTypes.DCTM_JSON
          },
          success: function(response) {
            dfd.resolve(response);
          },
          error: function() {
            dfd.reject();
          }
        }));
      }
      return dfd.promise();
    },
    urlWidgetConfigUrl: function(externalWidgetName) {
      var url = RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.D2_WIDGETS);
      url = Url.appendQuery(url, Url.combineQueryString({
        "widget-type": widgetConstants.D2.EXTERNAL,
        "widget-name": externalWidgetName,
        "include-widget-info": true,
        inline: true
      }));
      return url;
    }
  });
});