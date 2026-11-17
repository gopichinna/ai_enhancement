/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore" ], function(_) {
  "use strict";
  var DctmTypesHolder = function(subTypes, superTypes, labels) {
    this.subTypes = subTypes;
    this.superTypes = superTypes;
    this.labels = labels;
  };
  _.extend(DctmTypesHolder.prototype, {
    getTypeDetails: function(name) {
      var label = this.labels[name];
      if (!label) {
        return undefined;
      }
      return {
        name: name,
        label: label
      };
    },
    getAllSubTypes: function(name, includeSelf) {
      var output = [];
      this._getSubTypesRecursive(name, output);
      if (includeSelf === true) {
        output.push(this.getTypeDetails(name));
      }
      return this._sortItems(output);
    },
    getDirectSubTypes: function(name) {
      var me = this;
      return this._sortItems(_.map(this.subTypes[name] || [], function(subType) {
        return me.getTypeDetails(subType);
      }));
    },
    getSuperTypes: function(name) {
      var output = [], superType = this.superTypes[name];
      while ((superType = this.superTypes[name]) != null) {
        output.push(this.getTypeDetails(superType));
        name = superType;
      }
      return this._sortItems(output);
    },
    _getSubTypesRecursive: function(name, output) {
      var me = this;
      _.each(me.getDirectSubTypes(name), function(subType) {
        output.push(subType);
        me._getSubTypesRecursive(subType.name, output);
      });
    },
    _sortItems: function(items) {
      return _.sortBy(items, function(item) {
        return (item.label || "").toLowerCase();
      });
    },
    clone: function() {
      return new this.constructor(_.deepClone(this.subTypes), _.deepClone(this.superTypes), _.deepClone(this.labels));
    }
  });
  return DctmTypesHolder;
});