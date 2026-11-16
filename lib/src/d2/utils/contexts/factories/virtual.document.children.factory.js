/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone", "csui/utils/commands", "csui/utils/contexts/factories/factory", "csui/utils/contexts/factories/node", "d2/models/virtual.document.children" ], function(module, _, Backbone, allCommands, CollectionFactory, NodeModelFactory, VirtualDocumentChildren) {
  "use strict";
  var VirtualDocumentChildrenFactory = CollectionFactory.extend({
    propertyPrefix: "vdChildren",
    constructor: function VirtualDocumentChildrenFactory(context, options) {
      options || (options = {});
      CollectionFactory.prototype.constructor.apply(this, arguments);
      var children = this.options.vdChildren || {}, commands = children.options && children.options.commands || allCommands;
      if (!(children instanceof Backbone.Collection)) {
        var node = context.getModel(NodeModelFactory, options), config = module.config();
        children = new VirtualDocumentChildren(children.models, _.defaults({
          autoreset: true,
          commands: commands.getAllSignatures()
        }, config.options, children.options, {
          node: node
        }));
      }
      this.property = children;
    },
    isFetchable: function() {
      return this.property.isFetchable();
    },
    fetch: function(options) {
      return this.property.fetch(options);
    }
  });
  return VirtualDocumentChildrenFactory;
});