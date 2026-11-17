/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/dialogs/node.picker/start.locations/location.base.factory", "csui/models/member/membercollection", "i18n!csui/dialogs/members.picker/start.locations/impl/nls/lang" ], function(_, $, LocationBaseFactory, AllMembersCollection, lang) {
  "use strict";
  var AllMembersFactory = LocationBaseFactory.extend({
    updateLocationModel: function(model) {
      var container = this.options.container;
      model.set({
        name: lang.labelAllMembersAndGroups,
        icon: "member",
        invalid: !(container && container.isFetchable()),
        location: "all.members"
      });
      return $.Deferred().resolve().promise();
    },
    getLocationParameters: function() {
      var container = this.options.container;
      var membersCollectionModel = new AllMembersCollection(undefined, {
        connector: this.options.connector
      });
      return {
        container: this.options.container,
        collection: membersCollectionModel,
        locationName: lang.labelCurrentLocation
      };
    }
  });
  return AllMembersFactory;
});