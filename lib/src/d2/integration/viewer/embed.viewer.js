/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "d2/widgets/viewer.perspective/viewer.perspective.view" ], function($, _, Marionette, ViewerPerspectiveView) {
  "use strict";
  var EmbedViewer = function(options) {
    if (!options || !options.context) {
      throw new Error("context attribute is mandatory in the constructor options");
    }
    this.options = options;
    this.options.context.isEmbeddedSearch = false;
    this.options.context.isFolderBrowser = false;
  };
  _.extend(EmbedViewer.prototype, {
    execute: function(params) {
      var deferred = $.Deferred(), region = new Marionette.Region({
        el: this.options.el || $(".d2-embed-container")
      });
      this.view = this._createView(this.options, params);
      region.show(this.view);
      return deferred.resolve().promise();
    },
    _createView: function(options, params) {
      return new ViewerPerspectiveView(_.extend({}, options, {
        params: params,
        isEmbedViewer: true
      }));
    }
  });
  return EmbedViewer;
});