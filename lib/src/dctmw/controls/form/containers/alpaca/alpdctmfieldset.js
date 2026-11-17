/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/lib/alpaca/js/alpaca.lite", "txt!dctmw/controls/form/containers/alpaca/impl/fieldset/fieldset.txt", "txt!dctmw/controls/form/containers/alpaca/impl/fieldset/fieldsetitem.txt", "css!dctmw/controls/form/containers/alpaca/impl/fieldset/fieldset", "dctmw/controls/form/containers/alpaca/alpdctmcontainer" ], function(_, $, Backbone, Marionette, Alpaca, fieldSetViewContainer, fieldSetViewContainerItem, fldCss, AlpDctmContainer) {
  "use strict";
  Alpaca.Fields.FieldSetContainer = AlpDctmContainer.extend({
    constructor: function FieldSetContainer(container, data, options, schema, view, connector, onError) {
      this.base(container, data, options, schema, view, connector, onError);
    },
    getFieldType: function() {
      return "fieldset";
    },
    postRender: function(callback) {
      this.base(callback);
    },
    focus: function() {
      if (this.children[0]) {
        this.children[0].focus();
      }
    }
  });
  Alpaca.registerFieldClass("fieldset", Alpaca.Fields.FieldSetContainer, "bootstrap-csui");
  Alpaca.registerTemplate("container-fieldset", fieldSetViewContainer);
  Alpaca.registerTemplate("container-fieldset-item", fieldSetViewContainerItem);
  return Alpaca.Fields.FieldSetContainer;
});