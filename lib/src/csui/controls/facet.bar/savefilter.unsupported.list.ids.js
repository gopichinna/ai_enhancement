/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui-ext!csui/controls/facet.bar/savefilter.unsupported.list.ids" ], function(_, unsupportedList) {
  "use strict";
  return _.flatten(unsupportedList);
});