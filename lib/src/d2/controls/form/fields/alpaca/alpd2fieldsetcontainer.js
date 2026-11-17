/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/lib/alpaca/js/alpaca.lite", "txt!d2/controls/form/impl/d2fieldsetcontainer/d2fieldsetcontainer.txt", "txt!d2/controls/form/impl/d2fieldsetcontainer/d2fieldsetcontaineritem.txt", "css!d2/controls/form/impl/d2fieldsetcontainer/d2fieldsetcontainer", "dctmw/controls/form/containers/alpaca/alpdctmfieldset" ], function(_, $, Backbone, Marionette, Alpaca, fieldSetViewContainer, fieldSetViewContainerItem, fldCss, AlpD2Container) {
  "use strict";
  Alpaca.Fields.D2FieldSetContainer = AlpD2Container.extend({
    constructor: function D2FieldSetContainer(container, data, options, schema, view, connector, onError) {
      this.base(container, data, options, schema, view, connector, onError);
    },
    getFieldType: function() {
      return "d2fieldset";
    },
    postRender: function(callback) {
      this.base(callback);
    },
    destroy: function() {
      this.base();
      if (this.region) {
        this.region.destroy();
      }
    },
    focus: function() {
      if (this.children[0]) {
        this.children[0].focus();
      }
    },
    hide: function() {
      this.base();
      if (this.options.isSpyScrollContainer) {
        var form = this.domEl.closest(".d2-properties-form").parent();
        form.addClass("binf-hidden");
      }
    },
    show: function() {
      this.base();
      if (this.options.isSpyScrollContainer) {
        var form = this.domEl.closest(".d2-properties-form").parent();
        form.removeClass("binf-hidden");
      }
    }
  });
  Alpaca.registerFieldClass("d2fieldset", Alpaca.Fields.D2FieldSetContainer, "bootstrap-csui");
  Alpaca.registerTemplate("container-d2fieldset", fieldSetViewContainer);
  Alpaca.registerTemplate("container-d2fieldset-item", fieldSetViewContainerItem);
  return Alpaca.Fields.D2FieldSetContainer;
});