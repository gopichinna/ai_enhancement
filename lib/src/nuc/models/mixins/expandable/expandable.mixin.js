/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['nuc/lib/underscore'], function (_) {
  'use strict';

  var ExpandableMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeExpandable: function (options) {
          var expand = options && options.expand;
          if (typeof expand === 'string') {
            expand = expand.split(',');
          }
          this.expand = expand || [];
          return this;
        },

        setExpand: function (name) {
          if (!_.isArray(name)) {
            name = name.split(',');
          }
          _.each(
            name,
            function (name) {
              if (!_.contains(this.expand, name)) {
                if (this.expand instanceof Object && this.expand.properties) {
                  this.expand.properties.push(name);
                } else {
                  this.expand.push(name);
                }
              }
            },
            this
          );
        },

        resetExpand: function (name) {
          if (name) {
            if (!_.isArray(name)) {
              name = name.split(',');
            }
            _.each(
              name,
              function (name) {
                var index = _.indexOf(this.expand, name);
                if (index >= 0) {
                  this.expand.splice(index, 1);
                }
              },
              this
            );
          } else {
            this.expand.splice(0, this.expand.length);
          }
        },

        getExpandableResourcesUrlQuery: function () {
          return { expand: this.expand };
        }
      });
    }
  };

  return ExpandableMixin;
});
