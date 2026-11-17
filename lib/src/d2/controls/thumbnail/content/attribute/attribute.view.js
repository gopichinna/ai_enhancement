/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/marionette", "csui/controls/thumbnail/content/content.registry", "csui/controls/thumbnail/content/name/name.view", "hbs!d2/controls/thumbnail/content/attribute/impl/attribute", "i18n!d2/controls/thumbnail/content/attribute/nls/lang", "css!d2/controls/thumbnail/content/attribute/impl/attribute" ], function(_, Marionette, ContentRegistry, NameView, template, lang) {
  "use strict";
  var D2TemplateAttributeView = Marionette.ItemView.extend({
    template: template,
    className: "d2-thumbnail-attr-container",
    templateHelpers: function() {
      var column = this.options.column;
      var propertyValue = this.model.get(column.name) || "";
      var label = _.str.sformat(lang.title, column.title || column.name);
      return {
        value: propertyValue,
        aria_label: column.title || column.name,
        label: label,
        cid: this.model.cid
      };
    },
    constructor: function D2TemplateAttributeView(options) {
      options || (options = {});
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    }
  });
  ContentRegistry.registerByKey("template_subject", D2TemplateAttributeView);
  ContentRegistry.registerByKey("template_title", D2TemplateAttributeView);
  ContentRegistry.registerByKey("template_object_name", NameView);
  return D2TemplateAttributeView;
});