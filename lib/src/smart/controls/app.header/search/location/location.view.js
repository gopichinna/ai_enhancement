/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "hbs!smart/controls/app.header/search/location/impl/location", "i18n!smart/controls/app.header/search/impl/nls/lang" ], function(require, module, _, $, Marionette, template, lang) {
  var locationView = Marionette.ItemView.extend({
    tagName: function() {
      return "otc-menugroup";
    },
    className: "locationContainer",
    template: template,
    templateHelpers: function() {
      let itemTxt = this.options?.nodeName || "";
      let itemId = this.options?.id || "";
      let searchFromText = _.str.sformat(lang.searchFromText, itemTxt);
      let itemTitle = searchFromText + " " + itemTxt;
      return {
        searchFromText: searchFromText,
        itemTxt: itemTxt,
        itemId: itemId,
        itemTitle: itemTitle
      };
    },
    constructor: function locationView(options = {}) {
      Marionette.View.prototype.constructor.apply(this, arguments);
    }
  });
  return locationView;
});