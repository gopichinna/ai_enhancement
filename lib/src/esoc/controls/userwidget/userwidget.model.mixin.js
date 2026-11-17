/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/underscore" ], function($, _) {
  "use strict";
  var UserWidgetModelMixin = {
    parseModelResponse: function(model, options) {
      model.attributes.display_name = model.get("name_formatted");
      model.attributes.department_name = model.get("group_id") ? model.get("group_id").name : "";
    }
  };
  return UserWidgetModelMixin;
});