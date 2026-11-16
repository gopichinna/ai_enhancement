/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/backbone", "csui/controls/error/error.view" ], function(_, Backbone, ErrorControlView) {
  "use strict";
  var ErrorWidgetView = ErrorControlView.extend({
    className: function() {
      var cvclass = ErrorControlView.prototype.className;
      if (_.isFunction(cvclass)) {
        cvclass = cvclass.call(this);
      }
      return "csui-error-widget " + cvclass;
    },
    constructor: function ErrorWidgetView(options) {
      options || (options = {});
      options.data || (options.data = {});
      if (!options.model) {
        options.model = new Backbone.Model({
          message: options.data.message,
          suggestion: options.data.suggestion
        });
      }
      ErrorControlView.prototype.constructor.call(this, options);
    }
  });
  return ErrorWidgetView;
});