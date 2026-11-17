/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "csui/utils/commands", "dctmw/utils/utils", "d2/integration/impl/embedder.utils", "i18n!d2/integration/commands/impl/nls/lang", "css!d2/integration/commands/impl/embedd.command.dialog" ], function($, _, commands, utils, embedderUtils, lang) {
  "use strict";
  var EmbedCommandDialogWidget = function(options) {
    if (!options || !options.context || !options.connector || !options.adapterClass) {
      throw new Error("context, connector, adapter class are mandatory in the constructor options");
    }
    this.options = options;
    $(".binf-widgets.d2-embed").addClass("only-dialog");
  };
  _.extend(EmbedCommandDialogWidget.prototype, {
    execute: function(params) {
      var dfd = $.Deferred();
      var adapter = new this.options.adapterClass({
        context: this.options.context,
        connector: this.options.connector,
        params: params
      });
      if (params.hideDialogClose === "true") {
        $(".binf-widgets.d2-embed").addClass("hide-dialog-close");
      }
      if (params.responsiveDialog === "true") {
        $(".binf-widgets.d2-embed").addClass("d2-responsive-dialog");
      }
      adapter.preProcess().done(function(preprocessData) {
        var command = commands.get(preprocessData.signature);
        if (!command) {
          dfd.reject(_.str.sformat(lang.commandNotFound, preprocessData.signature));
          return;
        }
        if (!preprocessData.ignoreEnabledCheck && !command.enabled(preprocessData.status, preprocessData.options)) {
          dfd.reject(_.str.sformat(lang.commandNotEnabled, preprocessData.signature));
          return;
        }
        command.execute(preprocessData.status, preprocessData.options).done(adapter.postProcess.bind(adapter, true)).fail(adapter.postProcess.bind(adapter, false));
        dfd.resolve();
      }).fail(function(error) {
        var msg = error;
        if (error.responseText) {
          msg = utils.parseAjaxErrorAsString(error);
        }
        dfd.reject(msg);
      });
      return dfd.promise();
    }
  });
  return EmbedCommandDialogWidget;
});