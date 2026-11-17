/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/marionette", "smart/themes/theming", "csui/themes/csui.jato.action.icons", "hbs!csui/controls/perspective.header/impl/perspective.header", "i18n!csui/controls/perspective.header/impl/nls/lang", "css!csui/controls/perspective.header/impl/perspective.header" ], function(_, $, Marionette, theming, jatoActionIcons, headerTemplate, lang) {
  var PerspectiveHeaderView = Marionette.ItemView.extend({
    className: "csui-perspective-toolbar-container",
    template: headerTemplate,
    ui: {
      headerControl: ".cs-header-control",
      backButton: ".cs-back-button"
    },
    events: {
      "keydown @ui.backButton": "onKeyInView",
      "click @ui.backButton": "onBackButton"
    },
    templateHelpers: function() {
      const isJATO = theming.isJATOTheme(), jatoIcon = this.options.jatoIcon;
      return {
        isJATO: isJATO,
        jatoIcon: jatoIcon,
        jatoLeftIcon: jatoActionIcons.actionArrowLeft,
        canShowJatoIcon: isJATO && jatoIcon,
        icon: this.options.icon,
        title: this.options.title,
        backTitle: lang.backTitle
      };
    },
    constructor: function DialogHeaderView(options) {
      Marionette.View.prototype.constructor.apply(this, arguments);
      this.listenToOnce(this, "render", _.bind(function() {
        setTimeout(_.bind(function() {
          let expandedViewEle = this.$el.closest(".binf-col-xs-12.row-xs-full>div");
          expandedViewEle.addClass("csui-expanded-tile-view");
        }, this), 0);
      }, this));
    },
    onKeyInView: function(event) {
      if (event.keyCode === 32 || event.keyCode === 13) {
        this.__executeBackFunc(event);
      }
    },
    onBackButton: function(event) {
      this.__executeBackFunc(event);
    },
    __executeBackFunc: function(event) {
      event.preventDefault();
      var context = this.options.context, viewStateModel = context && context.viewStateModel;
      if (viewStateModel) {
        viewStateModel.restoreLastRouter();
      }
    }
  });
  return PerspectiveHeaderView;
});