/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['nuc/lib/underscore' /*, 'module', 'nuc/utils/log'*/], function (_ /*, module, log*/) {
  'use strict';

  // log = log(module.id);

  function NodeConnectableModel(ParentModel) {
    var prototype = {
      makeNodeConnectable: function (options) {
        // log.warn('Module "nuc/models/connectable" has been deprecated and' +
        //          ' is going to be removed.' +
        //          '  Use "nuc/models/mixins/connectable/connectable.mixin" instead.')
        // && console.warn(log.last);
        // log.warn('Occurred ' + log.getStackTrace(2)) && console.warn(log.last);
        if (options && options.node) {
          this.node = options.node;
          options.node.connector && options.node.connector.assignTo(this);
        }
        return this;
      },

      _prepareModel: function (attrs, options) {
        options.connector = this.node && this.node.connector;
        return ParentModel.prototype._prepareModel.call(this, attrs, options);
      }
    };
    prototype.NodeConnectable = _.clone(prototype);

    return prototype;
  }

  return NodeConnectableModel;
});
