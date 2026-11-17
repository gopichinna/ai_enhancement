/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "smart/utils/smart.base", "hbs!smart/controls/inline.panel/resizer/impl/inline.panel.resizer", "css!smart/controls/inline.panel/resizer/impl/inline.panel.resizer" ], function(_, $, Marionette, smartBase, template) {
  "use strict";
  var InlinePanelResizerView = Marionette.ItemView.extend({
    template: template,
    className: "smart-inlinepanel-resizer",
    events: {},
    onRender: function() {},
    constructor: function InlinePanelResizerView(options = {}) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    }
  });
  return InlinePanelResizerView;
});