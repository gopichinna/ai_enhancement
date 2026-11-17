/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone", "csui/utils/contexts/factories/factory" ], function(module, _, Backbone, ModelFactory) {
  "use strict";
  var NextTaskModel = Backbone.Model.extend({
    constructor: function NextTaskModel(attributes, options) {
      return Backbone.Model.prototype.constructor.call(this, attributes, options);
    }
  });
  var NextTaskModelFactory = ModelFactory.extend({
    propertyPrefix: "nextTask",
    constructor: function NextTaskModelFactory() {
      ModelFactory.prototype.constructor.apply(this, arguments);
      var nextTask = this.options.nextTask || {};
      if (!(nextTask instanceof NextTaskModel)) {
        var config = module.config();
        nextTask = new NextTaskModel(nextTask.attributes || config.attributes, _.defaults({}, nextTask.options, config.options));
      }
      this.property = nextTask;
    },
    isFetchable: function() {
      return false;
    }
  });
  NextTaskModelFactory.defaultModel = NextTaskModel;
  return NextTaskModelFactory;
});