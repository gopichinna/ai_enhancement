/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/contexts/factories/factory", "csui/utils/commands", "d2/models/aviator/aviator.assignments.collection" ], function(module, _, Backbone, CollectionFactory, commands, AviatorAssignmentsCollection) {
  "use strict";
  const AviatorConfigCollectionFactory = CollectionFactory.extend({
    propertyPrefix: "aviatorAssignments",
    constructor: function AviatorConfigCollectionFactory(context, options) {
      CollectionFactory.prototype.constructor.call(this, context, options);
      let aviatorAssignments = this.options.aviatorAssignments || {};
      if (!(aviatorAssignments instanceof Backbone.Collection)) {
        const config = module.config(), creationOptions = _.extend({
          commands: commands.getAllSignatures()
        }, config.options, aviatorAssignments.options, {
          autoreset: true
        });
        aviatorAssignments = new AviatorAssignmentsCollection(aviatorAssignments.models, creationOptions);
      }
      this.property = aviatorAssignments;
    },
    isFetchable: function() {
      const propertyFetcahble = !_.isFunction(this.property.isFetchable) || this.property.isFetchable();
      if (this.property.fetching) {
        return false;
      } else {
        return this.options.permanent === true ? propertyFetcahble : this.property.fetched !== true && propertyFetcahble;
      }
    },
    fetch: function(options) {
      return this.property.fetch(options);
    }
  });
  return AviatorConfigCollectionFactory;
});