/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "smart/themes/theming", "smart/themes/jato.icons/smart.jato.illustrations", "i18n!smart/controls/facet.panel/impl/facet/facet.empty/impl/nls/lang", "hbs!smart/controls/facet.panel/impl/facet/facet.empty/impl/facet.empty", "css!smart/controls/facet.panel/impl/facet/facet.empty/impl/facet.empty" ], function($, _, Marionette, theming, jatoIllustrations, lang, template) {
  const isJato = () => theming.isJATOTheme();
  var FacetEmptyView = Marionette.ItemView.extend({
    template: template,
    className: "smart-facet-empty",
    constructor: function FacetEmptyView(options = {}) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    templateHelpers: function() {
      let emptyMessage = lang.searchNoresults;
      let emptyFacetsPlaceholderJATOIcon = jatoIllustrations.illustrationsNoFiles;
      let isJATOTheme = isJato();
      return {
        isJATOTheme: isJATOTheme,
        emptyFacetsPlaceholderJATOIcon: emptyFacetsPlaceholderJATOIcon,
        emptyMessage: emptyMessage
      };
    }
  });
  return FacetEmptyView;
});