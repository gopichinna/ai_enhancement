/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/moment", "nuc/utils/types/date", "dctmw/utils/rest.resources", "dctmw/utils/format.utils", "d2/utils/constants", "i18n!d2/utils/impl/nls/lang" ], function(_, moment, date, RestResources, FormatUtils) {
  "use strict";
  _.extend(FormatUtils, {
    convertToServerFormat: function(input) {
      if (_.isEmpty(input)) {
        return input;
      }
      var format = "YYYY-MM-DDTHH:mm:ss.SSSZZ";
      function includesTimeZone(text) {
        var length = text.length;
        if (length > 19) {
          if (text.charAt(length - 1) === "Z") {
            return true;
          }
          var direction = text.charAt(length - 5);
          if (direction === "+" || direction === "-") {
            return true;
          }
        }
      }
      var retVal;
      if (input instanceof Array) {
        retVal = [];
        for (var key in input) {
          if (Object.prototype.hasOwnProperty.call(input, key)) {
            var date = input[key];
            var fmtdate = includesTimeZone(date) ? moment.utc(date).format(format) : moment(date).locale("en").utc().format(format);
            retVal.push(fmtdate);
          }
        }
      } else {
        retVal = includesTimeZone(input) ? moment.utc(input).format(format) : moment(input).locale("en").utc().format(format);
      }
      return retVal;
    },
    getBrowserTimeZone: function() {
      if (RestResources.getD2Options().is_client_tz_aware) {
        return moment.tz.guess();
      } else {
        return RestResources.getProductInfo().get("preferred_tz");
      }
    }
  });
  return FormatUtils;
});