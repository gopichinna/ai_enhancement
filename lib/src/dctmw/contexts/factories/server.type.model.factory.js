/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import {
  Model
} from "nuc/lib/backbone";

import ModelFactory from "dctmw/contexts/factories/factory";

import ServerTypeModel from "dctmw/models/server.type.model";

class ServerTypeModelFactory extends ModelFactory {
  constructor(context, options) {
    super(context, options);
    let serverType = this.options._serverType ?? {};
    if (!(serverType instanceof Model)) {
      const creationOptions = _.extend({}, serverType.options, {
        autofetch: false
      });
      serverType = new ServerTypeModel(serverType.attributes ?? {}, creationOptions);
    }
    this.property = serverType;
  }
}

Object.assign(ServerTypeModelFactory.prototype, {
  propertyPrefix: "_serverType"
});

Object.defineProperty(ServerTypeModelFactory.prototype.constructor, "name", {
  value: "ServerTypeModelFactory"
});

export default ServerTypeModelFactory;