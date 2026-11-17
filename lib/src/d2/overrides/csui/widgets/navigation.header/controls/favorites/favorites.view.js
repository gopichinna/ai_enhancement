/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/widgets/navigation.header/controls/favorites/favorites.view", "csui/widgets/favorites/favorites.view", "dctmw/utils/rest.resources", "d2/utils/widget.constants" ], function(_, FavoritesNavigationView, FavoritesView, RestResources, widgetConstants) {
  "use strict";
  var prototype = FavoritesNavigationView.prototype;
  var oldEnsureFavoritesView = prototype._ensureFavoritesView;
  FavoritesNavigationView.prototype._ensureFavoritesView = function() {
    var defaultWidgets = RestResources.getCurrentUser().get("defaultWidgets"), defaultWidgetFavoritie = defaultWidgets[widgetConstants.DEFAULT.FAVORITES];
    if (this.ui.favoritesViewContainer.hasClass("binf-hidden")) {
      var favViewOption = {
        avoidOpenPerspectiveOnHeader: true,
        showInlineActionBar: false,
        hideOpenPerspective: !defaultWidgetFavoritie,
        applicationScope: widgetConstants.WIDGET_SCOPE.FAVORITES
      };
      if (defaultWidgetFavoritie) {
        favViewOption.data = {
          widgetName: defaultWidgetFavoritie
        };
      }
      var options = _.extend(this.options, favViewOption);
      this.favoritesView = new FavoritesView(options);
    }
    oldEnsureFavoritesView.apply(this, arguments);
    this.favoritesView.completeCollection.ensureFetched();
  };
});