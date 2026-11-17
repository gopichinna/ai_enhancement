/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "csui/models/command", "csui/utils/contexts/factories/application.scope.factory", "i18n!d2/commands/nls/localized.strings" ], function(require, _, $, CommandModel, ApplicationScopeModelFactory, lang) {
  "use strict";
  var SplitCommand = CommandModel.extend({
    defaults: {
      signature: "D2-split-view",
      name: lang.CommandNameSplit,
      scope: "single"
    },
    execute: function(status) {
      const targetEl = status.toolItemView.el;
      const d2CollectionsWrapper = status.originatingView.$el.find(".d2-collections-list-wrapper");
      if (d2CollectionsWrapper.hasClass("d2-collections-wrapper-hidden")) {
        d2CollectionsWrapper.removeClass("d2-collections-wrapper-hidden");
        $(targetEl).find("span").removeClass("left_panel_close");
        $(targetEl).find("span").addClass("left_panel_open");
      } else {
        d2CollectionsWrapper.addClass("d2-collections-wrapper-hidden");
        $(targetEl).find("span").addClass("left_panel_close");
        $(targetEl).find("span").removeClass("left_panel_open");
      }
      status.originatingView.triggerMethod("dom:refresh");
      return $.Deferred().resolve().promise();
    }
  });
  return SplitCommand;
});