/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore" ], function(_) {
  "use strict";
  function parseExtensions(extraTileDefinitions) {
    var extObjects = [];
    if (extraTileDefinitions) {
      _.each(extraTileDefinitions, function(extGr) {
        var grNS = extGr._srcNS, newGr = _.map(extGr, function(obj) {
          if (_.isObject(obj)) {
            return _.extend(obj, {
              _srcNS: grNS
            });
          }
          return obj;
        });
        extObjects = extObjects.concat(newGr);
      });
    }
    return extObjects;
  }
  return {
    parseExtensions: parseExtensions
  };
});