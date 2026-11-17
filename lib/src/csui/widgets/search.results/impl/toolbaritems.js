/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "module", "csui-ext!csui/widgets/search.results/impl/toolbaritems" ], function(_, module, extraToolItems) {
  if (extraToolItems) {
    _.each(extraToolItems, function(moduleToolItems) {});
  }
  return extraToolItems;
});