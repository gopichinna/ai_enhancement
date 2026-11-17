/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "dctmw/utils/rest.resources", "i18n!d2/dialogs/add.version/impl/nls/lang" ], function(module, _, $, Backbone, Marionette, RestResources, lang) {
  "use strict";
  return {
    UNKNOWN: "UNKNOWN",
    getFormats: function(filename) {
      var formatList = [];
      if (filename) {
        var ext = filename.split(".").pop().toLowerCase();
        var formats = RestResources.getFormats();
        formatList = formats.where({
          dos_extension: ext
        });
        if (formatList.length) {
          formatList = _.pluck(formatList, "attributes");
          _.map(formatList, function(item) {
            item.value = item.name;
            item.text = item.description;
            item.s = formatList.length === 1 ? true : item["is-default"];
          });
        } else {
          formatList = [ {
            value: this.UNKNOWN,
            text: lang.Unknown
          } ];
        }
      }
      return formatList;
    },
    getDefaultFormat: function(formatList) {
      return _.find(formatList, function(format) {
        return format["is-default"] === true;
      });
    },
    isForceThinClientMode: function(options) {
      return options.shareInfo && options.shareInfo.useCorePath || !options.file;
    }
  };
});