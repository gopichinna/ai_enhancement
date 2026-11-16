/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/marionette", "nuc/utils/base", "dctmw/utils/client.location", "dctmw/utils/rest.resources", "d2/utils/widget.constants", "d2/utils/contexts/factories/d2.mycollections.factory", "i18n!d2/widgets/navigation.header/controls/d2collections/impl/nls/lang", "hbs!d2/widgets/navigation.header/controls/d2collections/impl/d2CollectionIcon", "css!d2/widgets/navigation.header/controls/d2collections/impl/d2CollectionIcon" ], function(_, Marionette, base, clientLocation, RestResources, widgetConstants, CollectionWidgetCollectionFactory, localizedStrings, template) {
  "use strict";
  var D2collectionsIconView = Marionette.ItemView.extend({
    tagName: "div",
    attributes: {
      title: localizedStrings.CollectionIconTitle,
      "aria-label": localizedStrings.CollectionIconAria,
      class: "d2-collection-view initialLoading d2-acc-tab-region"
    },
    template: template,
    templateHelpers: function() {
      return {
        title: localizedStrings.CollectionIconTitle,
        highContrast: this.options.highContrast === 2
      };
    },
    currentlyFocusedElement: function() {
      return this.$el;
    },
    constructor: function D2collectionsIconView(options) {
      options = options || {};
      this.collection = options.context.getCollection(CollectionWidgetCollectionFactory, {
        permanent: true
      });
      Marionette.ItemView.call(this, options);
      this.listenTo(this, "click:collectionIcon", this._onClick);
      this.listenTo(this.collection, "sync error", this._hideIcon);
      this.listenTo(this.collection, "sync update", this._updateIcon);
    },
    _onClick: function() {
      var defaultWidgets = RestResources.getCurrentUser().get("defaultWidgets"), defaultCollectionWidget = defaultWidgets && defaultWidgets[widgetConstants.DEFAULT.COLLECTIONS], encodedD2CollectionUrl = encodeURIComponent(defaultCollectionWidget + "&filter={}");
      clientLocation.navigate(clientLocation.modularizeFragment("#d2/collection?widget_name=" + encodedD2CollectionUrl), {
        trigger: true
      });
    },
    _updateIcon: function() {
      if (this.collection.length) {
        this.$el.parent().removeClass("no-collection");
      } else {
        this.$el.parent().addClass("no-collection");
      }
    },
    _hideIcon: function() {
      this.$el.parent().addClass("no-collection");
    },
    onRender: function() {
      var self = this;
      this.$el.on("click", function(event) {
        if (base.isControlClick(event)) {} else {
          self.triggerMethod("click:collectionIcon");
        }
      });
      this.$el.on("keydown", function(event) {
        if (event.keyCode === 32 || event.keyCode === 13) {
          event.preventDefault();
          self.triggerMethod("click:collectionIcon");
        }
      });
    }
  });
  return D2collectionsIconView;
});