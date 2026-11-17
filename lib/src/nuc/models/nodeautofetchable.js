/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['nuc/lib/underscore' /*, 'module', 'nuc/utils/log'*/], function (_ /*, module, log*/) {
  'use strict';

  // log = log(module.id);

  function NodeAutoFetchableModel(_ParentModel) {
    var prototype = {
      makeNodeAutoFetchable: function (options) {
        // log.warn('Module "nuc/models/fetchable" has been deprecated and' +
        //          ' is going to be removed.' +
        //          '  Use "nuc/models/mixins/fetchable/fetchable.mixin" instead.')
        // && console.warn(log.last);
        // log.warn('Occurred ' + log.getStackTrace(2)) && console.warn(log.last);
        options && options.autofetch && this.automateFetch(options.autofetch);
        return this;
      },

      automateFetch: function (enable) {
        this.node[enable ? 'on' : 'off'](
          _.result(this, '_autofetchEvent'),
          _.bind(this._fetchAutomatically, this, enable)
        );
      },

      isFetchable: function () {
        return this.node.isFetchableDirectly();
      },

      _autofetchEvent: 'change:id',

      _fetchAutomatically: function (options) {
        this.isFetchable() && this.fetch(_.isObject(options) && options);
      }
    };
    prototype.NodeAutoFetchable = _.clone(prototype);

    return prototype;
  }

  return NodeAutoFetchableModel;
});
