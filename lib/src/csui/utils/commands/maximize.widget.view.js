/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "csui/lib/jquery", "csui/utils/base", "csui/lib/underscore", "i18n!csui/utils/commands/nls/localized.strings", "csui/utils/commandhelper", "csui/models/command" ], function(require, $, base, _, lang, CommandHelper, CommandModel) {
  "use strict";
  var ExpandNodestableViewCommand = CommandModel.extend({
    defaults: {
      signature: "MaximizeWidgetView",
      scope: "single"
    },
    enabled: function(status, options) {
      var supportMaximizeWidget = $("body").hasClass("csui-support-maximize-widget");
      return supportMaximizeWidget && $("body").hasClass("csui-maximized-widget-mode") === false;
    },
    execute: function(status, options) {
      status.context.trigger("maximize:widget", {
        widgetView: status.originatingView
      });
    }
  });
  return ExpandNodestableViewCommand;
});