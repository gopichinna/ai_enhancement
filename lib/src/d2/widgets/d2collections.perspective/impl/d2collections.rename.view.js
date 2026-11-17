/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "hbs!d2/widgets/d2collections.perspective/impl/d2collections.rename", "css!d2/widgets/d2collections.perspective/impl/d2collections.rename" ], function(_, $, Backbone, Marionette, template) {
  "use strict";
  var renameCollectionView = Marionette.ItemView.extend({
    template: template,
    constructor: function renameCollectionView(options) {
      this.options = options;
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.ui = _.extend(this.ui || {}, {
        confirmBtn: ".confirm-rename"
      });
    },
    templateHelpers: function() {
      return {
        name: this.options.model.get("name")
      };
    },
    events: {
      "click .confirm-rename": "onConfirmRename",
      "click .cancel-rename": "onCancelRename",
      "keyup .new-collection-name-input": "onCollectionNameChange"
    },
    onConfirmRename: function() {
      this.trigger("confirm:rename");
    },
    onCancelRename: function() {
      this.trigger("cancel:rename");
    },
    onCollectionNameChange: function() {
      this.trigger("collection:name:change");
    }
  });
  return renameCollectionView;
});