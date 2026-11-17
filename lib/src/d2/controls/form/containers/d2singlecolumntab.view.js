/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "hbs!d2/controls/form/impl/d2tab/singlecoltabcontainer" ], function(_, $, Backbone, Marionette, PerfectScrollingBehavior, template) {
  "use strict";
  var SingleColumnTabView = Marionette.ItemView.extend({
    constructor: function SingleColumnTabView(options) {
      Marionette.ItemView.apply(this, arguments);
      var originatingView = options.alpacaField.connector.config.formView.options.originatingView;
      originatingView && originatingView.on("step:before:inactive", function() {
        this.onBackButtonClick();
      }, this);
    },
    className: "d2-singlecolumn-tab-section",
    template: template,
    ui: {
      back_button: ".d2-singlecolumn-back",
      back_focus: ".d2-singlecolumn-back-focus"
    },
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: ".d2-singlecolumn-tab-content",
        suppressScrollX: true
      }
    },
    events: {
      "click @ui.back_button": "onBackButtonClick",
      "keydown @ui.back_focus": "accessibility"
    },
    templateHelpers: function() {
      return {
        title: this.options.alpacaField.options.containerLabel
      };
    },
    render: function() {
      Marionette.ItemView.prototype.render.call(this, this.options);
      this.options.containerEl.appendTo(this.$el.find(".d2-singlecolumn-tab-content"));
    },
    onBackButtonClick: function(event) {
      this.options.alpacaField.deactivate({
        animate: true
      });
      if (event) {
        event.stopPropagation();
      }
    },
    accessibility: function(event) {
      if (event.keyCode === $.ui.keyCode.ENTER) {
        this.onBackButtonClick(event);
      }
    }
  });
  return SingleColumnTabView;
});