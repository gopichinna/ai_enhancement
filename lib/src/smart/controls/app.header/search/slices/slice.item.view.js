/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "nuc/lib/backbone", "hbs!smart/controls/app.header/search/slices/impl/slice.item", "i18n!smart/controls/app.header/search/impl/nls/lang" ], function(module, _, $, Marionette, Backbone, itemTemplate, lang) {
  let sliceItemView = Marionette.ItemView.extend({
    tagName: function() {
      return "otc-menuradio";
    },
    template: itemTemplate,
    attributes: function() {
      let attr = {
        sliceId: this.options?.id || this?.model?.attributes?.id,
        title: _.str.sformat(lang.sliceItemTitle, this.options?.label || this?.model?.attributes?.label),
        arialabel: this.options?.label || this?.model?.attributes?.label
      }, isChecked = this?.options?.leadingView?.otcData?.selectedSlice === this.model.get("id");
      if (isChecked) {
        attr = {
          ...attr,
          checked: ""
        };
      }
      return attr;
    },
    templateHelpers: function() {
      let itemTxt = this?.model?.attributes?.label || "";
      return {
        itemTxt: itemTxt
      };
    },
    constructor: function sliceItemView(options = {}) {
      Marionette.View.prototype.constructor.apply(this, arguments);
      this.el.addEventListener("change", event => {
        this._markItem(event);
      });
    },
    _markItem: function(event) {
      let selectedSlice = this.el?.hasAttribute("checked") ? this.model.get("id") : "";
      this.options.leadingView.otcData.selectedSlice = selectedSlice;
      this.options?.leadingView.trigger("slice:click", event);
    }
  });
  return sliceItemView;
});