/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "d2/sdk/models/table/column.collection" ], function(BaseColumnCollection) {
  "use strict";
  var AviatorAssignmentsColumnsCollection = BaseColumnCollection.extend({
    constructor: function AviatorAssignmentsColumnsCollection(models, options) {
      AviatorAssignmentsColumnsCollection.__super__.constructor.call(this, models, options);
    }
  });
  return AviatorAssignmentsColumnsCollection;
});