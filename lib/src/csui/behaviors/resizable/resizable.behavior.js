/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/marionette", "module", "i18n", "css!csui/behaviors/resizable/resizable" ], function(Marionette, module, i18n) {
  let config = module.config();
  config = {
    ...config,
    ...config?.csui
  };
  var ResizableBehavior = Marionette.Behavior.extend({
    constructor: function ResizableBehavior(options = {}, view) {
      if (!config.enablePanelResize) return;
      this.listenTo(view, {
        dynamicDomLoaded: this.initializeResizeBehaviour
      });
      this.options = options;
    },
    initializeResizeBehaviour: function(element, view) {
      const parent = element.parent();
      parent[0]?.classList.add("csui-resizable");
      element.resizable({
        minWidth: this.options?.minWidth ? Math.max(this.options.minWidth, 240) : 248,
        maxWidth: "50%",
        handles: i18n.settings.rtl ? "w" : "e",
        start: function() {
          element[0]?.classList.add("csui-no-transition");
        },
        stop: function() {
          element[0]?.classList.remove("csui-no-transition");
          view.triggerMethod("dom:refresh");
        }
      });
    }
  });
  ResizableBehavior.config = config;
  return ResizableBehavior;
});