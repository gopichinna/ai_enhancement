/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/backbone", "csui/lib/marionette", "smart/themes/theming", "csui/themes/csui.jato.mime.illustrations", "i18n!csui/perspective.manage/widgets/perspective.placeholder/impl/nls/lang", "hbs!csui/perspective.manage/widgets/perspective.placeholder/impl/perspective.placeholder", "css!csui/perspective.manage/widgets/perspective.placeholder/impl/perspective.placeholder" ], function(_, Backbone, Marionette, theming, jatoMimeIllustrations, lang, template) {
  var PerspectivePlaceholderView = Marionette.ItemView.extend({
    className: "csui-perspective-placeholder",
    template: template,
    templateHelpers: function() {
      return {
        isJATO: theming.isJATOTheme(),
        dndWidgetsHere: this.options.widgetContainer && this.options.widgetContainer.options.grid.allowHTMLTilesOnly ? lang.dndHTMLWidgetsHere : lang.dndWidgetsHere,
        dndPlaceholderSVG: jatoMimeIllustrations.illustrationsDragDropSmall
      };
    },
    constructor: function(options) {
      Marionette.ItemView.apply(this, arguments);
    },
    onShow: function() {
      this.$el.parent().addClass("csui-pman-placeholder-container");
    },
    onDestroy: function() {
      this.$el.parent().removeClass("csui-pman-placeholder-container");
    }
  });
  return PerspectivePlaceholderView;
});