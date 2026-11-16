/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  Model
} from "nuc/lib/backbone";

import TypedAttributeMapper from "dctmw/utils/typed.attribute.mapper";

class ServerTypeAttribute extends Model {
  constructor(attr = {}, options = {}) {
    const type = attr["type"];
    Object.assign(attr, {
      type: TypedAttributeMapper.getNumericAttrType(type),
      typename: type
    });
    super(attr, options);
  }
  sync() {
    throw new Error(`${this.constructor.name} can not be synced.`);
  }
}

Object.assign(ServerTypeAttribute.prototype, {
  idAttribute: "name"
});

Object.defineProperty(ServerTypeAttribute.prototype.constructor, "name", {
  value: "ServerTypeAttribute"
});

export default ServerTypeAttribute;