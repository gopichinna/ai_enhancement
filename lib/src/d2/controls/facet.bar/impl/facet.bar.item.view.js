/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "hbs!d2/controls/facet.bar/impl/facet.bar.item" ], function(module, $, _, Marionette, template) {
  var FacetBarItemView = Marionette.ItemView.extend({
    className: "d2-facet-item",
    tagName: "li",
    template: template,
    ui: {
      item: ".d2-facet-item",
      content: ".d2-facet-item-content"
    },
    events: {
      "click @ui.item": "cancelClick",
      "click @ui.content": "cancelClick"
    },
    constructor: function FacetBarItemView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    cancelClick: function(event) {
      if (!$(event.target).hasClass("d2-icon-chiclet-close")) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
  });
  return FacetBarItemView;
});