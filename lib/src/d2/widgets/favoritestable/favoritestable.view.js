/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "d2/utils/contexts/factories/favorites.factory", "d2/widgets/favoritestable/favorites.widgettable.view", "d2/widgets/widget.container/perspective.table.container.view" ], function($, _, Backbone, Marionette, D2FavoritesFactory, D2Favoritestable, PerspectiveTableContainer) {
  "use strict";
  var FavoritesTableView = PerspectiveTableContainer.extend({
    constructor: function FavoritesTableView() {
      PerspectiveTableContainer.prototype.constructor.apply(this, arguments);
    },
    getWidgetViewClass: function() {
      return D2Favoritestable;
    },
    resolveDataForTable: function() {
      return this.checkDataFetchedWithContext(D2FavoritesFactory);
    }
  });
  return FavoritesTableView;
});