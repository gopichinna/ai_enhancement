/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import {
  Model
} from "nuc/lib/backbone";

import ServerTypeAttributes from "dctmw/models/server.type.attributes";

import ReadonlyMixin from "dctmw/models/mixins/readonly.mixin";

import ResourceMixin from "dctmw/models/mixins/resource.mixin";

import ServerAdaptorMixin from "dctmw/models/stm.server.adaptor.mixin";

import TypedAttributeMapper from "dctmw/utils/typed.attribute.mapper";

const ATTR_DEF_R_OBJECT_ID = {
  name: TypedAttributeMapper.constants.SERVER_ATTR_ID,
  repeating: false,
  type: "ID",
  length: 16,
  label: "",
  hidden: false,
  required: true,
  notnull: true,
  readonly: true,
  searchable: true
};

class ServerTypeModel extends Model {
  #attributes;
  constructor(attr, options = {}) {
    super(attr, options);
    this.makeResource(options).makeServerAdaptor(options).makeReadonly(options);
    this.#attributes = new ServerTypeAttributes([], options);
  }
  url() {
    throw new Error(`Undefined url() for ${ServerTypeModel.prototype.constructor.name}`);
  }
  set(key, val, options) {
    let attrs;
    if (key == null) {
      return this;
    }
    if (typeof key === "object") {
      attrs = key;
      options = val;
    } else {
      (attrs = {})[key] = val;
    }
    options || (options = {});
    if (val && val.skipSetValue) {
      return;
    }
    if (_.isString(attrs.parent) && !_.isEmpty(attrs.parent)) {
      let parentType = attrs.parent;
      parentType = parentType.split("/").reverse()[0];
      attrs = _.omit(attrs, "parent");
      attrs["parent_type"] = parentType;
    }
    if (_.isArray(attrs.properties)) {
      const properties = [ ATTR_DEF_R_OBJECT_ID, ...attrs.properties ];
      this.#attributes.reset(properties);
      attrs = _.omit(attrs, "properties");
    }
    return super.set(attrs, options);
  }
  getAttributeDef(attrName) {
    return this.#attributes.getAttributeDef(attrName);
  }
}

ResourceMixin.mixin(ServerTypeModel.prototype);

ServerAdaptorMixin.mixin(ServerTypeModel.prototype);

ReadonlyMixin.mixin(ServerTypeModel.prototype);

Object.assign(ServerTypeModel.prototype, {
  idAttribute: "name"
});

Object.defineProperty(ServerTypeModel.prototype.constructor, "name", {
  value: "ServerTypeModel"
});

export default ServerTypeModel;