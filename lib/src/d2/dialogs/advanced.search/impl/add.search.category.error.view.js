/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "hbs!d2/dialogs/advanced.search/impl/add.search.category.error" ], function($, _, Marionette, template) {
  "use strict";
  var AddSearchCategoryErrorView = Marionette.ItemView.extend({
    constructor: function AddSearchCategoryErrorView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    className: "d2-add-category-error-message",
    template: template,
    templateHelpers: function() {
      return {
        errorMessage: this.options.errorMessage
      };
    }
  });
  return AddSearchCategoryErrorView;
});