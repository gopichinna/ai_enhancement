/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import module from "module";

import _ from "nuc/lib/underscore";

import Backbone from "nuc/lib/backbone";

import ModelFactory from "csui/utils/contexts/factories/factory";

import ConnectorFactory from "csui/utils/contexts/factories/connector";

import BusinessWorkspaceModel from "d2/models/bws.model";

class BusinessWorkspaceModelFactory extends ModelFactory {
  constructor(context, options) {
    super(context, options);
    let businessWorkspace = this.options.businessWorkspace || {};
    if (!(businessWorkspace instanceof Backbone.Model)) {
      var connector = context.getObject(ConnectorFactory, options), config = module.config();
      businessWorkspace = new BusinessWorkspaceModel(businessWorkspace.attributes || config.attributes, _.defaults({
        connector: connector,
        context: context
      }, businessWorkspace.options, config.options));
    }
    this.property = businessWorkspace;
  }
  isFetchable() {
    const propertyFetcahble = this.property.isFetchable();
    return this.options.permanent === true ? propertyFetcahble : this.property.fetched !== true && propertyFetcahble;
  }
  fetch(options) {
    return this.property.fetch(options);
  }
}

BusinessWorkspaceModelFactory.defaultModel = BusinessWorkspaceModel;

Object.defineProperty(BusinessWorkspaceModelFactory.prototype.constructor, "name", {
  value: "BusinessWorkspaceModelFactory"
});

export default BusinessWorkspaceModelFactory;