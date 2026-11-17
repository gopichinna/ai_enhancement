/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/backbone", "nuc/lib/underscore", "csui/controls/thumbnail/content/select/select.view" ], function(Backbone, _, SelectView) {
  "use strict";
  var origClickHandler = SelectView.prototype._attachClickHandler;
  SelectView.prototype._attachClickHandler = function() {
    if (this.options.thumbnailView.options.selectionImpl !== "d2_templates") {
      origClickHandler.apply(this, arguments);
      return;
    }
    var self = this;
    var $cbEl = self.$el.find("otc-checkbox");
    var $labelEl = self.$el.find(".csui-selectlabel");
    $labelEl.on("click." + self.cid, function(event) {
      event.preventDefault();
      event.stopPropagation();
      if (self.options.thumbnailView && self.options.thumbnailView._isSelectCheckBoxBlocked) {
        return;
      }
      $cbEl.prop("checked", !$cbEl.prop("checked")).trigger("change");
      self.triggerMethod("clicked:checkbox", event);
    });
    $cbEl.on("change." + self.cid, function() {
      Backbone.trigger("closeToggleAction");
      var checked = $cbEl.prop("checked");
      if (checked) {
        var itemViews = _.values(self.options.thumbnailView.resultsView.children._views);
        var selectViews = [];
        _.each(itemViews, function(itemView) {
          selectViews.push(itemView.selectContentView);
        });
        _.each(selectViews, function(sv) {
          var $newEl = sv.$el.find("otc-checkbox");
          if (sv.cid !== self.cid && $newEl.prop("checked")) {
            $newEl.prop("checked", false).trigger("change");
            sv.$el.attr("aria-checked", false);
          }
        });
      }
      self.triggerMethod("clicked:checkbox", {
        view: self,
        checked: checked
      });
    });
  };
});