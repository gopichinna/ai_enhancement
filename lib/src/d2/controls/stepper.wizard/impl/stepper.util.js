/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "dctmw/utils/utils" ], function(_, $, utils) {
  "use strict";
  return {
    evaluateProperty: function(propName, object, invocationContext) {
      if (_.isFunction(object[propName])) {
        return object[propName].apply(_.isObject(invocationContext) ? invocationContext : object, _.rest(arguments, 3));
      }
      return object[propName];
    },
    isNonEmptyString: function(str) {
      return utils.isNonEmptyString(str);
    },
    isJqueryPromise: function(value) {
      return utils.isJqueryPromise(value);
    },
    areSameFunctions: function(fn1, fn2) {
      return utils.areSameFunctions(fn1, fn2);
    }
  };
});