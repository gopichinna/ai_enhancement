/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "i18n", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "d2/controls/form/fields/listfieldview/d2listfieldselectionitem.view", "hbs!d2/controls/form/impl/d2nodepicker/d2nodepickerselection" ], function(_, $, Backbone, Marionette, i18n, PerfectScrollingBehavior, ListFieldSelectedItemView, SelectionViewTemplate) {
  "use strict";
  var SelectionItemView = ListFieldSelectedItemView.extend({
    constructor: function() {
      ListFieldSelectedItemView.prototype.constructor.apply(this, arguments);
      this.ui = _.extend(this.ui || {}, {
        optionLink: "> a"
      });
    },
    removeSelectedOptions: function(event) {
      event.stopPropagation();
      event.preventDefault();
      if (!this.model.collection.disabled) {
        this.options.parentView.collection.remove(this.model);
      }
    },
    onRender: function() {
      ListFieldSelectedItemView.prototype.onRender.apply(this, arguments);
      if (this.model.has("pathNames")) {
        var pathNames = this.model.get("pathNames");
        this.ui.optionLink.attr("title", pathNames);
      }
    }
  });
  return Marionette.CompositeView.extend({
    childView: SelectionItemView,
    childViewContainer: ".d2-nodes-selectedvalues",
    className: "d2-nodes-selction-wrapper",
    template: SelectionViewTemplate,
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: "> .d2-nodes-selectedvalues",
        suppressScrollX: true
      }
    },
    childViewOptions: function() {
      return {
        mode: this.options.mode,
        parentView: this
      };
    },
    constructor: function() {
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
    }
  });
});