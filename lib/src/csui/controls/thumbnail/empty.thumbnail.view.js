/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/marionette", "hbs!csui/controls/thumbnail/impl/empty.thumbnail", "i18n!csui/controls/thumbnail/impl/nls/lang", "css!csui/controls/thumbnail/thumbnail" ], function(_, Marionette, emptyThumbnailTemplate, lang) {
  "use strict";
  var EmptyThumbnailView = Marionette.ItemView.extend({
    className: "csui-thumbnail-empty",
    template: emptyThumbnailTemplate,
    templateHelpers: function() {
      return {
        noResults: this.emptyThumbnailText
      };
    },
    constructor: function EmptyThumbnailView(options) {
      this.options = options && options.parentOptions;
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    initialize: function() {
      this.canAddItems = !!this.options.originatingView.canAddItems();
      this.addItemsPermissions = !!this.options.originatingView.addItemsPermissions();
      if (this.collection.fetched) {
        this._setEmptyViewText();
      }
    },
    onRender: function() {
      if (this.collection.fetched) {
        this.options.$parentEl.addClass("csui-thumbnail-empty");
      }
      if (!!this.canAddItems && !!this.addItemsPermissions) {
        this.$el.addClass("csui-can-add-items");
      }
    },
    onShow: function() {
      this.$el.addClass("icon-thumbnail-empty-page");
    },
    onDestroy: function() {
      this.options.$parentEl.removeClass("csui-thumbnail-empty");
    },
    _setEmptyViewText: function() {
      this.emptyThumbnailText = "";
      this.emptyThumbnailText = !!this.addItemsPermissions ? lang.dragAndDropMessage : lang.emptyListText;
      this.emptyThumbnailText = !!this.collection.filters && this.collection.filters.name ? lang.noSearchResults : this.emptyThumbnailText;
    }
  });
  return EmptyThumbnailView;
});