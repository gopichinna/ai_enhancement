/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import module from "module";

import _ from "nuc/lib/underscore";

import logger from "nuc/utils/log";

import ServerTypeModelFactory from "dctmw/contexts/factories/server.type.model.factory";

import utils from "dctmw/utils/utils";

import extTypeDefs from "dctm-ext!dctmw/utils/virtual.server.types";

const log = logger(module.id);

const typeMap = new Map();

function validateTypeSchema(typeSchema) {
  if (!utils.isNonEmptyString(typeSchema.name) || !utils.isNonEmptyString(typeSchema.label)) {
    log.warn(`missing name/label for virtual type`) && console.log(log.last);
    return false;
  }
  if (typeMap.get(typeSchema.name)) {
    log.warn(`virtual type '${typeSchema.name}' already registered. Can not redefine.`) && console.log(log.last);
    return false;
  }
  if (!_.isArray(typeSchema.properties) || !typeSchema.properties.length) {
    log.warn(`No properties defined for virtual type '${typeSchema.name}'`) && console.log(log.last);
    return false;
  }
  const attrs = typeSchema.properties;
  for (let idx = 0; idx < attrs.length; idx++) {
    const attr = attrs[idx];
    if (!utils.isNonEmptyString(attr.name)) {
      log.warn(`Missing property name at index=${idx} for virtual type '${typeSchema.name}'`) && console.log(log.last);
      return false;
    }
    if (!utils.isNonEmptyString(attr.type) || ![ "boolean", "integer", "float", "datetime", "string" ].includes(attr.type)) {
      log.warn(`Unsupported type at index=${idx} for property '${attr.name}' in virtual type '${typeSchema.name}'`) && console.log(log.last);
      return false;
    }
  }
  return true;
}

class VirtualServerTypes {
  static #loaded = false;
  static #context;
  static registerSimpleType(jsonSchema) {
    if (validateTypeSchema(jsonSchema)) {
      typeMap.set(jsonSchema.name, true);
      const oName = jsonSchema.name;
      jsonSchema.name = jsonSchema.name.startsWith("_v_") ? jsonSchema.name : `_v_${jsonSchema.name}`;
      const typeModel = this.#context.getModel(ServerTypeModelFactory, ServerTypeModelFactory.createModelFactoryOptions({
        name: jsonSchema.name
      }, {
        permanent: true
      }));
      typeModel.set(jsonSchema);
      typeModel.fetched = true;
      log.info(`Registered new virtual server type '${jsonSchema.label}(${jsonSchema.name})' ${oName !== jsonSchema.name ? `for declared type '${oName}'` : ""}`) && console.log(log.last);
    } else {
      log.warn(`Ignoring virtual type definition ${JSON.stringify(jsonSchema)} due to schema validation error`) && console.log(log.last);
    }
  }
  static loadAllVirtualTypes(context) {
    if (this.#loaded) {
      return Promise.resolve();
    }
    this.#context = context;
    _.chain(extTypeDefs).flatten(true).each(defSchema => {
      this.registerSimpleType(defSchema);
    });
    return Promise.resolve();
  }
}

export default VirtualServerTypes;