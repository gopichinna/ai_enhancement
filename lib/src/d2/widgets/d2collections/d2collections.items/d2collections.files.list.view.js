/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/utils/base", "csui/behaviors/default.action/default.action.behavior", "csui/behaviors/limiting/limiting.behavior", "csui/controls/list/behaviors/list.view.keyboard.behavior", "dctmw/controls/list/list.view", "csui/controls/node-type.icon/node-type.icon.view", "dctmw/controls/behaviors/clientside.infinite.scrolling.behavior", "dctmw/controls/list/listitem.type.model.view", "dctmw/utils/rest.resources", "d2/widgets/d2collections.perspective/impl/d2collections.toolbaritems", "d2/widgets/d2collections.perspective/impl/d2collections.toolbaritems.mask", "d2/widgets/d2collections/d2collections.items/d2collections.empty.view", "i18n!d2/widgets/d2collections/impl/nls/lang", "dctmw/utils/client.location", "i18n!csui/controls/thumbnail/content/node.state/impl/nls/localized.strings", "hbs!d2/widgets/d2collections/d2collections.items/d2collections.files.items", "hbs!d2/widgets/d2collections/d2collections.items/d2collections.files.list", "css!d2/widgets/d2collections/d2collections.items/d2collections.files.list" ], function(_, $, Backbone, Marionette, base, DefaultActionBehavior, LimitingBehavior, ListViewKeyboardBehavior, ListView, NodeTypeIconView, ClientSideInfiniteScrollingBehavior, D2CollectionsFilesListItem, RestResources, d2collectionsToolbaritems, d2collectionsToolbarMasks, EmptyView, lang, ClientLocation, reserveLang, itemTemplate, template) {
  "use strict";
  var oldrefreshTabableElements = ListViewKeyboardBehavior.prototype.refreshTabableElements;
  const PREFIXID = "context_";
  var D2CollectionsFileItemsView = D2CollectionsFilesListItem.extend({
    template: itemTemplate,
    getAttributeValue: function(model, attributeName) {
      var value = model.get(attributeName);
      if (Array.isArray(value)) {
        for (var i = 0; i < value.length; i++) {
          if (value[i] !== undefined && value[i] !== null) {
            value = value[i];
            break;
          }
        }
      }
      return value !== undefined ? value : null;
    }
  });
  var D2CollectionsFilesListView = ListView.extend({
    className: "d2-collections-files-list cs-list tile content-tile",
    template: template,
    emptyView: EmptyView,
    childView: D2CollectionsFileItemsView,
    childViewContainer: ".binf-list-group",
    behaviors: {
      LimitedList: {
        behaviorClass: LimitingBehavior,
        completeCollection: function() {
          var opt = this.options, collection = opt.collection;
          collection.expanded = false;
          collection.limitedCollection = true;
          collection.setEnabledDelayRestCommands(true);
          collection.setEnabledLazyActionCommands(true);
          return collection;
        },
        limit: 10
      },
      ListViewKeyboardBehavior: {
        behaviorClass: ListViewKeyboardBehavior
      },
      DefaultAction: {
        behaviorClass: DefaultActionBehavior
      }
    },
    templateHelpers: function() {
      return {
        showAllLabel: lang.showAllLabel,
        showAllId: PREFIXID + this.completeCollection.options.parentNode.attributes.r_object_id,
        showAllLink: this.completeCollection.totalCount > this.completeCollection.length
      };
    },
    childViewOptions: function() {
      return {
        filesListView: this,
        checkDefaultAction: true,
        toolbarData: {
          toolbaritems: this.toolbarItems,
          toolbarItemsMasks: this.toolbarItemsMasks
        },
        context: this.context,
        parentModel: this.options.parentNode,
        tabModel: this.originatingView.model,
        originatingView: this.originatingView,
        templateHelpers: function() {
          var currentLoggedInUserId = RestResources.getCurrentUser().id;
          var reservedUserId = this.model.get("reserved_user_id");
          var reserved = false, isReservedByOther, reservedTooltip = "";
          if (reservedUserId && reservedUserId !== "") {
            reserved = true;
            reservedTooltip = _.str.sformat(reserveLang.reservedTooltip, reservedUserId, base.formatExactDate(this.model.get("reserved_date")));
          }
          if (reservedUserId && currentLoggedInUserId !== reservedUserId) {
            isReservedByOther = true;
          }
          var versionNo = this.model.get("r_version_label");
          if (Array.isArray(versionNo)) {
            for (var i = 0; i < versionNo.length; i++) {
              if (versionNo[i] !== undefined && versionNo[i] !== null && !isNaN(versionNo[i])) {
                versionNo = versionNo[i];
                break;
              }
            }
          }
          versionNo = versionNo !== undefined ? versionNo : null;
          return {
            enableIcon: true,
            name: this.model.get("name") || this.model.get("object_name"),
            text: lang.emptyFilesListLabel,
            showInlineActionBar: true,
            versionNo: versionNo,
            reserved: reserved,
            isReservedByOther: isReservedByOther,
            reservedTooltip: reservedTooltip
          };
        }
      };
    },
    childEvents: {
      "click:item": "onClickItem",
      render: "onRenderItem"
    },
    constructor: function D2CollectionsFilesListView(options) {
      options = options || {};
      options.showInlineActionBar = true;
      this.context = options.context;
      this.collection = options.collection || new Backbone.Collection();
      this.originatingView = options.originatingView;
      this.toolbarItems = {
        inlineActionbar: d2collectionsToolbaritems.tileInlineActionbar
      };
      this.toolbarItemsMasks = new d2collectionsToolbarMasks();
      options.toolbarItems = this.toolbarItems;
      options.toolbarItemsMasks = this.toolbarItemsMasks;
      options.orderBy = "updated desc";
      this.ui = _.extend(this.ui || {}, {
        tileContent: ".tile-content",
        tileInnerFooter: ".tile-footer-inner",
        tileFooter: ".tile-footer"
      });
      ListView.prototype.constructor.apply(this, arguments);
      this._onTabKey = function() {
        return;
      };
      this.completeCollection.setLimit(0, 10, false);
      this.keyboardBehavior.refreshTabableElements = function() {
        oldrefreshTabableElements.apply(this, arguments);
        this.view.selectedIndex = 0;
      };
      this.listenTo(this, "collection:scroll:fetch", _.bind(function() {
        this.$el.find(".tile-content").perfectScrollbar("update");
        this._loadMoreItemsAvailableIfNoScroll();
      }, this));
      $(window).on("resize", _.bind(this._loadMoreItemsAvailableIfNoScroll, this));
    },
    onShow: function() {
      this._loadMoreItemsAvailableIfNoScroll();
    },
    _loadMoreItemsAvailableIfNoScroll: function() {
      if (this.collection.length < this.collection.totalCount) {
        var contentParent = this.$el.find(".tile-content");
        contentParent && contentParent.trigger && contentParent.trigger("scroll");
      }
    },
    onClickItem: function(target) {
      this.triggerMethod("execute:defaultAction", target.model);
    },
    onRender: function() {
      this.completeCollection.fetch();
      this.listenTo(this.completeCollection, "sync", function() {
        if (this.completeCollection.totalCount > this.completeCollection.length) {
          this.ui.tileContent.css("height", "calc(100% - 30px)");
          this.ui.tileInnerFooter.show();
        } else {
          this.ui.tileContent.css("height", "100%");
          this.ui.tileInnerFooter.hide();
        }
        $(".show-all-link-inner").on("click", this.navigateToCollection);
      }.bind(this));
    },
    navigateToCollection: function(e) {
      e.stopImmediatePropagation();
      ClientLocation.navigate(ClientLocation.modularizeFragment("#d2/collection?collection-id=" + this.id.replace(PREFIXID, "")), {
        trigger: true
      });
    },
    onRenderItem: function(childView) {
      childView._nodeIconView = new NodeTypeIconView({
        el: childView.$(".csui-type-icon").get(0),
        node: childView.model
      });
      childView._nodeIconView.render();
      childView.model.on("sync delayed:data:update", function() {
        if (!childView.isDestroyed) {
          childView.render();
        }
      });
    }
  });
  return D2CollectionsFilesListView;
});