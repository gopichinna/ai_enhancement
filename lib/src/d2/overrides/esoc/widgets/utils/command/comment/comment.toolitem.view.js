/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "esoc/widgets/utils/command/comment/comment.toolitem.view" ], function(_, CommentToolitemView) {
  "use strict";
  var origOnBeforeRender = CommentToolitemView.prototype.onBeforeRender;
  CommentToolitemView.prototype.onBeforeRender = function() {
    this.stopListening(this.nodeModel, "change comment:icon:view");
    this.listenTo(this.nodeModel, "change comment:icon:view", function() {
      if (!this.isDestroyed) {
        this.render();
      }
    }.bind(this));
    _.isFunction(origOnBeforeRender) && origOnBeforeRender.apply(this, arguments);
  };
});