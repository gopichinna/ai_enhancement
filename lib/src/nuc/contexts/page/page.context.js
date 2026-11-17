/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['nuc/lib/underscore', 'nuc/contexts/context', 'csui-ext!nuc/contexts/page/page.context'], function (
  _,
  Context,
  contextPlugins
) {
  'use strict';

  var PageContext = Context.extend({
    constructor: function PageContext() {
      Context.prototype.constructor.apply(this, arguments);

      // Keep the same order as in perspective context
      var Plugins = _.chain(contextPlugins).flatten(true).unique().reverse().value();
      this._plugins = _.map(
        Plugins,
        function (Plugin) {
          return new Plugin({ context: this });
        },
        this
      );
    },

    _isFetchable: function (factory) {
      return (
        Context.prototype._isFetchable.apply(this, arguments) &&
        _.all(this._plugins, function (plugin) {
          return plugin.isFetchable(factory) !== false;
        })
      );
    }
  });

  return PageContext;
});
