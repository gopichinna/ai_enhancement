/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "csui/controls/toolbar/toolbar.view" ], function(require, _) {
  require([ "csui/controls/toolbar/toolitems.view" ], function(ToolitemsView) {
    const origChildViewOptions = ToolitemsView.prototype.childViewOptions;
    ToolitemsView.prototype.childViewOptions = function(model) {
      const childOptions = origChildViewOptions.call(this, model);
      _.defaults(childOptions, _.pick(this.options, [ "renderIconAndText" ]));
      return childOptions;
    };
  });
});