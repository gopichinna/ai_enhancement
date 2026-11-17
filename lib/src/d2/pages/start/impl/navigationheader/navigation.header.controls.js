/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/backbone" ], function(Backbone) {
  "use strict";
  var leftSide = new Backbone.Collection([ {
    id: "d2/widgets/navigation.header/controls/home/home.view",
    sequence: 200,
    parentClassName: "d2-branding"
  } ], {
    comparator: "sequence"
  });
  var rightSide = new Backbone.Collection([ {
    id: "csui/widgets/navigation.header/controls/favorites/favorites.view",
    sequence: 200,
    parentClassName: "csui-favorites"
  }, {
    id: "csui/widgets/navigation.header/controls/user.profile/user.profile.view",
    sequence: 300,
    parentClassName: "csui-profile"
  } ], {
    comparator: "sequence"
  });
  return {
    leftSide: leftSide,
    rightSide: rightSide
  };
});