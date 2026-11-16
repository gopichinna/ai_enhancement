/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "hbs!d2/dialogs/create.relation/impl/empty.views/empty.child", "i18n!d2/dialogs/create.relation/impl/nls/lang" ], function(_, $, Marionette, emptyListTemplate, lang) {
  var EmptyChildView = Marionette.ItemView.extend({
    constructor: function EmptyChildView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    className: "cs-empty-child-text",
    template: emptyListTemplate,
    templateHelpers: function() {
      return {
        text: lang.ChildEmptyMsg,
        addButtonToolTip: lang.AddbuttonToolTip
      };
    }
  });
  return EmptyChildView;
});