/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "d2/integration/dialog/impl/embed.dialog.view" ], function(_, Backbone, Marionette, EmbedDialogView) {
  "use strict";
  function EmbedDialogWidget(options) {
    this.options = options || (options = {});
    this.options.dialogWidget = this;
    this.embedDialogView = new EmbedDialogView(options);
  }
  var originalListenTo = Backbone.Events.listenTo;
  _.extend(EmbedDialogWidget.prototype, Backbone.Events, {
    constructor: EmbedDialogWidget,
    show: display,
    display: display,
    destroy: destroy,
    close: destroy,
    listenTo: function(other, event, callback) {
      return typeof other === "string" ? originalListenTo.call(this, this, other, event) : originalListenTo.call(this, other, event, callback);
    }
  });
  function display(options) {
    var self = this;
    options || (options = {});
    _.extend(options, this.options);
    this.region = new Marionette.Region({
      el: options.placeholder
    });
    self.region.show(self.embedDialogView);
    return this;
  }
  function destroy() {
    if (this.region) {
      this.embedDialogView.destroy();
      this.region.destroy();
      this.region = null;
    }
    return this;
  }
  EmbedDialogWidget.version = "1.0";
  return EmbedDialogWidget;
});