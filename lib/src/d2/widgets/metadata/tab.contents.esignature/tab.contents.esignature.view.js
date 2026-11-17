/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "d2/widgets/metadata/general.panels/d2/d2.general.form.view", "csui/controls/tab.panel/behaviors/tab.contents.keyboard.behavior", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "hbs!d2/widgets/metadata/tab.contents.esignature/tab.contents.esignature", "i18n!d2/widgets/metadata/impl/nls/lang", "css!d2/widgets/metadata/tab.contents.esignature/tab.contents.esignature" ], function($, _, Backbone, Marionette, formView, TabContentKeyboardBehavior, PerfectScrollingBehavior, eSignTemplate, lang) {
  "use strict";
  var TabContentsESignatureView = Marionette.ItemView.extend({
    className: "d2-tab-content-esignature",
    template: eSignTemplate,
    ui: {
      message: ".d2-tab-contents-esignature-message-wrapper",
      expandButton: ".d2-tab-contents-esignature-expand"
    },
    events: {
      "click @ui.expandButton": "onClickExpandCollapse"
    },
    templateHelpers: function() {
      return {
        eSignLabel: lang.eSignLabel,
        eSignMessage: this.options.eSignMessage || lang.eSignMessage,
        showExpand: this.options.showExpandESign,
        setEsignRequired: this.options.setEsignRequired
      };
    },
    behaviors: {
      TabContentKeyboardBehavior: {
        behaviorClass: TabContentKeyboardBehavior
      }
    },
    constructor: function TabContentsESignatureView(options) {
      Marionette.ItemView.prototype.constructor.call(this, options);
      this.options.showExpandESign && $("*").on("scroll", this.onScroll.bind(this));
    },
    render: function() {
      Marionette.ItemView.prototype.render.call(this, this.options);
      if (this.options.showSignatureFormPanel || this.options.showExpandESign) {
        this.showSignaturePanel();
      }
    },
    onScroll: function() {
      this.ui.expandButton.hasClass("collapse") && this.onClickExpandCollapse($.Event());
    },
    showSignaturePanel: function() {
      this.ui.message.addClass("binf-hidden");
      this.ui.expandButton.toggleClass("expand").toggleClass("collapse");
      var options = {
        node: this.options.node,
        model: this.options.signOffFormModel,
        mode: "create"
      };
      this.signFormView = new formView(options);
      this.signFormView.initializeExpressions();
      this.signRegion = new Marionette.Region({
        el: this.$el.find(".d2-tab-contents-esignature-content-form")
      });
      this.signFormView.on("relayout:form", function() {
        this.resetHeight();
      }, this);
      this.signFormView.on("d2:change:formValidation", function() {
        this.resetHeight();
      }, this);
      this.signRegion.show(this.signFormView);
    },
    resetHeight: function() {
      this.signRegion.$el.height(this.signFormView.$el.outerHeight());
      this.triggerMethod("eSign:form:ready", this);
      this.triggerMethod("refresh:tabable:elements", this);
    },
    onClickExpandCollapse: function(event) {
      event.stopPropagation();
      event.preventDefault();
      this.ui.expandButton.toggleClass("expand").toggleClass("collapse");
      this.ui.message.toggleClass("binf-hidden");
      this.signRegion.$el.toggleClass("binf-hidden");
      this.resetHeight();
    }
  });
  return TabContentsESignatureView;
});