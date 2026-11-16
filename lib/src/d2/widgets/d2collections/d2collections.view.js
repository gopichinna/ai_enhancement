/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "csui/controls/form/pub.sub", "d2/widgets/widgettile.group.list/widgettile.group.view", "d2/utils/contexts/factories/d2.mycollections.factory", "d2/models/d2collections/d2collections.items.collection", "d2/widgets/d2collections/d2collections.items/d2collections.files.list.view", "d2/widgets/d2collections.perspective/impl/d2collections.toolbaritems", "d2/widgets/d2collections.perspective/impl/d2collections.toolbaritems.mask", "i18n!d2/widgets/d2collections/impl/nls/lang", "dctmw/utils/client.location", "css!d2/widgets/d2collections/impl/d2collections" ], function($, _, PubSub, WidgetTileGroupView, CollectionWidgetCollectionFactory, D2CollectionItemsCollection, D2CollectionItemsView, d2collectionsToolbaritems, d2collectionsToolbarMasks, lang, clientLocation) {
  "use strict";
  let encodedD2COollectionUrl = undefined;
  var CollectionWidgetView = WidgetTileGroupView.extend({
    constructor: function CollectionWidgetView(options) {
      options = options || {};
      options.lang = lang;
      options.cssClass = "d2-tile-collectionwidget";
      options.collectionFactory = CollectionWidgetCollectionFactory;
      options.contentView = D2CollectionItemsView;
      options.widgetType = options.data.widgetType;
      options.widgetName = options.data.widgetName;
      options.orderBy = "r_modify_date desc";
      options.hideSearch = true;
      encodedD2COollectionUrl = encodeURIComponent(options.widgetName + "&filter={}");
      options.contentViewOptions = {
        collectionClass: D2CollectionItemsCollection,
        widgetType: options.data.widgetType,
        widgetName: options.data.widgetName,
        toolbarItems: {
          inlineActionbar: d2collectionsToolbaritems.inlineActionbar
        },
        toolbarItemsMasks: {
          toolbars: {
            inlineActionbar: new d2collectionsToolbarMasks().toolbars.inlineActionbar
          }
        }
      };
      options.enableHeaderIcon = true;
      options.enableOpenPerspective = true;
      CollectionWidgetView.__super__.constructor.call(this, options);
      this.completeCollection.setLimit(0, 10, false);
      this.ui = _.extend(this.ui || {}, {
        tileContent: ".tile-content",
        tileFooter: ".tile-footer"
      });
      this.listenTo(this.completeCollection, "delayed:data:sync", function() {
        if (this.completeCollection.totalCount > this.completeCollection.length) {
          this.showAllLink = true;
          this._showAllLink();
        }
      }.bind(this));
      this.listenTo(PubSub, "d2collections:landing-page:widget:refetch", () => {
        this.completeCollection.fetch({
          reload: true,
          skipSWCache: true
        });
      });
    },
    onRender: function() {
      WidgetTileGroupView.prototype.onRender.call(this);
      this.ui.searchInput.css = null;
    },
    _showAllLink: function() {
      if (this.showAllLink) {
        var $el = $("<div>").addClass("show-all-link-wrapper");
        $el.append("<span class='show-all-link' tabindex='0' role='link'>" + lang.showAllLabel + "</span>");
        this.ui.tileContent.append($el);
        $(this.$el.find(".show-all-link")).click(function() {
          this.showAllLinkClick();
        }.bind(this));
        $(this.$el.find(".show-all-link")).on("keydown", function(event) {
          if (event.keyCode === 32 || event.keyCode === 13) {
            this.showAllLinkClick();
          }
        }.bind(this));
      }
    },
    showAllLinkClick: function() {
      const collectionId = this.completeCollection.allModels[this.completeCollection.length].attributes.r_object_id;
      clientLocation.navigate(clientLocation.modularizeFragment("#d2/collection?widget_name=" + encodedD2COollectionUrl + "&collection-id=" + collectionId), {
        trigger: true,
        reload: true
      });
    },
    getElementByIndex: function(index) {
      if (isNaN(index) || index < 0) {
        return null;
      }
      var targetEle = "div.d2-widget-tile-group-content:nth-child({0}) .d2-group-content-header-region .d2-group-panel-container", nthChildSel = _.str.sformat(targetEle, index + 1), $item = this.$(nthChildSel);
      if ($item.length === 0) {
        $item = this._lookForElementToTabTo(index, [ '[role="option"] > div:not(.binf-hidden)', '[role="option"]' ]);
      }
      if ($item) {
        return $($item[0]);
      }
    }
  });
  return CollectionWidgetView;
});