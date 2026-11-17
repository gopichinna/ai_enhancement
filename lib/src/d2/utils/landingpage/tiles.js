/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "d2/utils/landingpage/tile.collection", "csui-ext!d2/utils/landingpage/tiles" ], function(_, TileCollection, extTiles) {
  "use strict";
  var tileCollection = new TileCollection();
  var tileDefinitions = [];
  if (extTiles) {
    tileDefinitions = tileDefinitions.concat(_.flatten(extTiles, true));
  }
  tileCollection.add(tileDefinitions, {
    merge: true
  });
  return tileCollection;
});