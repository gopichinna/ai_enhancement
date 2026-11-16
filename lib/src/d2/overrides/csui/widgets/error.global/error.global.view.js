/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/marionette", "nuc/lib/underscore", "csui/widgets/error.global/error.global.view", "d2/commands/go.back" ], function(Marionette, _, ErrorGlobalView, GoBack) {
  "use strict";
  var proto = ErrorGlobalView.prototype;
  _.extend(proto, {
    onClickBack: function() {
      event.preventDefault();
      event.stopPropagation();
      var goBack = new GoBack();
      goBack.execute({
        context: this.options.context,
        restoreLastFragment: false
      });
    }
  });
});