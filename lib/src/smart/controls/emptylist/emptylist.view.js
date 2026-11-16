/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "hbs!smart/controls/emptylist/impl/emptylist", "i18n!smart/controls/emptylist/impl/nls/lang", "css!smart/controls/emptylist/impl/emptylist" ], function(_, $, Marionette, emptyListTemplate, lang) {
  var EmptyListView = Marionette.ItemView.extend({
    constructor: function EmptyListView(options = {}) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    className: "cs-emptylist-container",
    template: emptyListTemplate,
    templateHelpers: function() {
      return {
        text: this.options.text || lang.emptyViewDefaultText
      };
    }
  });
  return EmptyListView;
});