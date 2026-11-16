/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/marionette", "nuc/contexts/context", "csui/models/view.state.model" ], function(_, Marionette, Context, ViewStateModel) {
  "use strict";
  var ApplicationContext = Context.extend({
    constructor: function ApplicationContext(options) {
      options = options || {};
      this.viewStateModel = new ViewStateModel();
      ApplicationContext.__super__.constructor.call(this, options);
    },
    initialize: function() {
      this.listenTo(this, "request", function() {
        this.viewStateModel && this.viewStateModel.onContextFetch();
      });
    }
  });
  return ApplicationContext;
});