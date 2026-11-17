/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone", "csui/utils/contexts/factories/factory" ], function(module, _, Backbone, ModelFactory) {
  "use strict";
  var NextWorkflowModel = Backbone.Model.extend({
    constructor: function NextWorkflowModel(attributes, options) {
      return Backbone.Model.prototype.constructor.call(this, attributes, options);
    }
  });
  var NextWorkflowModelFactory = ModelFactory.extend({
    propertyPrefix: "nextWorkflow",
    constructor: function NextWorkflowModelFactory() {
      ModelFactory.prototype.constructor.apply(this, arguments);
      var nextWorkflow = this.options.nextWorkflow || {};
      if (!(nextWorkflow instanceof NextWorkflowModel)) {
        var config = module.config();
        nextWorkflow = new NextWorkflowModel(nextWorkflow.attributes || config.attributes, _.defaults({}, nextWorkflow.options, config.options));
      }
      this.property = nextWorkflow;
    },
    isFetchable: function() {
      return false;
    }
  });
  NextWorkflowModelFactory.defaultModel = NextWorkflowModel;
  return NextWorkflowModelFactory;
});