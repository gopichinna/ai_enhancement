/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/utils/base", "i18n!d2/controls/file.uploader/impl/nls/lang" ], function(_, $, Backbone, Marionette, base, lang) {
  "use strict";
  var FileFormatItemView = Marionette.ItemView.extend({
    tagName: "option",
    className: "file-format-option",
    template: false,
    constructor: function FileFormatItemView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    onRender: function() {
      var name = this.model.get("description");
      this.$el.text(name);
      this.$el.attr("title", name);
      this.$el.attr("aria-label", name);
      this.$el.val(this.model.get("name"));
    }
  });
  var FileFormatListView = Marionette.CollectionView.extend({
    tagName: "select",
    childView: FileFormatItemView,
    className: "file-format-select",
    attributes: {
      "aria-label": lang.fileFormatAria,
      tabindex: "0"
    },
    constructor: function FileFormatListView() {
      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
    },
    events: {
      change: "_selectFileFormat",
      keydown: "_selectFileFormatKeydown"
    },
    onRender: function() {
      this.$el.val(this.options.defaultFormat.get("name"));
    },
    _selectFileFormat: function() {
      var formatName = this.$el.val();
      var formatModel = this.collection.findWhere({
        name: formatName
      });
      this.trigger("format:dropdown:select", formatModel);
    },
    _selectFileFormatKeydown: function(event) {
      switch (event.which) {
       case 13:
        event.stopPropagation();
        break;

       default:
        return;
      }
    }
  });
  return FileFormatListView;
});