/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone" ], function(module, _, $, Backbone) {
  "use strict";
  var MemberAncestorCollection = Backbone.Collection.extend({
    constructor: function MemberAncestorCollection(model, options, context) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
      this.context = context;
    },
    clone: function() {
      return new this.constructor(this.attributes, {
        connector: this.connector
      });
    },
    isFetchable: function() {
      return false;
    },
    add: function(models, options) {
      Backbone.Collection.prototype.add.apply(this, arguments);
      this.trigger("sync", this);
    },
    findByIndex: function(id) {
      for (var i = 0; i < this.models.length; i++) {
        if (this.models[i].id === id) {
          return i;
        }
      }
      return -1;
    }
  });
  return MemberAncestorCollection;
});