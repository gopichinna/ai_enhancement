/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/underscore", "csui/lib/backbone", "csui/controls/table/cells/templated/templated.view", "csui/controls/table/cells/cell.registry", "csui/controls/table/cells/search/search.cell/search.cell.popover.list.view", "csui/utils/base", "i18n", "csui/pages/start/start.page.view", "hbs!csui/controls/table/cells/search/search.cell/impl/search.cell", "i18n!csui/controls/table/cells/search/search.cell/impl/nls/lang", "css!csui/controls/table/cells/search/search.cell/impl/search.cell" ], function($, _, Backbone, TemplatedCellView, cellViewRegistry, SearchCellPopoverListView, base, i18n, StartPageView, template, lang) {
  "use strict";
  var SearchCellView = TemplatedCellView.extend({
    template: template,
    className: "csui-search-cell",
    templateHelpers: function() {
      return {
        count: this.collection.length
      };
    },
    events: {
      focus: "onFocus",
      "blur .csui-table-search-cell-text": "onBlur",
      "click .csui-count": "openPopover",
      "keydown .csui-table-search-cell-text": "onKeyInView"
    },
    constructor: function SearchCellView() {
      TemplatedCellView.prototype.constructor.apply(this, arguments);
      const columnName = this.options?.column?.name;
      this.columnValues = this.model.get(columnName + "_expand");
      this.formattedValue = this.model.get(columnName + "_formatted") || this.model.get(columnName);
      this.windowResizeHandler = _.bind(this._onWindowResize, this);
      $(window).on("resize", this.windowResizeHandler);
    },
    getValueText: function() {
      return this.getValueData().formattedValueForExpandView;
    },
    _createCollection: function() {
      var model, collection = new Backbone.Collection();
      _.each(this.model.get(this.options?.column?.name + "_expand").values, function(item) {
        model = new Backbone.Model({
          value: item.value,
          value_formatted: item.value_formatted || item.value
        });
        collection.add(model);
      });
      return collection;
    },
    _onWindowResize: function() {
      this.popoverEl && this.closePopover();
    },
    openPopover: function(event, popoverEl) {
      if (!this.collection) {
        return;
      }
      var self = this, rightOffset, placement, widgetWidth = $(".csui-result-list").width() || $(".csui-search-results-table-view"), isWidthDiff = $(window).width() !== widgetWidth, isRtl = i18n && i18n.settings.rtl;
      this.popoverEl = popoverEl ? popoverEl : $(event.currentTarget);
      this.popoverView = new SearchCellPopoverListView({
        originatingView: this,
        collection: this.collection
      });
      this.popoverView.render();
      if (this.options.searchMetadataView) {
        placement = isRtl ? "right" : "left";
      } else {
        if (isRtl && isWidthDiff) {
          rightOffset = $(window).width() - this.popoverEl.offset().left - this.popoverEl.width();
        } else {
          var searchEleWidth = $(".csui-search-results").width() || $(".csui-search-results-table-view").width();
          rightOffset = searchEleWidth - this.popoverEl.offset().left - this.popoverEl.width();
        }
        placement = rightOffset < 260 ? "left" : "right";
      }
      this.popoverEl.binf_popover({
        content: this.popoverView.$el,
        html: true,
        placement: placement,
        trigger: "manual"
      });
      this.popoverEl.binf_popover("show");
      this.popover = this.popoverEl.siblings(".binf-popover");
      this.popover.addClass("binf-invisible");
      var popoverLabelElemId = _.uniqueId("popoverLabelId"), popoverHeaderTitle = _.has(this.options.column.attributes, "completeName") && this.options.column.attributes.completeName, popoverHeader = this.popover.find(">.binf-popover-title");
      this.popover.attr("role", "dialog");
      if (popoverHeader) {
        popoverHeader.attr("id", popoverLabelElemId);
        popoverHeader.html(popoverHeaderTitle);
        this.popover.attr("aria-labelledby", popoverLabelElemId);
      }
      this.onShowOverviewFlyout(placement);
      this.popoverEl.on("shown.binf.popover", _.bind(function() {
        this.scrollEle = this.options.originatingView ? this.options.originatingView.$el.find("#results") : this.options.tableView.$el.find("tbody");
        this.scrollEle && this.scrollEle.one("scroll", {
          view: this
        }, this._handleScrollEvent);
        $(document).on("mouseup.popover", {
          view: this
        }, this._handleClickEvent);
        $(this.popoverView.$el.find(".csui-search-cell-value")[0]).prop("tabindex", 0).trigger("focus");
      }, this));
      this.popover.removeClass("binf-invisible");
    },
    onKeyInView: function(event) {
      if (event.keyCode == 32 || event.keyCode == 13) {
        event.preventDefault();
        event.stopPropagation();
        var popoverE1 = $(event.target).find(".csui-count");
        this.openPopover(event, popoverE1);
      }
    },
    onFocus: function(event) {
      if (!!this.$el.find(".csui-count").length) {
        var textWrapper = this.$el.find(".csui-table-search-cell-text");
        textWrapper.attr("tabindex", 0);
        textWrapper.focus();
        event.preventDefault();
        event.stopPropagation();
      }
    },
    onBlur: function() {
      this.$el.find(".csui-table-search-cell-text").attr("tabindex", -1);
    },
    onRender: function() {
      if (this.collection) {
        var textWrapper = this.$el.find(".csui-table-search-cell-text"), value = this.collection.length > 1 ? _.str.sformat(lang.searchCellTooltip, this.formattedValue, this.collection.length - 1) : this.formattedValue;
        textWrapper.attr("role", "button");
        textWrapper.attr("aria-label", value);
        this.el.setAttribute("title", value);
      } else if (!!this.formattedValue) {
        this.el.setAttribute("aria-label", this.formattedValue);
        this.el.setAttribute("title", this.formattedValue);
      }
    },
    closePopover: function(view) {
      view = view ? view : this;
      this.popover.addClass("binf-hidden");
      this.popoverEl.binf_popover("destroy");
      if (view.popoverView) {
        view.popoverView.destroy();
      }
    },
    _handleClickEvent: function(event) {
      if (!$(event.target).closest(".binf-popover").length) {
        var view = event.data.view;
        $(document).off("mouseup.popover", this._handleClickEvent);
        view.closePopover(event.data.view);
      }
    },
    _handleScrollEvent: function(event) {
      var self = event.data.view;
      if ($(event.target).find(".binf-popover").length) {
        self && self.closePopover();
      }
    },
    onShowOverviewFlyout: function(placement) {
      var flyOutTarget = this.popoverEl, headerEleSelector = StartPageView.useV2AppHeader ? "otc-header-bar" : "nav.csui-navbar", popoverContainer = flyOutTarget.parent().find(".binf-popover"), popoverArrowEl = popoverContainer.find(".binf-arrow"), popoverArrowWidth = parseInt(popoverArrowEl.css("border-top-width")), popoverArrowTop = parseInt(popoverArrowEl.css("top")), navBarHeight = $(headerEleSelector).length ? $(headerEleSelector).innerHeight() : $(".binf-nav").parents("nav") && $(".binf-nav").parents("nav").length ? $(".binf-nav").parents("nav").innerHeight() : $("otc-header-bar").length ? $("otc-header-bar").innerHeight() : 0, flyOutTopPosition;
      flyOutTopPosition = flyOutTarget.offset().top - (navBarHeight + parseInt(popoverArrowEl.css("top"))) + popoverArrowWidth / 2;
      if (flyOutTopPosition < navBarHeight) {
        flyOutTopPosition = navBarHeight;
        popoverArrowTop = flyOutTarget.offset().top - (navBarHeight + flyOutTopPosition);
      }
      var perspectivePanel = $(".cs-perspective-panel"), perspectivePanelClientTop = perspectivePanel.length > 0 ? perspectivePanel[0].getBoundingClientRect().top : 0;
      if (base.isIE11()) {
        flyOutTopPosition = flyOutTarget[0].getBoundingClientRect().top - parseInt(popoverArrowEl.css("top")) + popoverArrowWidth;
        popoverArrowTop = flyOutTarget.offset().top - flyOutTopPosition + (perspectivePanelClientTop - navBarHeight) + popoverArrowWidth / 2;
      }
      if (base.isAppleMobile()) {
        const searchToolContainer = $(".csui-search-tool-container");
        const searchToolTopPosistion = searchToolContainer[0].getBoundingClientRect().top;
        if (!searchToolContainer.hasClass("binf-hidden") && flyOutTopPosition < searchToolTopPosistion) {
          flyOutTopPosition = searchToolContainer[0].getBoundingClientRect().top;
          popoverArrowTop = flyOutTarget.offset().top - (navBarHeight + flyOutTopPosition);
        }
        popoverContainer.css({
          "-webkit-transform": "translateZ(10px)"
        });
      }
      popoverContainer.css({
        position: "fixed",
        top: flyOutTopPosition
      });
      popoverArrowEl.css("top", popoverArrowTop);
      const closestRow = popoverContainer.closest("td").length ? popoverContainer.closest("td") : popoverContainer.closest(".binf-list-group-item");
      if (closestRow.length > 0) {
        let flyOutLeft;
        const boundingClientDetailsOfCountSpan = closestRow[0].querySelector("span.csui-count")?.getBoundingClientRect();
        if (placement === "left") {
          flyOutLeft = parseFloat(boundingClientDetailsOfCountSpan.left - popoverContainer.width() - popoverArrowWidth / 2);
        } else {
          flyOutLeft = parseFloat(boundingClientDetailsOfCountSpan.right + popoverArrowWidth);
        }
        popoverContainer.css({
          right: "auto",
          left: flyOutLeft
        });
      }
    },
    getValueData: function() {
      var columnValuesCount, columnValues = "";
      if (!!this.columnValues) {
        columnValuesCount = this.columnValues.values.length;
        this.collection = this.columnValues && this._createCollection();
      }
      if (this.columnValues && this.columnValues.values.length > 0) {
        this.columnValues.values.forEach(function(column, index) {
          if (index === columnValuesCount - 1) {
            columnValues += column.value_formatted || column.value;
          } else {
            columnValues += (column.value_formatted || column.value) + ";  ";
          }
        });
      }
      if (this.options.tableView?.collection?.enablePinnedColumnsView && this.formattedValue?.length > 256) {
        this.trimmedText = `${this.formattedValue.substring(0, 256)}...`;
      }
      return {
        formattedValue: this.trimmedText || this.formattedValue,
        formattedValueForExpandView: columnValuesCount ? columnValues : this.formattedValue,
        value: this.collection?.length > 1 ? _.str.sformat(lang.searchCellTooltip, this.formattedValue, this.collection.length - 1) : this.formattedValue,
        count: columnValuesCount && columnValuesCount - 1,
        collection: this.collection
      };
    }
  }, {
    columnClassName: "csui-table-search-cell",
    hasFixedWidth: false
  });
  return SearchCellView;
});