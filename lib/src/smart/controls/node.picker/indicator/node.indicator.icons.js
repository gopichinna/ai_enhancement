/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "csui-ext!smart/controls/node.picker/indicator/node.indicator.icons" ], function(_, Backbone, extNodeIndicatorIcons) {
  "use strict";
  var NodeIndicatorIconModel = Backbone.Model.extend({
    defaults: {
      sequence: 100,
      otcIconName: "",
      enabled: function(opts) {
        return false;
      },
      title: "",
      ariaLabel: ""
    },
    constructor: function NodeIndicatorIconModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    }
  });
  var NodeIndicatorIconCollection = Backbone.Collection.extend({
    model: NodeIndicatorIconModel,
    comparator: "sequence",
    constructor: function NodeIndicatorIconCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    }
  });
  var nodeIndicatorIcons = new NodeIndicatorIconCollection(), addExtensions = extensions => {
    if (extensions) {
      var IndicatorIconsToAdd = _.flatten(extensions, true);
      nodeIndicatorIcons.add(IndicatorIconsToAdd);
    }
  };
  addExtensions(extNodeIndicatorIcons);
  return nodeIndicatorIcons;
});