/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['nuc/lib/underscore', 'nuc/lib/backbone'], function (_, Backbone) {
  'use strict';

  var CloneAndFetchMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeCloneAndFetch: function (_options) {
          // options || (options = {});
          // this.factoryName = options.factoryName;
          return this;
        },

        cloneAndFetch: function (options) {
          // "rename" the current property - don't have to delete this.property, because it is
          // overwritten in the next line
          this.originalProperty = this.property;

          // todo: use optimized clone that does not copy attributes
          this.property = this.originalProperty.clone();

          if (this.originalProperty.autoreset !== undefined && this.property.autoreset === undefined) {
            this.property.autoreset = this.originalProperty.autoreset;
          }

          return this.fetch(options);
        },

        copyFetchedResultsToOriginalProperty: function () {
          if (this.originalProperty instanceof Backbone.Collection) {
            var attributesToCopyBack = [
              'actualSkipCount',
              'totalCount',
              'filteredCount',
              'skipCount',
              'topCount',
              'orderBy',
              'filters',
              'orderOnRequest',
              'pagination'
            ];
            _.each(
              attributesToCopyBack,
              function (attributeName) {
                if (this.property[attributeName] !== undefined) {
                  this.originalProperty[attributeName] = this.property[attributeName];
                }
              },
              this
            );

            this.originalProperty.reset(this.property.models);
          } else {
            if (this.originalProperty instanceof Backbone.Model) {
              this.originalProperty.set(this.property.attributes);
            } else {
              throw new Error('Unsupported property');
            }
          }

          // move originalProperty back to property
          this.property = this.originalProperty;
          delete this.originalProperty;
        }
      });
    }
  };

  return CloneAndFetchMixin;
});
