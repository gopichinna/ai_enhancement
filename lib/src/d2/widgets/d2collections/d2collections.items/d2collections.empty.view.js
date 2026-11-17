/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "i18n!d2/widgets/d2collections/impl/nls/lang", "hbs!d2/widgets/d2collections/d2collections.items/d2collections.empty", "css!d2/widgets/d2collections/d2collections.items/d2collections.empty" ], function(_, $, Backbone, Marionette, lang, template) {
  "use strict";
  var emptyCollectionView = Marionette.ItemView.extend({
    template: template,
    constructor: function emptyCollectionView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    templateHelpers: function() {
      return {
        emptyCollectionMessage: lang.emptyFilesListLabel
      };
    }
  });
  return emptyCollectionView;
});