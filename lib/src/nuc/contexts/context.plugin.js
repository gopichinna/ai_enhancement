/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['nuc/lib/underscore', 'nuc/lib/backbone'], function (_, Backbone) {
  'use strict';

  function ContextPlugin(options) {
    this.cid = _.uniqueId('contextPlugin');
    this.context = options.context;
  }

  _.extend(ContextPlugin.prototype, Backbone.Events, {
    // Called when a factory is questioned if it is fetchable; it will be
    // considered fetchable, unless this method returns false
    isFetchable: function (_factory) {}
  });

  ContextPlugin.extend = Backbone.Model.extend;

  return ContextPlugin;
});
