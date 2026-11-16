/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/underscore", "csui/lib/marionette", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "csui/utils/base", "hbs!csui/controls/selectall/impl/selectall", "i18n!csui/controls/selectall/impl/nls/lang", "css!csui/controls/selectall/impl/selectall" ], function($, _, Marionette, TabableRegionBehavior, base, template, lang) {
  "use strict";
  var selectAllView = Marionette.ItemView.extend({
    template: template,
    ui: {
      selectAll: ".csui-selectAll-input"
    },
    templateHelpers: function() {
      return {
        selectAllId: _.uniqueId("selectAll_"),
        selectAllTitle: this.options.ariaLabel || lang.selectAllAria
      };
    },
    events: {
      "click .csui-selectAll-input": "toggleCheckBoxSelection",
      "keypress .csui-selectAll-input": "toggleCheckBoxSelection"
    },
    behaviors: {
      TabableRegionBehavior: {
        behaviorClass: TabableRegionBehavior
      }
    },
    currentlyFocusedElement: function() {
      return $(this.ui.selectAll);
    },
    constructor: function(options) {
      options || (options = {});
      Marionette.View.prototype.constructor.apply(this, arguments);
    },
    toggleCheckBoxSelection: function(e) {
      if (e.keyCode === 32 || e.which === 32) {
        return false;
      }
      if (!base.isFirefox() && (e.keyCode === undefined || e.keyCode === 13) || base.isFirefox() && (e.keyCode === undefined || e.keyCode === 13)) {
        if (this.$el.find(".csui-selectAll-input:checked").length === 1) {
          this.options.collection.each(function(model, index) {
            model.attributes.isSelected = true;
          });
          this.options.view.$el.find(this.options._ele + ":not(:checked)").each(function(e) {
            $(this).prop("checked", true);
          });
          this.options.view.trigger("selectAll", {
            event: e
          });
        } else {
          this.options.collection.each(function(model, index) {
            model.attributes.isSelected = false;
          });
          this.options.view.$el.find(this.options._ele + ":checked").each(function(e) {
            $(this).prop("checked", false);
          });
        }
        this.options.view.trigger("unSelectAll", {
          event: e
        });
        if (e.which === 13 || e.which === 32) {
          this.options.view.$el.find(this.options._ele).each(function(e) {
            $(this).trigger("click");
          });
        }
      }
    },
    nodeChange: function() {
      var _selectAllEle = this.$el.find(".csui-checkbox-atleastone");
      if (_selectAllEle.length > 0) {
        $(_selectAllEle).removeClass("csui-checkbox-atleastone");
      }
      this.$el.find(".csui-selectAll-input").prop("checked", false);
      this.options.view.$el.find(this.options._ele + ":checked").each(function(e) {
        $(this).trigger("click");
      });
    }
  });
  return selectAllView;
});