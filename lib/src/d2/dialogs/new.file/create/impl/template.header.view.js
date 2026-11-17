/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/utils/base", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/dialogs/new.file/create/impl/sort/sort.view", "d2/dialogs/new.file/create/impl/switchview/tiles.view", "csui/controls/table/cells/searchbox/searchbox.view", "csui/controls/tableactionbar/tableactionbar.view", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "csui/controls/progressblocker/blocker", "hbs!d2/dialogs/new.file/create/impl/template.header", "i18n!d2/dialogs/new.file/create/impl/nls/lang", "csui/lib/jquery.mousehover" ], function(_, $, Backbone, Marionette, base, TabableRegionBehavior, SortView, LayoutSwitchView, SearchBoxView, TableActionBarView, LayoutViewEventsPropagationMixin, BlockingView, thumbnailHeaderTemplate, lang) {
  "use strict";
  var TemplateHeaderView = Marionette.LayoutView.extend({
    className: "d2-template-header",
    regions: {
      sortRegion: "#d2-sorting-container",
      searchRegion: "#d2-template-column-search",
      switchViewRegion: "#d2-template-view-type"
    },
    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior,
        initialActivationWeight: 100
      }
    },
    ui: {
      sortContainer: "#d2-sorting-container"
    },
    events: {
      keydown: "onKeyInView"
    },
    template: thumbnailHeaderTemplate,
    templateHelpers: function() {
      return {
        columns: this.options.thumbnailColumns,
        addTitle: lang.addTitle,
        isEmptyNode: this.collection.models.length === 0
      };
    },
    constructor: function TemplateHeaderView(options) {
      options || (options = {});
      Marionette.LayoutView.prototype.constructor.call(this, options);
      this.ruCollection = this.options.ruCollection;
      if (this.options.wizard) {
        BlockingView.delegate(this, this.options.wizard);
      } else {
        BlockingView.imbue(this);
      }
    },
    sortmenurender: function(name) {
      $(this.options.parentView.$el).find(".d2-template-table-bold").removeClass("d2-template-table-bold");
      $(this.options.parentView.$el).find(".sorting_disabled").filter(function() {
        return $(this).attr("data-csui-attribute") === name;
      }).find(".csui-table-column-text").addClass("d2-template-table-bold");
    },
    thumbnailItemClicked: function() {},
    selectAllThumbnails: function() {},
    onRender: function() {
      this.focusIndex = 0;
      var sortView = new SortView({
        collection: this.collection,
        resultView: this,
        ruCollection: this.ruCollection
      });
      this.sortRegion.show(sortView);
      this.listenTo(sortView, "render:sortmenu", this.sortmenurender);
      this.ensureAllSearchBox();
      this.currentlyFocusedElement();
      var switchView = new LayoutSwitchView({
        isThumbnail: this.options.isThumbnail,
        parentView: this.options.parentView
      });
      this.switchViewRegion.show(switchView);
    },
    currentlyFocusedElement: function() {
      var focusables = this.$el.find("*[tabindex=-1]");
      if (focusables.length) {
        focusables.prop("tabindex", 0);
      }
    },
    onKeyInView: function(event) {
      if (event.keyCode === 32 || event.keyCode === 13) {
        if ($(event.target).hasClass("csui-selectAll-input")) {
          event.preventDefault();
          event.stopPropagation();
          if (base.isFirefox()) {
            if (event.keyCode === 32) {
              return false;
            }
          }
          $(event.target).trigger("click");
        }
        if ($(event.target).hasClass("d2-template-column-search")) {
          event.preventDefault();
          event.stopPropagation();
          this.searchBoxes.showSearchInput(event);
        }
      }
      if (event.keyCode === 9) {
        if ($(event.target).hasClass("switch-view-link")) {
          if (!event.shiftKey) {
            let recentCollapsibleGroup = $(".otc-collapsible-group.recent-collapsible-group"), recentCollapsibleGroupFocusableElement = $(recentCollapsibleGroup[0]?.shadowRoot)?.find(":focusable")?.length ? $(recentCollapsibleGroup[0].shadowRoot).find(":focusable")[0] : recentCollapsibleGroup;
            event.preventDefault();
            event.stopPropagation();
            recentCollapsibleGroupFocusableElement.focus();
          }
        }
      }
    },
    ensureAllSearchBox: function() {
      var self = this, searchWrapper = this.$el.find(".d2-template-column-search"), columnName = "name";
      if ($(this).find(".d2-template-column-search").length === 0) {
        var searchbox = new SearchBoxView(self.collection.filters[columnName], {
          column: columnName,
          columnTitle: ""
        });
        self.searchBoxes = searchbox;
        searchbox.on("change:filterValue", function(data) {
          self.applyFilter(data);
        });
        searchbox.on("opened", function() {
          self.searchColumn = columnName;
        });
        searchbox.on("closed", function() {
          self.options.parentView.blockActions();
          self.collection.filters[columnName] = undefined;
          self.ruCollection.filters[columnName] = undefined;
          self.options.parentView.unblockActions();
        });
        this.searchRegion.show(self.searchBoxes);
        if (columnName === self.searchColumn && !self.options.thumbnailView.activeInlineForm) {
          searchbox.setFocus();
        }
        searchWrapper = $(this).find(".d2-template-column-search");
        if (searchWrapper) {
          searchWrapper.attr("aria-label", lang.searchIconTooltip);
        }
      }
    },
    applyFilter: function(data) {
      var filterObj = {};
      filterObj["name"] = data.keywords;
      filterObj["subject"] = data.keywords;
      filterObj["title"] = data.keywords;
      if (this.collection.fetching) {
        this.filterValuePending = filterObj;
      } else {
        this.ruCollection.resetLimit(false);
        this.ruCollection.setFilter(filterObj);
        this.collection.resetLimit(false);
        this.collection.setFilter(filterObj);
      }
    }
  });
  _.extend(TemplateHeaderView.prototype, LayoutViewEventsPropagationMixin);
  return TemplateHeaderView;
});