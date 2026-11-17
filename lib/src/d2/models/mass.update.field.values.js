/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "nuc/models/actions", "nuc/models/browsable/client-side.mixin", "nuc/models/browsable/v2.response.mixin", "nuc/models/mixins/connectable/connectable.mixin", "nuc/models/mixins/fetchable/fetchable.mixin", "nuc/utils/url", "d2/models/workflow/workflow", "d2/models/workflow/workflow.audit.task", "d2/models/workflow/workflow.audit.task.event", "d2/utils/rest.linkrels", "d2/utils/sort.utils" ], function(_, Backbone, ActionCollection, ClientSideBrowsableMixin, BrowsableV2ResponseMixin, ConnectableMixin, FetchableMixin) {
  "use strict";
  var MassUpdateFieldValueCollection = Backbone.Collection.extend({
    constructor: function MassUpdateFieldValueCollection(models, options) {
      options = options || {};
      _.defaults(options, {
        orderBy: "d2_field_value_count desc"
      });
      Backbone.Collection.prototype.constructor.apply(this, arguments);
      this.makeConnectable(options).makeFetchable(options).makeClientSideBrowsable(options).makeBrowsableV2Response(options);
    },
    _prepareModel: function(attrs, options) {
      var model = Backbone.Collection.prototype._prepareModel.call(this, attrs, options);
      model.actions = new ActionCollection();
      return model;
    }
  });
  ConnectableMixin.mixin(MassUpdateFieldValueCollection.prototype);
  FetchableMixin.mixin(MassUpdateFieldValueCollection.prototype);
  ClientSideBrowsableMixin.mixin(MassUpdateFieldValueCollection.prototype);
  BrowsableV2ResponseMixin.mixin(MassUpdateFieldValueCollection.prototype);
  var oldCompareObjectsForSort = MassUpdateFieldValueCollection.prototype.compareObjectsForSort;
  MassUpdateFieldValueCollection.prototype.compareObjectsForSort = function(property, left, right) {
    var descending = this.orderBy.split(" ")[1] === "desc";
    if (left.get("has_value") === false) {
      return descending ? -1 : 1;
    } else if (right.get("has_value") === false) {
      return descending ? 1 : -1;
    } else {
      var compare = oldCompareObjectsForSort.apply(this, arguments);
      if (compare === 0 && property !== "name") {
        compare = oldCompareObjectsForSort.call(this, "name", left, right);
        compare = descending ? compare * -1 : compare;
      }
      return compare;
    }
  };
  return MassUpdateFieldValueCollection;
});