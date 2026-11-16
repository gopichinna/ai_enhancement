/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "require", "nuc/lib/jquery" ], function(module, require, $) {
  const config = Object.values(module.config());
  const dfd = $.Deferred();
  require(config, () => {
    dfd.resolve();
  }, dfd.reject);
  return dfd.promise();
});