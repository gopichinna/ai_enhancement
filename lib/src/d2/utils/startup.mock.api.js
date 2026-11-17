/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery.mockjax", "json!./startup.mockdata.json" ], function(_, mockjax, mockData) {
  "use strict";
  var mocks = [];
  return {
    enable: function() {
      mocks.push(mockjax({
        url: "/d2sv/haridoc/graphics/config",
        type: "GET",
        status: 200,
        responseText: mockData
      }));
    },
    disable: function() {
      var mock;
      while ((mock = mocks.pop()) != null) {
        mockjax.clear(mock);
      }
    }
  };
});