/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "hbs!smart/controls/tab.panel/impl/tab.contents.header", "smart/utils/smart.base", "css!smart/controls/tab.panel/impl/tab.contents.header" ], function(_, $, Backbone, Marionette, tabContentsHeaderTemplate, SmartBase) {
  "use strict";
  var TabContentsHeaderView = Marionette.ItemView.extend({
    tagName: "div",
    className: "smart-tab-contents-header",
    template: tabContentsHeaderTemplate,
    ui: {
      tabContentsHeaderTitle: ".smart-tab-contents-header-content h4",
      rightTabContentsHeader: ".smart-tab-contents-header-right"
    },
    templateHelpers: function() {
      let userLanguage = SmartBase.getUserMetadataLanguageInfo();
      let title = this.options?.collection?.models[0]?.attributes?.title;
      let obj = {
        tabName: title[userLanguage] || title
      };
      return obj;
    },
    constructor: function TabContentsHeaderView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.listenTo(Backbone, "change:activetab:title", this._updateStickyHeader);
    },
    onRender: function() {
      let self = this;
      let resolvePromise;
      const getContentHeaderRightViewPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      this.options?.tabPanel?.trigger("render:content:header:right:view", this, resolvePromise);
      getContentHeaderRightViewPromise.then(() => {
        if (self.el?.querySelector(".smart-tab-contents-header-right")) {
          self?.contentHeaderRequiredFieldView?.render();
          self?.contentHeaderRequiredFieldView?.$el.appendTo(self?.ui?.rightTabContentsHeader);
        }
      });
    },
    _updateStickyHeader: function(title) {
      this.$(this.ui.tabContentsHeaderTitle).html(title);
    },
    currentlyFocusedElement: function(event) {
      if (this?.contentHeaderRequiredFieldView?.$el) {
        return this?.contentHeaderRequiredFieldView?.currentlyFocusedElement(event);
      } else {
        return undefined;
      }
    }
  });
  return TabContentsHeaderView;
});