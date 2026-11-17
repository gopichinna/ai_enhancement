/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/models/browsable/client-side.mixin", "nuc/models/mixins/v2.expandable/v2.expandable.mixin", "d2/models/virtual.document.children", "d2/server.adaptors/converters/servercolumns", "d2/utils/sort.utils" ], function(_, $, Backbone, ClientSideBrowsableMixin, ExpandableV2Mixin, VirtualDocumentChildren, serverColumnsConverter, sortUtils) {
  "use strict";
  var VirtualDocumentChildrenBrowsable = VirtualDocumentChildren.extend({
    comparator: null,
    constructor: function VirtualDocumentChildrenBrowsable(models, options) {
      options = options || {};
      options._vdExpandedView = true;
      VirtualDocumentChildren.prototype.constructor.call(this, models, options);
      this.columnTypes = {};
      this.makeClientSideBrowsable(options).makeExpandableV2(options);
    },
    fetch: function(options) {
      options = options || {};
      options.shouldExpandAll = true;
      return VirtualDocumentChildren.prototype.fetch.call(this, options);
    },
    find: function(iteratee) {
      if (_.isFunction(iteratee)) {
        return _.find(this._getModels(), iteratee);
      }
      if (_.isObject(iteratee) && !this._isModel(iteratee)) {
        return _.find(this._getModels(), this._getModelMatcher(iteratee));
      }
      if (_.isString(iteratee)) {
        var iterateeFn = function(model) {
          return model.get(iteratee);
        };
        return _.find(this._getModels(), iterateeFn);
      }
    },
    filter: function(iteratee) {
      return _.filter(this._getModels(), iteratee);
    },
    where: function(properties, first) {
      return this[first ? "find" : "filter"](this._getModelMatcher(properties));
    },
    findWhere: function(properties) {
      return this.where(properties, true);
    },
    _getModelMatcher: function(properties) {
      var matcher = _.matcher(properties);
      return function(model) {
        return matcher(model.attributes);
      };
    },
    _getModels: function() {
      return this.allModels;
    }
  });
  ClientSideBrowsableMixin.mixin(VirtualDocumentChildrenBrowsable.prototype);
  ExpandableV2Mixin.mixin(VirtualDocumentChildrenBrowsable.prototype);
  VirtualDocumentChildrenBrowsable.prototype.compareObjectsForSort = function(property, left, right) {
    var sortSchema = this.columnTypes[property];
    if (!sortSchema) {
      this.columnTypes[property] = {};
      sortSchema = serverColumnsConverter.getSortColumnSchema(this.node.clientColumns, property);
      this.columnTypes[property] = sortSchema;
    }
    return sortUtils.compare(sortSchema.key, left, right, sortSchema.type, false);
  };
  return VirtualDocumentChildrenBrowsable;
});