/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'module',
  'nuc/lib/underscore',
  'nuc/utils/log',
  'nuc/models/nodeconnectable', // eslint-disable-line @smartui/checks/deprecate-module
  'nuc/models/fetchable', // eslint-disable-line @smartui/checks/deprecate-module
  'nuc/models/nodeautofetchable' // eslint-disable-line @smartui/checks/deprecate-module
], function (module, _, log, NodeConnectableModel, FetchableModel, NodeAutoFetchableModel) {
  'use strict';

  log = log(module.id);

  function NodeResourceModel(ParentModel) {
    var prototype = {
      makeNodeResource: function (options) {
        // log.warn('Module "nuc/models/noderesource" has been deprecated and' +
        //          ' is going to be removed.' +
        //          '  Use "nuc/models/mixins/node.resource/node.resource.mixin" instead.')
        // && console.warn(log.last);
        // log.warn('Occurred ' + log.getStackTrace(2)) && console.warn(log.last);
        return this.makeNodeConnectable(options).makeFetchable(options).makeNodeAutoFetchable(options);
      }
    };
    prototype.NodeResource = _.clone(prototype);

    return _.extend(
      {},
      NodeConnectableModel(ParentModel),
      FetchableModel(ParentModel),
      NodeAutoFetchableModel(ParentModel),
      prototype
    );
  }

  return NodeResourceModel;
});
