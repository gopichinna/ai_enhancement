/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "i18n", "i18n!csui/perspective.manage/impl/nls/lang", "csui-ext!perspective.manage/impl/perspectivelayouts" ], function(module, _, i18n, Lang, extraPerspectiveLayouts) {
  var config = _.extend({
    enableNewlayoutOption: false
  }, module.config());
  const isRtl = i18n?.settings.rtl;
  var perspectivelayouts = [ {
    title: Lang.LcrLayoutTitle,
    type: "left-center-right",
    icon: "csui-layout-lcr"
  }, {
    title: Lang.FlowLayoutTitle,
    type: "flow",
    icon: "csui-layout-flow"
  } ];
  if (config.enableNewlayoutOption) {
    perspectivelayouts.push({
      title: Lang.RSPLayoutTitle,
      type: "sidepanel-right",
      icon: isRtl ? "csui-layout-sidepanel-left" : "csui-layout-sidepanel-right"
    }, {
      title: Lang.LSPLayoutTitle,
      type: "sidepanel-left",
      icon: isRtl ? "csui-layout-sidepanel-right" : "csui-layout-sidepanel-left"
    });
  }
  if (extraPerspectiveLayouts) {
    perspectivelayouts = _.union(perspectivelayouts, extraPerspectiveLayouts);
  }
  return perspectivelayouts;
});