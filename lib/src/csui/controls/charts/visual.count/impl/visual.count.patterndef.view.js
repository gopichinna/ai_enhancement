/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/marionette3", "hbs!csui/controls/charts/visual.count/impl/visual.count.patterndef" ], function(Marionette, template) {
  "use strict";
  var VisualCountPatterndefView = Marionette.View.extend({
    className: "csui-visual-count-patterndef-container",
    template: template,
    constructor: function VisualCountPatterndefView(options) {
      this.viewId = options.viewId;
      Marionette.View.prototype.constructor.apply(this, arguments);
    },
    templateContext: function(options) {
      return {
        viewId: this.viewId
      };
    }
  });
  return VisualCountPatterndefView;
});