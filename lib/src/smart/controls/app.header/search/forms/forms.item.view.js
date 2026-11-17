/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "smart/themes/theming", "smart/themes/jato.icons/smart.jato.mime", "i18n!smart/controls/app.header/search/impl/nls/lang", "hbs!smart/controls/app.header/search/forms/impl/formItem", "css!smart/controls/app.header/search/forms/impl/form.item", "smart/themes/carbonfiber/ot-icons/icons_smart_mime" ], function(module, _, $, Marionette, theming, SmartJatoMimeIcons, lang, itemTemplate) {
  let FormItemView = Marionette.ItemView.extend({
    tagName: function() {
      return "otc-menuitem";
    },
    template: itemTemplate,
    attributes: function() {
      let arialabel = this.options?.arialabel || this?.model?.attributes?.options?.arialabel;
      let attr = {
        formId: this.options?.id || this?.model?.attributes?.options?.id,
        title: _.str.sformat(lang.formItemTitle, this.options?.label || this?.model?.attributes?.options?.label),
        arialabel: arialabel || this.options?.label || this?.model?.attributes?.options?.label
      };
      return attr;
    },
    templateHelpers: function() {
      const itemTxt = this.model.attributes.options.label || "";
      const isJATO = theming.isJATOTheme();
      return {
        icon: this.options?.icon || this?.model?.attributes?.options?.icon || "smart_mime:mime_query_form_search32",
        jatoIcon: this.options?.jatoIcon || this?.model?.attributes?.options?.jatoIcon || SmartJatoMimeIcons.mimeSearchQueryForm,
        isJATO: isJATO,
        itemTxt: itemTxt
      };
    },
    constructor: function FormItemView(options = {}) {
      Marionette.View.prototype.constructor.apply(this, arguments);
      this.el.addEventListener("item-click", event => {
        if (this?.model?.attributes?.options?.savedSearches || this?.options?.savedSearches) {
          this.options?.leadingView.trigger("saved:form:item:click", event);
        } else {
          this.options?.leadingView.trigger("form:item:click", event);
        }
      });
      this.el.addEventListener("item-remove", event => {
        this.options?.leadingView.trigger("form:item:remove", event);
      });
      if (this?.options?.deletable || this?.model?.attributes?.options?.deletable) {
        this.el.setAttribute("isDeletable", "true");
        this.el.setAttribute("deletableicontitle", lang.deletableiconTitle);
      }
    }
  });
  return FormItemView;
});