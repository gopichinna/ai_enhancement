/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'module',
  'nuc/lib/underscore',
  'nuc/utils/log',
  'nuc/models/connectable', // eslint-disable-line @smartui/checks/deprecate-module
  'nuc/models/fetchable', // eslint-disable-line @smartui/checks/deprecate-module
  'nuc/models/autofetchable' // eslint-disable-line @smartui/checks/deprecate-module
], function (module, _, log, ConnectableModel, FetchableModel, AutoFetchableModel) {
  'use strict';

  log = log(module.id);

  function ResourceModel(ParentModel) {
    var prototype = {
      makeResource: function (options) {
        // log.warn('Module "nuc/models/resource" has been deprecated and' +
        //          ' is going to be removed.' +
        //          '  Use "nuc/models/mixins/resource/resource.mixin" instead.')
        // && console.warn(log.last);
        // log.warn('Occurred ' + log.getStackTrace(2)) && console.warn(log.last);
        return this.makeConnectable(options).makeFetchable(options).makeAutoFetchable(options);
      }
    };
    prototype.Resource = _.clone(prototype);

    return _.extend(
      {},
      ConnectableModel(ParentModel),
      FetchableModel(ParentModel),
      AutoFetchableModel(ParentModel),
      prototype
    );
  }

  return ResourceModel;
});
