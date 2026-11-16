/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "nuc/lib/backbone", "hbs!smart/controls/app.header/search/forms/impl/formItem", "i18n!smart/controls/app.header/search/impl/nls/lang", "smart/themes/carbonfiber/ot-icons/icons_smart_mime" ], function(module, _, $, Marionette, Backbone, itemTemplate, lang) {
  let FormItemView = Marionette.ItemView.extend({
    tagName: function() {
      return "otc-menuitem";
    },
    template: itemTemplate,
    attributes: function() {
      let attr = {
        icon: "smart_mime:mime_query_form_search32",
        formId: this.options?.id || this?.model?.attributes?.options?.id,
        title: _.str.sformat(lang.formItemTitle, this.options?.label || this?.model?.attributes?.options?.label),
        arialabel: this.options?.label || this?.model?.attributes?.options?.label
      };
      return attr;
    },
    templateHelpers: function() {
      let itemTxt = this.model.attributes.options.label || "";
      return {
        itemTxt: itemTxt
      };
    },
    constructor: function FormItemView(options = {}) {
      Marionette.View.prototype.constructor.apply(this, arguments);
      this.$el[0].addEventListener("click", event => {
        this.options?.leadingView.trigger("form:item:click", event);
      });
      this.$el[0].addEventListener("keydown", event => {
        if (event.keyCode === 13 || event.keyCode === 32) {
          this.options?.leadingView.trigger("form:item:click", event);
        }
      });
    }
  });
  return FormItemView;
});