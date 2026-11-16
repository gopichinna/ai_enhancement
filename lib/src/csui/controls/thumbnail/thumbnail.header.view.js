/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/marionette", "csui/utils/base", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "csui/controls/thumbnail/impl/sort/sort.view", "csui/controls/thumbnail/content/select/select.view", "csui/controls/table/cells/searchbox/searchbox.view", "csui/controls/checkbox/checkbox.view", "hbs!csui/controls/thumbnail/impl/thumbnail.header", "i18n!csui/controls/thumbnail/impl/nls/lang", "css!csui/controls/thumbnail/thumbnail" ], function(_, $, Marionette, base, TabableRegionBehavior, SortView, SelectContentView, SearchBoxView, CheckboxView, thumbnailHeaderTemplate, lang) {
  "use strict";
  var ThumbnailHeaderView = Marionette.LayoutView.extend({
    className: "csui-thumbnail-header",
    tagName: "div",
    regions: {
      sortRegion: "#csui-sorting-container",
      searchRegion: "#csui-thumbnail-column-search",
      selectAllRegion: ".csui-checkbox-selectAll"
    },
    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior,
        initialActivationWeight: 100
      }
    },
    ui: {
      selectAll: ".csui-selectAll-input",
      sortContainer: "#csui-sorting-container"
    },
    events: {
      keydown: "onKeyInView",
      "click @ui.sortContainer": "onSortClick"
    },
    template: thumbnailHeaderTemplate,
    templateHelpers: function() {
      return {
        columns: this.options.thumbnailColumns,
        addTitle: lang.addTitle,
        selectAll: lang.selectAll,
        selectAllTitle: lang.selectAllTitle,
        isEmptyNode: this.collection.models.length === 0,
        items: base.formatMessage(this.collection.length, lang),
        selectThumbnails: this.options.thumbnailView.options.selectThumbnails === "none" || this.options.thumbnailView.options.selectThumbnails === "single"
      };
    },
    constructor: function ThumbnailHeaderView(options) {
      options || (options = {});
      Marionette.LayoutView.prototype.constructor.call(this, options);
      this.columnsWithSearch = options.columnsWithSearch || [];
      this.listenTo(this, "selectOrUnselect.mixed", this.thumbnailItemClicked);
      this.listenTo(this, "selectOrUnselect.all", function(isSelectAll, event) {
        if (isSelectAll) {
          this.options.thumbnailView.cancelAnyExistingInlineForm.call(this.options.thumbnailView);
          if (this.collection.models.length > 0) {
            event.cancel = false;
            _.each(this.collection.models, function(model) {
              model.set(SelectContentView.isSelectedModelAttributeName, true);
            });
          }
          this.options.thumbnailView.trigger("thumbnailSelected", {
            sender: this,
            targets: this.options.thumbnailView,
            nodes: this.collection.models
          });
        } else {
          if (this.collection.models.length > 0) {
            event.cancel = false;
            _.each(this.collection.models, function(model) {
              model.set(SelectContentView.isSelectedModelAttributeName, false);
            });
          }
          this.options.thumbnailView.trigger("thumbnailUnSelected", {
            sender: this,
            targets: this.options.thumbnailView,
            nodes: this.collection.models
          });
        }
        this.options.thumbnailView.showToolBarActions();
      });
    },
    onSortClick: function() {
      if (this.options.thumbnailView.currentItemView && this.options.thumbnailView.currentItemView.overviewPopoverOpened) {
        this.options.thumbnailView.currentItemView.overview.currentView._closePopover();
      } else if (this.options.thumbnailView.currentItemView && this.options.thumbnailView.currentItemView.favoritePopoverOpened) {
        this.options.thumbnailView.currentItemView.favorite.currentView.favStarView.closePopover();
      }
    },
    sortmenurender: function(name) {
      this.options.thumbnailView.resultsView.render();
      if (!this.isSortOrderClicked) {
        this.sortRegion.$el.find("button.binf-dropdown-toggle").trigger("focus");
        this.isSortOrderClicked = true;
      }
      if (this._isRendered && this.options.thumbnailView.options.allSelectedNodes.length === 0 && this.options.thumbnailView.resultsView.$el.find(".csui-checkbox")) {
        this.options.thumbnailView.resultsView.$el.find(".csui-checkbox").removeClass("csui-checkbox");
      }
    },
    thumbnailItemClicked: function() {
      var selection = this.collection.filter(function(model) {
        return model.get(SelectContentView.isSelectedModelAttributeName);
      });
      var all = selection.length > 0 && selection.length === this.collection.length;
      if (selection.length > 0 && !all) {
        this.$el.find(".csui-selected-checkbox").addClass("csui-checkbox-atleastone");
      } else {
        this.$el.find(".csui-selected-checkbox").removeClass("csui-checkbox-atleastone");
      }
      var selected = this.collection.where({
        csuiIsSelected: true
      }).length;
      this.options.thumbnailView.updateSelectAllCheckbox.call(this);
    },
    onRender: function(e) {
      var event = e || window.event, thumbnailView = this.options.thumbnailView;
      this.focusIndex = 0;
      var length = thumbnailView.$el.find(".csui-thumbnail-item-selected").length;
      var checkboxView = new CheckboxView({
        checked: false,
        disabled: false,
        ariaLabel: lang.selectAll,
        title: lang.selectAll,
        label: lang.selectAll
      });
      this.listenTo(checkboxView, "clicked", function(event) {
        event.cancel = true;
        this.trigger("selectOrUnselect.all", event.model.attributes.checked !== "true", event);
      });
      this.selectAllRegion.show(checkboxView);
      var sortView = new SortView({
        collection: this.collection,
        resultView: this
      });
      this.sortRegion.show(sortView);
      if (this.isSortOrderClicked) {
        sortView.ui.sortOrderBtn.trigger("focus");
      }
      this.listenTo(sortView, "render:sortmenu", this.sortmenurender);
      this.ensureAllSearchBox();
      this.currentlyFocusedElement();
    },
    updateTotalCount: function() {
      var itemCount = base.formatMessage(this.collection.length, lang);
      this.$el.find(".csui-thumbnail-itemcount").html(itemCount);
    },
    currentlyFocusedElement: function(event) {
      var focusables = this.$el.find("*[tabindex=-1]");
      if (focusables.length) {
        focusables.prop("tabindex", 0);
      }
      if (this.isSortOrderClicked) {
        return $(this.sortRegion.$el.find(".csui-sort-arrow"));
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
        if ($(event.target).hasClass("csui-thumbnail-column-search")) {
          event.preventDefault();
          event.stopPropagation();
          this.searchBoxes.showSearchInput(event);
        }
      }
    },
    getName: function() {
      var columnname = this.options.thumbnailView && this.options.thumbnailView.options && this.options.thumbnailView.options.allColumns.length && this.options.thumbnailView.options.allColumns.find(function(column) {
        return column.name === "name";
      });
      return columnname && columnname.name;
    },
    ensureAllSearchBox: function() {
      var self = this, thumbnailView = this.options.thumbnailView, searchWrapper = this.$el.find(".csui-thumbnail-column-search"), sortWrapper = this.$el.find(".csui-sorting-container"), searchColumn = thumbnailView.options.columns.where({
        isNaming: true
      }), columnName = searchColumn[0] ? searchColumn[0].get("key") : this.getName();
      if ($(this).find(".csui-thumbnail-column-search").length === 0) {
        var searchbox = new SearchBoxView(self.collection.filters[columnName], {
          column: columnName,
          columnTitle: lang.name
        });
        self.searchBoxes = searchbox;
        searchbox.on("change:filterValue", function(data) {
          self.applyFilter(data);
        });
        searchbox.on("opened", function() {
          sortWrapper.find(".csui-search-sort-options").removeClass("binf-open");
          sortWrapper.addClass("binf-hidden");
          self.searchColumn = columnName;
        });
        searchbox.on("closed", function() {
          sortWrapper.removeClass("binf-hidden");
          self.collection.filters[columnName] = undefined;
        });
        this.searchRegion.show(self.searchBoxes);
        if (columnName === self.searchColumn && !self.options.thumbnailView.activeInlineForm) {
          searchbox.setFocus();
        }
        searchWrapper = $(this).find(".csui-table-column-search");
        if (searchWrapper) {
          searchWrapper.attr("aria-label", _.str.sformat(lang.searchIconTooltip, lang.name));
        }
      }
    },
    applyFilter: function(data) {
      var filterObj = {};
      filterObj[data.column] = data.keywords;
      if (this.collection.fetching) {
        this.filterValuePending = filterObj;
      } else {
        this.collection.resetLimit(false);
        this.collection.setFilter(filterObj);
        this.options.thumbnailView && this.options.enableViewState && this.options.thumbnailView.setViewStateFilter(this.collection.getFilterAsObject());
      }
    }
  });
  return ThumbnailHeaderView;
});