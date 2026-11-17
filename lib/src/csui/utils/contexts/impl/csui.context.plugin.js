/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/utils/contexts/context.plugin", "csui/models/view.state.model" ], function(ContextPlugin, ViewStateModel) {
  "use strict";
  var CsuiContextPlugin = ContextPlugin.extend({
    constructor: function CsuiContextPlugin(options) {
      ContextPlugin.call(this, options);
      var context = this.context;
      context.viewStateModel = new ViewStateModel();
      context.listenTo(context, "request", propagateRequestEventToViewState.bind(this)).listenTo(context, "destroy", clearViewState.bind(this));
    }
  });
  function propagateRequestEventToViewState() {
    this.context.viewStateModel.onContextFetch();
  }
  function clearViewState() {
    this.context.viewStateModel.clear();
  }
  return CsuiContextPlugin;
});