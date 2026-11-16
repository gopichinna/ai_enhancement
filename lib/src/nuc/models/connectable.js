/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['nuc/lib/underscore' /*, 'module', 'nuc/utils/log'*/], function (_ /*, module, log*/) {
  'use strict';

  // log = log(module.id);

  function ConnectableModel(ParentModel) {
    var prototype = {
      makeConnectable: function (options) {
        // log.warn('Module "nuc/models/connectable" has been deprecated and' +
        //          ' is going to be removed.' +
        //          '  Use "nuc/models/mixins/connectable/connectable.mixin" instead.')
        // && console.warn(log.last);
        // log.warn('Occurred ' + log.getStackTrace(2)) && console.warn(log.last);
        options && options.connector && options.connector.assignTo(this);
        options && options.connector && this.original && options.connector.assignTo(this.original);
        return this;
      },

      _prepareModel: function (attrs, options) {
        options || (options = {});
        options.connector = this.connector;
        return ParentModel.prototype._prepareModel.call(this, attrs, options);
      }
    };
    prototype.Connectable = _.clone(prototype);

    return prototype;
  }

  return ConnectableModel;
});
