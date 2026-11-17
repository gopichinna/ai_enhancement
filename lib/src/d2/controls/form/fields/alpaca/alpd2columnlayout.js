/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/lib/alpaca/js/alpaca.lite", "txt!d2/controls/form/impl/d2columnlayout/d2columnlayout.txt", "txt!d2/controls/form/impl/d2columnlayout/d2columnlayoutitem.txt", "css!d2/controls/form/impl/d2columnlayout/d2columnlayout", "d2/controls/form/containers/alpaca/alpd2container" ], function(_, $, Backbone, Marionette, Alpaca, AlpColumnTemplate, AlpColumnItemTemplate, ColCss, AlpD2Container) {
  Alpaca.Fields.D2ColumnLayout = AlpD2Container.extend({
    constructor: function D2ColumnLayout(container, data, options, schema, view, connector, onError) {
      this.base(container, data, options, schema, view, connector, onError);
    },
    postRender: function(callback) {
      this.base(callback);
    },
    getFieldType: function() {
      return "d2column";
    }
  });
  Alpaca.registerFieldClass("d2column", Alpaca.Fields.D2ColumnLayout, "bootstrap-csui");
  Alpaca.registerTemplate("container-d2column", AlpColumnTemplate);
  Alpaca.registerTemplate("container-d2column-item", AlpColumnItemTemplate);
  return $.alpaca.Fields.D2ColumnLayout;
});