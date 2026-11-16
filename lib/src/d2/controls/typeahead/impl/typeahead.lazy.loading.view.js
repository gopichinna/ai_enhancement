/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "hbs!d2/controls/typeahead/impl/typeahead.lazy.loading" ], function(_, $, Backbone, Marionette, template) {
  "use strict";
  var TypeaheadLazyLoadingView = Marionette.ItemView.extend({
    constructor: function TypeaheadLazyLoadingView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    tagName: "li",
    className: "typeahead-lazy-loading csui-loading-parent-wrapper binf-disabled csui-disbaled",
    template: template
  });
  return TypeaheadLazyLoadingView;
});