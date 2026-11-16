/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['nuc/lib/underscore' /*, 'module', 'nuc/utils/log'*/], function (_ /*, module, log*/) {
  'use strict';

  // log = log(module.id);

  function ExpandableModel(_ParentModel) {
    var prototype = {
      makeExpandable: function (options) {
        // log.warn('Module "nuc/models/expandable" has been deprecated and' +
        //          ' is going to be removed.' +
        //          '  Use "nuc/models/mixins/expandable/expandable.mixin" instead.')
        // && console.warn(log.last);
        // log.warn('Occurred ' + log.getStackTrace(2)) && console.warn(log.last);
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
              this.expand.push(name);
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
          this.expand = [];
        }
      },

      getExpandableResourcesUrlQuery: function () {
        return { expand: this.expand };
      }
    };
    prototype.Expandable = _.clone(prototype);

    return prototype;
  }

  return ExpandableModel;
});
