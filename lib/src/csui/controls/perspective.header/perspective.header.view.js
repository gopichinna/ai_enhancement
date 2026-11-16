/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/marionette", "hbs!csui/controls/perspective.header/impl/perspective.header", "i18n!csui/controls/perspective.header/impl/nls/lang", "css!csui/controls/perspective.header/impl/perspective.header" ], function(_, $, Marionette, headerTemplate, lang) {
  var PerspectiveHeaderView = Marionette.ItemView.extend({
    className: "csui-perspective-toolbar-container",
    template: headerTemplate,
    ui: {
      headerControl: ".cs-header-control"
    },
    events: {
      "keydown .cs-back-button-container": "onKeyInView",
      "click .cs-back-button-container": "onBackButton"
    },
    templateHelpers: function() {
      return {
        icon: this.options.icon,
        title: this.options.title,
        backTitle: lang.backTitle
      };
    },
    constructor: function DialogHeaderView(options) {
      Marionette.View.prototype.constructor.apply(this, arguments);
    },
    onKeyInView: function(event) {
      if (event.keyCode === 32 || event.keyCode === 13) {
        this.onBackButton();
      }
    },
    onBackButton: function() {
      var context = this.options.context, viewStateModel = context && context.viewStateModel;
      if (viewStateModel) {
        viewStateModel.restoreLastRouter();
      }
    }
  });
  return PerspectiveHeaderView;
});