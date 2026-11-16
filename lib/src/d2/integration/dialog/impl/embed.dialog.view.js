/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "hbs!d2/integration/dialog/impl/embed.dialog" ], function($, _, Backbone, Marionette, LayoutViewEventsPropagationMixin, template) {
  "use strict";
  var EmbedDialogView = Marionette.LayoutView.extend({
    className: "binf-widgets d2-embed-dialog-view",
    template: template,
    constructor: function EmbedDialogView(options) {
      options || (options = {});
      Marionette.LayoutView.prototype.constructor.call(this, options);
    },
    regions: {
      dialogContentRegion: ".d2-embed-dialog-content"
    },
    onDestroy: function() {
      this.contentView.destroy();
    },
    onRender: function() {
      this.contentView = new this.options.contentViewClass(this.options);
      this.dialogContentRegion.show(this.contentView);
    }
  });
  _.extend(EmbedDialogView.prototype, LayoutViewEventsPropagationMixin);
  return EmbedDialogView;
});