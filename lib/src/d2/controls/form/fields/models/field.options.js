/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "d2/controls/form/fields/models/base.field.options" ], function($, _, Backbone, BaseFieldOptions) {
  "use strict";
  var D2FieldOptionCollection = BaseFieldOptions.extend({
    constructor: function D2FieldOptionCollection(attributes, options) {
      BaseFieldOptions.prototype.constructor.apply(this, arguments);
      this.setOrderOnRequest(false);
      this.options = options || {};
      this.options.limit = this.options?.top ? this.options.top : 10;
    },
    setOptionMacthChecker: function(optionMatchChecker) {
      this.optionMatchChecker = optionMatchChecker;
    },
    setOptionsFilter: function(value, attributes, options) {
      options = options || {};
      this.filters = {};
      this.filters[attributes] = value;
      this._lastFilterAndSortCriteria = undefined;
      this.setSkip(0, false);
      return this.fetch(options);
    },
    getOptionsFilter: function(attribute) {
      return this.filters && this.filters[attribute] || "";
    },
    _filter: function(models) {
      var searchText = this.getOptionsFilter("searchText");
      if (searchText && this.optionMatchChecker) {
        var searchRegex = new RegExp(searchText, "gi");
        models = _.filter(models, _.bind(function(model) {
          return !!this.optionMatchChecker.call(this, model, searchRegex);
        }, this));
      }
      this.filteredResultCount = models.length;
      return models;
    },
    _modelsReset: function() {
      var topCount = this.topCount;
      BaseFieldOptions.prototype._modelsReset.apply(this, arguments);
      this.topCount = topCount;
    }
  });
  return D2FieldOptionCollection;
});