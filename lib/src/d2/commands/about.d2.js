/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "csui/models/command", "csui/utils/contexts/factories/connector", "csui/utils/commandhelper", "dctmw/utils/rest.resources", "i18n!d2/commands/nls/localized.strings" ], function(require, $, _, CommandModel, ConnectorFactory, CommandHelper, RestResources, lang) {
  "use strict";
  return CommandModel.extend({
    defaults: {
      signature: "D2-About",
      name: lang.CommandNameAbout,
      scope: "single"
    },
    execute: function(status) {
      var me = this, deferred = $.Deferred(), connector = status.context.getObject(ConnectorFactory), fail = function() {
        $("div.load-container.csui-global").addClass("binf-hidden");
        deferred.reject.apply(deferred, arguments);
      };
      $("div.load-container.csui-global").removeClass("binf-hidden");
      me._loadAboutData({
        url: CommandHelper.getOriginalActionLink({
          actions: RestResources.getCurrentUser().get("MenuActions")
        }, me.get("signature")),
        connector: connector
      }).done(function(data) {
        require([ "d2/dialogs/about.d2/about.d2.dialog.view" ], function(AboutD2DialogView) {
          me.dialog = new AboutD2DialogView({
            data: data
          });
          me.dialog.on("render", function() {
            $("div.load-container.csui-global").addClass("binf-hidden");
          }).on("wizard:closed", function() {
            deferred.resolve();
          });
          me.dialog.show();
        }, fail);
      }).fail(fail);
      return deferred.promise();
    },
    _loadAboutData: function(options) {
      var deferred = $.Deferred();
      $.ajax(options.connector.extendAjaxOptions({
        url: options.url,
        success: function(response) {
          var output = {};
          if (response && response.content) {
            _.each(response.content, function(item) {
              output[item.id] = _.pick(item, [ "label", "value" ]);
            });
          }
          deferred.resolve(output);
        },
        error: function(xhr, status, error) {
          deferred.reject(xhr, status, error);
        }
      }));
      return deferred.promise();
    }
  });
});