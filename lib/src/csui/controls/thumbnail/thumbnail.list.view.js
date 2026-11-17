/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/marionette", "csui/utils/commands", "csui/behaviors/default.action/default.action.behavior", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "csui/controls/mixins/view.events.propagation/view.events.propagation.mixin", "csui/controls/tableactionbar/tableactionbar.view", "csui/controls/thumbnail/thumbnail.item.view", "csui/controls/thumbnail/empty.thumbnail.view", "css!csui/controls/thumbnail/thumbnail" ], function(_, $, Marionette, commands, DefaultActionBehavior, TabableRegionBehavior, ViewEventsPropagationMixin, TableActionBarView, ThumbnailItemView, EmptyThumbnailView) {
  "use strict";
  var ThumbnailListView = Marionette.CollectionView.extend({
    className: "csui-thumbnail-collection",
    childView: ThumbnailItemView,
    childViewOptions: function() {
      return {
        context: this.options.context,
        showInlineToolbar: this.showInlineToolbar,
        toolbarItems: this.options.inlineBar.options.collection,
        toolbarItemsMasks: this.options.inlineBar.options.toolItemsMask,
        originatingView: this.options.originatingView,
        thumbnailView: this.options.thumbnailView,
        thumbnailHeaderView: this.options.thumbnailHeaderView,
        tableColumns: this.options.tableColumns,
        columns: this.options.columns,
        thumbnailContent: this.options.thumbnailContent
      };
    },
    childEvents: {
      "mouseenter:row": "onChildShowInlineActionBarWithDelay",
      "mouseleave:row": "onChildActionBarShouldDestroy",
      render: "_onChildRender"
    },
    events: {
      keydown: "onItemKeyDownOnThumbnailCollection"
    },
    emptyView: EmptyThumbnailView,
    emptyViewOptions: function() {
      return {
        $parentEl: this.$el,
        parentOptions: this.options
      };
    },
    behaviors: {
      DefaultAction: {
        behaviorClass: DefaultActionBehavior
      },
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },
    constructor: function ThumbnailListView(options) {
      options || (options = {});
      this.context = options.context;
      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
      this.showInlineToolbar = this.options.inlineBar.options.collection && this.options.inlineBar.options.toolItemsMask;
      this.currentIndexFocussed = 0;
      if (this.showInlineToolbar) {
        this.setInlineActionBarEvents();
      }
      _.defaults(this.options, {
        showInlineActionBar: true
      });
      $(window).on("resize", _.bind(this._adjustThumbnailWidth, this));
    },
    onItemKeyDownOnThumbnailCollection: function(event) {
      var currentCollection = this.$el.children();
      var collectionLength = this.$el.children().length;
      if (!this.$el.children().hasClass("csui-thumbnail-item-keyActive")) {
        if (event.keyCode === 39) {
          if (this.currentIndexFocussed < collectionLength) {
            $(currentCollection[this.currentIndexFocussed]).attr("tabindex", -1);
            $(currentCollection[++this.currentIndexFocussed]).trigger("focus").attr("tabindex", 0);
          } else {
            event.preventDefault();
            event.stopPropagation();
          }
        } else if (event.keyCode === 37) {
          if (this.currentIndexFocussed > 0) {
            $(currentCollection[this.currentIndexFocussed]).attr("tabindex", -1);
            $(currentCollection[--this.currentIndexFocussed]).trigger("focus").attr("tabindex", 0);
          } else {
            event.preventDefault();
            event.stopPropagation();
          }
        }
      }
    },
    currentlyFocusedElement: function(event) {
      return this.$el.children()[this.currentIndexFocussed];
    },
    setInlineActionBarEvents: function() {
      this.listenTo(this, "closeOther", this._destroyInlineActionBar);
      this.listenTo(this.collection, "reset", this._destroyInlineActionBar);
    },
    _destroyInlineActionBar: function() {
      if (this.inlineToolbarView) {
        this.inlineToolbarView.destroy();
        this.inlineToolbarView = undefined;
      }
    },
    _onChildRender: function(childView) {
      childView.options.thumbnailView && childView.options.thumbnailView.trigger("thumbnailRowRendered", {
        sender: this,
        target: childView.el,
        node: childView.model
      });
    },
    _showInlineActionBar: function(args) {
      if (this.inlineToolbarView) {
        this._savedHoverEnterArgs = args;
      } else if (!!args) {
        this._savedHoverEnterArgs = null;
        this.inlineToolbarView = new TableActionBarView(_.extend({
          context: this.options.context,
          commands: commands,
          collection: this.options.inlineBar.options.collection,
          toolItemsMask: this.options.inlineBar.options.toolItemsMask,
          originatingView: this.options.originatingView,
          model: args.model,
          status: {
            originatingView: this.options.originatingView,
            connector: this.options.collection.connector
          }
        }, this.options.inlineBar.options));
        this.listenTo(this.inlineToolbarView, "before:execute:command", function(eventArgs) {
          this.lockedForOtherContols = true;
          if (eventArgs && eventArgs.status && eventArgs.status.targetView && eventArgs.status.targetView.$el) {
            eventArgs.status.targetView.$el.addClass("active-row");
          }
          this._destroyInlineActionBar();
        });
        this.listenTo(this.inlineToolbarView, "after:execute:command", function(eventArgs) {
          this.lockedForOtherContols = false;
          if (eventArgs && eventArgs.status && eventArgs.status.targetView && eventArgs.status.targetView.$el) {
            eventArgs.status.targetView.$el.removeClass("active-row");
          }
        });
        if (this.options.originatingView) {
          this.listenTo(this.options.originatingView, "block:view:actions", function() {
            this.lockedForOtherContols = true;
            this._destroyInlineActionBar();
          });
          this.listenTo(this.options.originatingView, "unblock:view:actions", function() {
            this.lockedForOtherContols = false;
          });
        }
        this.inlineToolbarView.render();
        this.listenTo(this.inlineToolbarView, "destroy", function() {
          this.inlineToolbarView = undefined;
          if (this._savedHoverEnterArgs) {
            this.onChildShowInlineActionBarWithDelay(this._savedHoverEnterArgs);
          }
        }, this);
        $(args.target).append(this.inlineToolbarView.$el);
        this.inlineToolbarView.triggerMethod("show");
      }
    },
    onChildShowInlineActionBarWithDelay: function(childView, args) {
      if (this._showInlineActionbarTimeout) {
        clearTimeout(this._showInlineActionbarTimeout);
      }
      this.isSelected = this.collection.where({
        csuiIsSelected: true
      }).length > 0;
      var showInlineActionBar = !this.isSelected && this.options.thumbnailView.options.allSelectedNodes.length === 0;
      showInlineActionBar = showInlineActionBar && !this.lockedForOtherContols && this.options.showInlineActionBar;
      if (showInlineActionBar) {
        this._showInlineActionbarTimeout = setTimeout(_.bind(function() {
          this._showInlineActionbarTimeout = undefined;
          this._showInlineActionBar.call(this, args);
        }, this), 200);
      }
    },
    onChildActionBarShouldDestroy: function(childView, args) {
      this.options.showInlineActionBar = true;
      if (this._showInlineActionbarTimeout) {
        clearTimeout(this._showInlineActionbarTimeout);
        this._showInlineActionbarTimeout = undefined;
      }
      if (this.inlineToolbarView) {
        this.inlineToolbarView.destroy();
      }
    },
    showOrHideZeroRecordsMessage: function() {
      if (this.collection.length === 0) {
        if (this.options.thumbnailHeaderView && this.options.thumbnailView.collection.filters) {
          this.options.thumbnailHeaderView.searchBoxes.setFocus();
        }
        if (this._showingEmptyView && !!this.options.thumbnailView.collection && !!this.options.thumbnailView.collection.filters) {
          this.options.thumbnailHeaderView.render();
          this.options.thumbnailHeaderView.searchBoxes.setFocus();
        }
      } else {
        this.$el.removeClass("csui-thumbnail-empty");
        this.$el.removeClass("icon-thumbnail-empty-page");
      }
    },
    onRender: function() {
      this.showOrHideZeroRecordsMessage();
      this._adjustThumbnailWidth();
      this.options.thumbnailView.updateSelectAllCheckbox.call(this);
    },
    onMetadataClose: function() {
      this._adjustThumbnailWidth();
    },
    _adjustThumbnailWidth: function() {
      var thumbnailViewItem = this.$el.find(".csui-thumbnail-item"), thumbnailViewItemWidth = 190, parentWidth = $(".csui-table-facetview .smart-facet-panel").length > 0 ? $(".csui-facet-table-container").width() - $(".csui-table-facetview").width() : $(".cs-thumbnail-wrapper").width(), spaceBetweenItems = 2, thumbnailViewItemWidthPercent = thumbnailViewItemWidth / parentWidth * 100;
      for (var i = 1; i <= thumbnailViewItem.length; i++) {
        var thumbnailViewItemTotalWidth = i * thumbnailViewItemWidthPercent;
        if (thumbnailViewItemTotalWidth > 100) {
          i = i - 1;
          thumbnailViewItemWidthPercent = 100 / i;
          break;
        }
      }
      thumbnailViewItem.css({
        maxWidth: "calc(" + thumbnailViewItemWidthPercent + "% - " + spaceBetweenItems * 2 + "px)",
        minWidth: "calc(" + thumbnailViewItemWidthPercent + "% - " + spaceBetweenItems * 2 + "px)"
      });
    }
  });
  _.extend(ThumbnailListView.prototype, ViewEventsPropagationMixin);
  return ThumbnailListView;
});