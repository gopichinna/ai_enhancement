/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/backbone", "csui/lib/marionette", "smart/themes/theming", "csui/themes/csui.jato.mime.illustrations", "i18n!csui/perspective.manage/widgets/perspective.widget/impl/nls/lang", "hbs!csui/perspective.manage/widgets/perspective.widget/impl/perspective.widget", "css!csui/perspective.manage/widgets/perspective.widget/impl/perspective.widget" ], function(_, Backbone, Marionette, theming, jatoMimeIllustrations, lang, template) {
  var PerspectiveWidgetView = Marionette.ItemView.extend({
    className: "csui-pman-widget",
    template: template,
    templateHelpers: function() {
      var wConfig = this.widget && this.widget.get("manifest"), wTitle = this.widget && this.widget.get("title"), noConfig = !wConfig || !wConfig.schema || !wConfig.schema.properties || _.isEmpty(wConfig.schema.properties);
      return {
        widgetTitle: wTitle || lang.noTitle,
        widgetMessage: noConfig ? lang.noConfig : lang.clickToConfig,
        isJATO: theming.isJATOTheme(),
        configureWidgetPaceholderSVG: jatoMimeIllustrations.illustrationsConfigureWidgetSmall
      };
    },
    constructor: function(options) {
      options || (options = {});
      options = _.defaults(options, {
        data: {}
      });
      Marionette.ItemView.apply(this, arguments);
      this.widget = options.data.widget;
    }
  });
  return PerspectiveWidgetView;
});