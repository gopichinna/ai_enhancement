/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/marionette", "csui/utils/contexts/factories/favorite2groups", "i18n!csui/widgets/favorites2.table/impl/nls/lang", "hbs!csui/widgets/favorites2.table/impl/favorites2.groups.footer", "css!csui/widgets/favorites2.table/impl/favorites2.groups.footer.view" ], function(module, Marionette, Favorite2GroupsCollectionFactory, lang, template) {
  "use strict";
  var FavoriteGroupsFooterView = Marionette.ItemView.extend({
    className: "csui-favorite-groups-footer",
    template: template,
    initialize: function() {
      this.groups = this.options.groups || this.context.getCollection(Favorite2GroupsCollectionFactory, {
        detached: true,
        permanent: true
      });
      this.listenTo(this.groups, "reset", this._groupsChanged);
      this.listenTo(this.groups, "update", this._groupsChanged);
    },
    templateHelpers: function() {
      return {
        texts: [ lang.groupHint1, lang.groupHint2 ]
      };
    },
    _groupsChanged: function() {
      if (this.groups.length > 1) {
        this.$el.find(".csui-groups-footer-wrapper").addClass("binf-hidden");
      } else {
        this.$el.find(".csui-groups-footer-wrapper").removeClass("binf-hidden");
      }
    }
  });
  return FavoriteGroupsFooterView;
});