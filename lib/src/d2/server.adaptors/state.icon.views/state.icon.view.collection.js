/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "csui-ext!d2/server.adaptors/state.icon.views/state.icon.view.collection" ], function(_, Backbone, extraStateIconViewUtils) {
  "use strict";
  const StateIconViewModel = Backbone.Model.extend({
    defaults: {
      clientKey: null,
      serverKey: null,
      utility: null
    },
    constructor: function StateIconViewModel() {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    }
  });
  const StateIconViewCollection = Backbone.Collection.extend({
    model: StateIconViewModel,
    constructor: function StateIconViewCollection() {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    }
  });
  const nodeStateIconsUtils = new StateIconViewCollection([]);
  addExtensions(extraStateIconViewUtils);
  function addExtensions(extensions) {
    if (extensions) {
      nodeStateIconsUtils.add(_.flatten(extensions, true), {
        silent: true
      });
    }
  }
  return nodeStateIconsUtils;
});