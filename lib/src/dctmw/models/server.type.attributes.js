/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  Collection
} from "nuc/lib/backbone";

import ServerTypeAttribute from "dctmw/models/server.type.attribute";

class ServerTypeAttributes extends Collection {
  model = ServerTypeAttribute;
  constructor(models, options = {}) {
    super(models, options);
  }
  sync() {
    throw new Error(`${this.constructor.name} can not be synced.`);
  }
  getAttributeDef(attrName) {
    const attr = this.get(attrName);
    return attr ? attr.toJSON() : null;
  }
}

Object.defineProperty(ServerTypeAttributes.prototype.constructor, "name", {
  value: "ServerTypeAttributes"
});

export default ServerTypeAttributes;