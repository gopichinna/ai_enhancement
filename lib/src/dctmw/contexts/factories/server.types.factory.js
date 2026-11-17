/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import {
  Collection
} from "nuc/lib/backbone";

import CollectionFactory from "nuc/contexts/factories/factory";

import ServerTypesCollection from "dctmw/models/server.types.collection";

class ServerTypesFactory extends CollectionFactory {
  constructor(context, options) {
    super(context, options);
    let serverTypes = this.options._serverTypes ?? {};
    if (!(serverTypes instanceof Collection)) {
      const creationOptions = _.extend({}, serverTypes.options, {
        autoreset: true
      });
      serverTypes = new ServerTypesCollection(serverTypes.models, creationOptions);
    }
    this.property = serverTypes;
  }
  isFetchable() {
    return this.property.isFetchable();
  }
}

Object.assign(ServerTypesFactory.prototype, {
  propertyPrefix: "_serverTypes"
});

Object.defineProperty(ServerTypesFactory.prototype.constructor, "name", {
  value: "ServerTypesFactory"
});

export default ServerTypesFactory;