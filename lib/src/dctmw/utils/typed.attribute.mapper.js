/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import extTypeMappers from "dctm-ext!dctmw/utils/typed.attribute.mapper";

const DEFAULT_ATTR_MAP = {
  id: "r_object_id"
};

const typeMap = new Map();

if (extTypeMappers) {
  _.chain(extTypeMappers).flatten(true).each(def => {
    if (_.isString(def.type) && !_.isEmpty(def.type) && _.isObject(def.map)) {
      typeMap.set(def.type, _.extend(def.map, DEFAULT_ATTR_MAP));
    }
  });
}

function mapAttrs(lookup, attrs) {
  return _.isObject(attrs) ? Object.keys(attrs).reduce((acc, key) => {
    acc[lookup[key] ?? key] = attrs[key];
    return acc;
  }, {}) : null;
}

class TypedAttributeMapper {
  static clientToServerAttrs(typeName) {
    return _.deepClone(typeMap.get(typeName) ?? DEFAULT_ATTR_MAP);
  }
  static clientToServerAttr(typeName, attrName) {
    return this.clientToServerAttrs(typeName)[attrName] ?? attrName;
  }
  static convertClientToServerAttrs(typeName, attributes) {
    return mapAttrs(this.clientToServerAttrs(typeName), attributes);
  }
  static serverToClientAttrs(typeName) {
    return _.invert(this.clientToServerAttrs(typeName));
  }
  static serverToClientAttr(typeName, attrName) {
    return this.serverToClientAttrs(typeName)[attrName] ?? attrName;
  }
  static convertServerToClientAttrs(typeName, attributes) {
    return mapAttrs(this.serverToClientAttrs(typeName), attributes);
  }
  static getNumericAttrType(strTypeName) {
    switch (String.prototype.toLowerCase.call(strTypeName)) {
     case "boolean":
      return 5;

     case "integer":
      return 2;

     case "date":
      return -7;

     case "double":
      return -4;

     case "string":
     default:
      return -1;
    }
  }
  static constants = Object.freeze({
    SERVER_ATTR_ID: "r_object_id"
  });
}

export default TypedAttributeMapper;