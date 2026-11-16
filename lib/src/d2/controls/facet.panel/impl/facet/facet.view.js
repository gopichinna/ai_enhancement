/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/backbone", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "csui/models/facettopics", "nuc/utils/log", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "d2/controls/facet.panel/impl/facet/facet.key.navigation", "d2/controls/facet.panel/impl/facet/facet.item.view", "d2/controls/facet.panel/impl/facet/facet.date.item.view", "d2/utils/constants", "d2/utils/facet.utils", "hbs!d2/controls/facet.panel/impl/facet/facet", "i18n!d2/controls/facet.panel/impl/nls/lang", "css!d2/controls/facet.panel/impl/facet/facet" ], function(module, Backbone, _, $, Marionette, FacetTopicCollection, log, TabableRegionBehavior, KeyEventNavigation, FacetItemView, FacetDateItemView, constants, facetUtils, template, lang) {
  const MIN_ITEMS_TO_SHOW = 5, LIMITED_TOPIC_THRESHOLD = 30;
  var FacetView;
  FacetView = Marionette.CompositeView.extend({
    childView: FacetItemView,
    template: template,
    className: function() {
      return "d2-facet " + this.model.get("id");
    },
    childViewContainer: ".cs-filter-group",
    rootid: "ROOT",
    ui: {
      facetContent: ".d2-facet-content",
      facetHeader: ".d2-facet-header",
      facetHeaderIcon: ".d2-facet-header > .cs-icon",
      facetHeaderLabel: ".d2-facet-header > .header-label",
      facetCount: ".d2-facet-header > .header-count",
      facetCollapseControls: ".d2-facet-collapse-controls",
      facetMoreText: ".d2-more-text",
      facetMoreIcon: ".d2-filter-more .cs-icon",
      facetMore: ".d2-filter-more",
      facetSearch: ".d2-facet-search",
      facetSearchIcon: ".d2-facet-search-icon",
      facetSearchNoResults: ".d2-facet-noresults",
      selectCount: ".header-count",
      clearer: ".sbclearer",
      searchInput: ".d2-facet-search-input"
    },
    childEvents: {
      "show:more": "onShowMore",
      "show:less": "onShowLess",
      "single:filter:select": "onSingleFilterSelect",
      "multi:filter:select": "onMultiFilterSelect",
      "multi:filter:unselect": "onMultiFilterUnselect"
    },
    events: {
      "click .d2-facet-header .icon-expandArrowUp": "onToggleFacet",
      "click .d2-facet-header .icon-expandArrowDown": "onToggleFacet",
      "click .d2-facet-header .d2-facet-search-icon": "onSearchClick",
      "click @ui.clearer": "searchFieldClearerClicked",
      "paste @ui.searchInput": "srchInputChanged",
      "keyup @ui.searchInput": "srchInputChanged",
      mouseleave: "onMouseLeave",
      keydown: "onKeyInView",
      "focus @ui.searchInput": "onSearchFocus",
      "focusout @ui.searchInput": "onSearchFocusOut"
    },
    templateHelpers: function() {
      var moreLabel = this.showAll ? lang.showLess : lang.showMore, moreFiltersAria = this.showAll ? lang.showLessAria : lang.showMoreAria, isFacetCollapsed = this.model.get("collapsed");
      return {
        more: this.collection.length > this.itemsToShowDefault ? moreLabel : undefined,
        moreFiltersAria: moreFiltersAria,
        "more-icon": this.showAll ? "icon-expandArrowUp" : "icon-expandArrowDown",
        "show-controls": this.selectedModels.length > 0 ? "d2-multi-select" : "",
        "show-content": isFacetCollapsed ? "binf-hidden" : "",
        showFacetAria: isFacetCollapsed ? lang.showFacetAria : lang.hideFacetAria,
        listboxAria: lang.filterOptions
      };
    },
    childViewOptions: function() {
      function getShowOnHover(collection) {
        var checkedItems = collection.filter(function(data) {
          return data.get("checked") === true;
        });
        return checkedItems.length === 0;
      }
      return {
        showOnHover: this.model.get("type") === "filter" ? false : getShowOnHover(this.collection)
      };
    },
    getChildView: function(child) {
      if (child.get("facet-item-view") === "date_item_view") {
        return FacetDateItemView;
      } else {
        return Marionette.CompositeView.prototype.getChildView.apply(this, arguments);
      }
    },
    constructor: function FacetView(options) {
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
      this.$el.attr("tabindex", 0);
      this.options = options || {};
      this.collection = this.model.topics;
      this.completemodels = [ ...this.collection.models ];
      this.collection.reset(this.buildLimitedTopics(this.collection.models));
      this.itemsToShowDefault = this.model.get("items-to-show") || constants.SEARCH.ITEMSTOSHOWDEFAULT;
      this.itemsToShow = constants.SEARCH.ITEMSTOSHOW;
      this.searchItemIds = [];
      this.showSearch = !!this.model.get("show-search");
      this.searchShowCount = 25;
      this.showAll = false;
      this.makeLevelMap();
      this.selectedModelsMap = {};
      this.selectedModels = [];
      this.siblingsMap = {};
      this.blockFacetDialog = false;
    },
    constructFilter: function() {
      var facet = this.model, filters = this._getFilterArray();
      this.newFilter = {
        id: facet.get("id"),
        values: filters
      };
    },
    makeLevelMap: function() {
      var map = {};
      var hierarchyDataMap = {};
      var that = this;
      _.each(this.collection.models, function(model) {
        var pid = model.get("parent-id") || that.rootid;
        var id = model.get("id");
        var checked = model.get("checked");
        var idChecked = {
          id: id,
          checked: checked
        };
        if (that.model && that.model.get("id")) {
          model.set("facet-category", that.model.get("id"));
        }
        if (map[pid]) {
          map[pid].push(id);
          hierarchyDataMap[pid].push(idChecked);
        } else {
          if (model.get("parent-id")) {
            model.set("isFirstChild", true);
          }
          map[pid] = [ id ];
          hierarchyDataMap[pid] = [ idChecked ];
        }
      });
      this.levelMap = map;
      this.levelHierarchyDataMap = hierarchyDataMap;
    },
    setSingleSelection: function() {
      var map = this.levelMap;
      var me = this;
      var items = this.$el.find(".d2-facet-item");
      _.each(this.collection.models, function(model) {
        if (model.get("checked") && !model.get("multiselect")) {
          var id = model.get("id");
          var pid = model.get("parent-id");
          var siblings = map[pid || me.rootid];
          items.each(function(index, element) {
            var checkbox = $(this).find(".icon-checkbox");
            if (element.id !== id && _.contains(siblings, element.id)) {
              checkbox.css("visibility", "hidden");
            } else {
              checkbox.addClass("d2-showAlways");
            }
          });
        }
      });
    },
    setMore: function() {
      var map = this.levelMap;
      var showItemMap = this._getLevelShowItemMap();
      var that = this;
      _.each(this.collection.models, function(model) {
        var id = model.get("id"), pid = model.get("parent-id");
        var mapid = pid || that.rootid;
        var levelList = map[mapid];
        var index = levelList.indexOf(id);
        let levelDataMap = that.levelHierarchyDataMap[mapid], lastSelectionIdx = that.isD2FilterItems(that.model) ? -1 : _.findLastIndex(levelDataMap, {
          checked: true
        });
        if (model.get("isFirstChild")) {
          $(that.el).find("#" + facetUtils.escape(id)).addClass("moreheightcategory");
        }
        var facetParentItem;
        if (pid) {
          facetParentItem = that.$el.find("#" + facetUtils.escape(pid) + ".d2-facet-item");
        }
        var facetItem = that.$el.find("#" + facetUtils.escape(id) + ".d2-facet-item");
        if (model.get("checked")) {
          var childItem = $(that.el).find('[id^="' + facetUtils.escape(id) + '"]');
          childItem.addClass("d2-facet-selected");
        }
        var itemToShow = showItemMap[mapid];
        if (that.limitedTopicTracker && that.limitedTopicTracker[pid]) {
          itemToShow = levelList.length;
        } else {
          if (that.levelHierarchyDataMap && that.levelHierarchyDataMap[mapid]) {
            var levelHierarchDataList = that.levelHierarchyDataMap[mapid];
            var itemData = levelHierarchDataList[index];
            if (itemData && index + 1 === itemToShow) {
              if (itemData.checked === true && map[id] && map[mapid].length > 0) {
                showItemMap[mapid] = showItemMap[mapid] + 1;
              }
            }
          }
          itemToShow = showItemMap[mapid];
        }
        if (pid && facetParentItem && facetParentItem.hasClass("binf-hidden") || index >= itemToShow) {
          facetItem.addClass("binf-hidden");
        } else if (index < itemToShow) {
          facetItem.removeClass("binf-hidden");
        }
        if (facetItem.hasClass("ROOT") && _.filter(that.collection.models, function(model) {
          return id === model.get("parent-id");
        }).length === 0) {
          facetItem.addClass("d2-single-facet");
        }
        if (model.get("more-items-count") || index + 1 === itemToShow && levelList.length > itemToShow) {
          var morediv = $(that.el).find("[id='" + "more-" + facetUtils.escape(id) + "']");
          $(morediv[0]).removeClass("binf-hidden");
          $(morediv[0]).parent().addClass("moreheight");
        } else if (levelList.length - 1 === index && levelList.length > that.itemsToShowDefault && levelList.length <= itemToShow) {
          var lessdiv = $(that.el).find("[id='" + "less-" + facetUtils.escape(id) + "']");
          if (lastSelectionIdx < levelList.length - 2) {
            $(lessdiv[0]).removeClass("binf-hidden");
          }
        }
      });
    },
    setLess: function(pid) {
      pid = pid || this.rootid;
      var children = this.levelMap[pid];
      var lastChild = children[children.length - 1];
      var lessdiv = this.$el.find("[id='" + "less-" + facetUtils.escape(lastChild) + "']");
      $(lessdiv).removeClass("binf-hidden");
      $(lessdiv).parent().addClass("moreheight");
    },
    onRemoveFilter: function() {
      this.constructFilter();
      this.trigger("remove:filter");
    },
    onApplyAll: function() {
      this.constructFilter();
      if (this.model.get("type") !== "filter") {
        this.trigger("apply:filter");
      } else {
        this.trigger("apply:d2:filter");
      }
      this.blockFacetDialog = true;
    },
    onAddChild: function(childView) {
      var id = childView.model.get("id");
      var pid = childView.model.get("parent-id") || this.rootid;
      var itemIndex = this.levelMap[pid].indexOf(id);
      if (itemIndex >= this.itemsToShowDefault && !_.contains(this.searchItemIds, id)) {
        var className = pid + " more binf-hidden";
        childView.$el.addClass(className);
      } else {
        childView.$el.addClass(pid);
      }
    },
    onRender: function() {
      if (this.collection.length === 0) {
        this.$el.hide();
      }
      if (this.collection.length < this.searchShowCount && !this.showSearch || this.hasLimitedItemGroup) {
        var facetSearch = this.$el.find(".d2-facet-search");
        facetSearch.addClass("binf-hidden");
      } else {
        this.ui.facetCount.addClass("binf-hidden");
        this.ui.clearer.css("display") !== "none" && this.ui.clearer.toggle();
      }
      if (this.collection.length > 0) {
        $(".d2-facet-content").css("min-height", "");
      } else {
        $(".d2-facet-content").css("min-height", "200px");
      }
      this.$el.attr("aria-label", _.str.sformat(lang.facetTitleAria, this.model.get("name")));
      this.setMore();
      this.setSingleSelection();
      var searchplaceholder = _.str.sformat(lang.searchPlaceholder, this.model.get("name"));
      this.model.set("search_placeholder", searchplaceholder);
      var noresultsdiv = this.ui.facetSearchNoResults;
      noresultsdiv.addClass("binf-hidden");
      this.onShowFacet();
    },
    initialize: function() {
      this.model.on("change", this.render);
    },
    srchInputChanged: function(event) {
      if (event && event.keyCode === 9) {
        return;
      }
      var filter = this.ui.searchInput.val();
      this.filterResults(filter);
    },
    highlightSearchTerm: function(model, filterValue) {
      var itemname = model.get("name");
      var filterValueLowerCase = filterValue.toLowerCase();
      var regEx = new RegExp(filterValueLowerCase, "ig");
      var matches = itemname.match(regEx);
      var highlightedname = itemname;
      if (matches && matches.length > 0) {
        for (var i = 0; i < matches.length; i++) {
          var regex = new RegExp(matches[i], "g");
          highlightedname = highlightedname.replace(regex, "<HH>" + matches[i] + "</HH>");
        }
        model.set("highlightedname", highlightedname);
      }
    },
    resetHighlighting: function() {
      this.completemodels.map(function(model) {
        model.set("highlightedname", model.get("name"));
      });
    },
    filterResults: function(filterValue) {
      var models;
      this.resetHighlighting();
      this.searchItemIds = [];
      var noresultsdiv = this.ui.facetSearchNoResults;
      if (filterValue && filterValue.length > 0) {
        var filteredResult = [];
        for (var key in this.completemodels) {
          if (Object.prototype.hasOwnProperty.call(this.completemodels, key)) {
            var model = this.completemodels[key];
            var id = model.get("id");
            var itemname = model.get("name");
            var filterValueLowerCase = filterValue.toLowerCase();
            if (itemname.toLowerCase().indexOf(filterValueLowerCase) >= 0) {
              this.highlightSearchTerm(model, filterValue);
              this.searchItemIds.push(id);
              var pid = model.get("parent-id");
              var parentModels = [];
              while (pid != null) {
                var pmodel = this.completemodels.find(function(model) {
                  return model.get("id") === pid;
                });
                if (pmodel) {
                  this.highlightSearchTerm(pmodel, filterValue);
                  this.searchItemIds.push(pmodel.get("id"));
                  parentModels.push(pmodel);
                  pid = pmodel.get("parent-id");
                } else {
                  break;
                }
              }
              if (parentModels.length > 0) {
                parentModels.reverse();
                filteredResult = filteredResult.concat(parentModels);
              }
              filteredResult.push(model);
            }
          }
        }
        this.ui.facetMore.addClass("binf-hidden");
        models = filteredResult;
        if (models.length > 0) {
          noresultsdiv.addClass("binf-hidden");
          $(".d2-facet-content").css("min-height", "");
        } else {
          noresultsdiv.removeClass("binf-hidden");
          $(".d2-facet-content").css("min-height", "200px");
        }
        this.trigger("facet:size:change");
        this.collection.reset(models);
        this.$childViewContainer.find(".d2-topic-hidden").each(function(index, item) {
          $(item).removeClass("d2-topic-hidden");
        });
      } else {
        this.ui.facetMore.removeClass("binf-hidden");
        this.resetHighlighting();
        models = this.completemodels;
        noresultsdiv.addClass("binf-hidden");
        this.collection.reset(models);
        this.setMore();
      }
    },
    searchFieldClearerClicked: function() {
      this.onSearchClick();
    },
    clearFilter: function() {
      this.ui.searchInput.val("");
      this.resetHighlighting();
      this.collection.reset(this.completemodels);
      this.setMore();
      if (this.collection.length > 0) {
        $(".d2-facet-content").css("min-height", "");
      } else {
        $(".d2-facet-content").css("min-height", "200px");
      }
    },
    onSingleFilterSelect: function(childView) {
      let model = childView.model;
      this._addToSelectList(model);
      if (this.model.get("type") !== "filter") {
        var id = model.get("id");
        var parentid = model.get("parent-id");
        var siblings = this.levelMap[parentid || this.rootid];
        var items = this.$el.find(".d2-facet-item");
        items.each(function(index, element) {
          var checkbox = $(this).find(".icon-checkbox");
          if (element.id !== id && _.contains(siblings, element.id)) {
            checkbox.css("visibility", "hidden");
          } else {
            checkbox.addClass("d2-showAlways");
          }
        });
      }
      this.onApplyAll();
      this.trigger("update:last:selected", model.get("id"));
    },
    onSearchClick: function(event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      this.showInput = !this.showInput;
      var input = this.$el.find(".d2-facet-search-input");
      var searchicon = this.ui.facetSearchIcon;
      var label = this.ui.facetHeaderLabel;
      var icon = this.ui.facetHeaderIcon;
      var header = this.ui.facetHeader;
      var count = this.ui.facetCount;
      var clearer = this.ui.clearer;
      var noresultsdiv = this.ui.facetSearchNoResults;
      noresultsdiv.addClass("binf-hidden");
      if (this.showInput) {
        searchicon.addClass("searchmoveleft");
        label.addClass("binf-hidden");
        icon.addClass("binf-hidden");
        input.removeClass("binf-hidden");
        input.trigger("focus");
        count.removeClass("binf-hidden");
        header.addClass("open");
        clearer.toggle();
      } else {
        this.clearFilter();
        searchicon.removeClass("searchmoveleft");
        label.removeClass("binf-hidden");
        icon.removeClass("binf-hidden");
        input.addClass("binf-hidden");
        count.addClass("binf-hidden");
        header.removeClass("open");
        clearer.toggle();
      }
    },
    onSearchFocus: function() {
      this.ui.facetHeader.addClass("focussed");
    },
    onSearchFocusOut: function() {
      this.ui.facetHeader.removeClass("focussed");
    },
    onToggleFacet: function(event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      var isFacetCollapsed = this.model.get("collapsed");
      this.model.set("collapsed", !isFacetCollapsed);
      this.onShowFacet();
      this.$el.trigger("focus");
    },
    onShowFacet: function() {
      var isFacetCollapsed = this.model.get("collapsed");
      if (!isFacetCollapsed) {
        this.$el.addClass("facet-items-expanded");
        this.ui.facetContent.removeClass("binf-hidden");
        this.ui.facetCollapseControls.removeClass("multi-select");
        this.ui.facetHeaderIcon[0].className = "cs-icon csui-button-icon icon-expandArrowUp";
        this.ui.facetHeaderIcon[0].setAttribute("aria-label", lang.hideFacetAria);
        this.ui.facetHeaderIcon[0].setAttribute("title", lang.hideFacetAria);
        this.ui.facetCount.addClass("binf-hidden");
        if (this.collection.length >= this.searchShowCount && !this.hasLimitedItemGroup) {
          this.ui.facetSearch.removeClass("binf-hidden");
        }
      } else {
        this.$el.removeClass("facet-items-expanded");
        var numCheckedItems = this.$el.find(".icon-checkbox-selected").length;
        this.model.set("count", numCheckedItems);
        this.ui.facetContent.addClass("binf-hidden");
        this.ui.facetHeaderIcon[0].className = "cs-icon csui-button-icon icon-expandArrowDown";
        this.ui.facetHeaderIcon[0].setAttribute("aria-label", lang.showFacetAria);
        this.ui.facetHeaderIcon[0].setAttribute("title", lang.showFacetAria);
        this.ui.facetSearch.addClass("binf-hidden");
        if (numCheckedItems) {
          this.$el.addClass("multi-select");
          this.ui.facetCount.removeClass("binf-hidden");
        }
      }
      this.trigger("facet:size:change");
    },
    onShowMore: function(childView) {
      if (childView.model.get("more-items-count")) {
        this.showDialog(childView.model, this._filterValue);
        return;
      }
      var that = this;
      childView.$el.find(".more").addClass("binf-hidden");
      childView.$el.removeClass("moreheight");
      var pid = childView.model.get("parent-id") || this.rootid;
      var currentid = childView.model.get("id");
      var indexArr = this.levelMap[pid];
      var currIndex = indexArr.indexOf(currentid);
      var finalIndex = currIndex + this.itemsToShow;
      var finalId = indexArr[finalIndex];
      var checkbox = pid === this.rootid ? this.$el.find("." + facetUtils.escape(pid)) : this.$el.find("[id^='" + facetUtils.escape(pid) + "']");
      checkbox.each(function(i, element) {
        var eid = element.id;
        var index = indexArr.indexOf(eid);
        if (index > currIndex && index <= finalIndex) {
          $(this).removeClass("binf-hidden");
          that._recursiveShow(element.id);
        }
      });
      if (finalIndex + 1 < indexArr.length) {
        var morediv = $(that.el).find("[id='" + "more-" + facetUtils.escape(finalId) + "']");
        morediv.removeClass("binf-hidden");
        morediv.parent().addClass("moreheight");
      } else {
        this.setLess(pid);
      }
      this.trigger("facet:size:change");
    },
    onShowLess: function(childView) {
      childView.$el.find(".less").addClass("binf-hidden");
      var pid = childView.model.get("parent-id");
      var idsArray = this.levelMap[pid || this.rootid];
      let levelDataMap = this.levelHierarchyDataMap[pid || this.rootid], lastSelectionIdx = this.isD2FilterItems(this.model) ? -1 : _.findLastIndex(levelDataMap, {
        checked: true
      });
      var that = this;
      this.children.each(function(view) {
        var id = view.model.get("id"), idx = idsArray.indexOf(id);
        if (idx !== -1) {
          if (idx >= that.itemsToShowDefault && idx > lastSelectionIdx + 1) {
            view.$el.addClass("binf-hidden");
            that._recursiveHide(id);
          }
        }
        var morediv = $(that.el).find("[id='" + "more-" + facetUtils.escape(id) + "']");
        let showMoreElementIdx = Math.max(lastSelectionIdx + 1, that.itemsToShowDefault - 1);
        if (idx === showMoreElementIdx) {
          $(morediv).removeClass("binf-hidden");
          $(morediv).parent().addClass("moreheight");
        }
      });
      this.trigger("facet:size:change");
    },
    _recursiveHide: function(pid) {
      var that = this;
      _.each(this.collection.models, function(model) {
        var id = model.get("id");
        if (id.indexOf(pid) === 0 && id !== pid) {
          that.$el.find("#" + facetUtils.escape(id) + ".d2-facet-item").addClass("binf-hidden");
          that._recursiveHide(id);
        }
      });
    },
    _recursiveShow: function(_id) {
      var map = this.levelMap;
      var that = this;
      _.each(this.collection.models, function(model) {
        var id = model.get("id");
        if (id.indexOf(_id) === 0 && id !== _id) {
          var pid = model.get("parent-id");
          var index = map[pid || that.rootid].indexOf(id);
          var escapedId = facetUtils.escape(id);
          var escapedPid = facetUtils.escape(pid);
          var item = that.$el.find("#" + escapedId);
          if (pid && $("#" + escapedPid).hasClass("binf-hidden")) {
            item.addClass("binf-hidden");
          } else if (index < that.itemsToShowDefault) {
            item.removeClass("binf-hidden");
          }
          if (index === that.itemsToShowDefault) {
            if (!that.$el.find("#less-" + escapedId).hasClass("binf-hidden")) {
              item.removeClass("binf-hidden");
            }
          }
        }
      });
    },
    _getLevelShowItemMap: function() {
      var hierarchtParents = _.keys(this.levelHierarchyDataMap);
      var me = this;
      var levelShowItemMap = {};
      _.each(hierarchtParents, function(parent) {
        var children = me.levelHierarchyDataMap[parent];
        var lastIndex = _.findLastIndex(children, {
          checked: true
        });
        lastIndex = lastIndex + 1;
        var itemsToShow = me.itemsToShowDefault;
        if (lastIndex > me.itemsToShowDefault) {
          var tmp = me.itemsToShowDefault;
          while (tmp < lastIndex) {
            tmp = tmp + me.itemsToShow;
          }
          itemsToShow = tmp;
        }
        levelShowItemMap[parent] = itemsToShow;
      });
      return levelShowItemMap;
    },
    getIndex: function() {
      return this._index;
    },
    onMultiFilterSelect: function(childView) {
      let model = childView.model;
      this.selectMultipleItemsWithModel(model);
      this.trigger("update:last:selected", model.get("id"));
    },
    selectMultipleItemsWithModel: function(models) {
      var checkbox = this.$el.find(".icon-checkbox");
      checkbox.each(function() {
        checkbox.addClass("d2-showAlways");
      });
      models = _.isArray(models) ? models : [ models ];
      models.forEach(model => {
        let selectedModels = [ model ];
        this._selectAllParentModel(model, selectedModels);
        this._addToSelectList(selectedModels);
      });
      this.onApplyAll();
    },
    _selectAllParentModel: function(model, selectedModels) {
      var parent = this.collection.get(model.get("parent-id"));
      if (_.isUndefined(parent) || parent.get("checked")) {
        return;
      } else {
        parent.set("checked", true);
        selectedModels.push(parent);
        this._selectAllParentModel(parent, selectedModels);
      }
    },
    onMultiFilterUnselect: function(childView) {
      let model = childView.model;
      this._onMultiFilterUnselect(model);
      this.trigger("update:last:selected", model.get("id"));
    },
    _onMultiFilterUnselect: function(models) {
      models = _.isArray(models) ? models : [ models ];
      models.forEach(model => {
        let id = model.get("id"), childItem = $(this.el).find('[id^="' + facetUtils.escape(id) + '"]');
        childItem.removeClass("d2-facet-selected");
        this._removeFromSelectList(model);
        model.get("type") !== "filter" && this.trigger("remove:filter");
      });
    },
    _addToSelectList: function(models) {
      models = _.isArray(models) ? models : [ models ];
      models.forEach(model => {
        this.selectedModelsMap[model.get("id")] = model;
        this.selectedModels.push(model);
        var childItem = $(this.el).find('[id^="' + facetUtils.escape(model.get("id")) + '"]');
        childItem.addClass("d2-facet-selected");
      });
    },
    _removeFromSelectList: function(model) {
      var id = model.get("id");
      var topics = this.completemodels;
      var checkbox = this.$el.find(".d2-facet-item");
      let childItemsSet = new Set();
      var childmodels = topics.filter(tModel => {
        let tId = tModel.get("id"), isChild = tId.startsWith(id + constants.SEARCH.TOPIC_SEPARATOR);
        if (isChild) {
          childItemsSet.add(tId);
        }
        return isChild;
      });
      checkbox.each(function(index, element) {
        var eid = $(element).attr("id");
        if (eid && eid.indexOf(id) === 0 && eid !== id) {
          if (childItemsSet.has(eid)) {
            $(element).addClass("binf-hidden");
          }
        }
      });
      var filters = [];
      filters.push({
        id: model.get("value"),
        facetvalue: model.get("facet-value"),
        facetid: model.get("facet-id"),
        parentid: model.get("parent-id"),
        all_versions: model.get("all_versions"),
        type: model.get("type")
      });
      _.each(childmodels, function(item) {
        if (item && item.get("checked")) {
          filters.push({
            id: item.get("value"),
            facetvalue: item.get("facet-value"),
            facetid: item.get("facet-id"),
            parentid: item.get("parent-id"),
            all_versions: item.get("all_versions"),
            type: item.get("type")
          });
        }
      });
      this.newFilter = {
        id: this.model.get("id"),
        values: filters
      };
      this._cleanUpSelectItemsList(childItemsSet, childmodels);
      return filters;
    },
    _cleanUpSelectItemsList: function(subChildItemsSet) {
      this.selectedModels = this.selectedModels?.filter(item => {
        let id = item.get("id");
        delete this.selectedModelsMap[id];
        return !subChildItemsSet.has(id);
      }) || [];
    },
    _getFilterArray: function() {
      var filters = [];
      _.each(this.selectedModelsMap, model => {
        if (model) {
          filters.push({
            id: model.get("id"),
            label: model.get("label"),
            uniqueid: model.get("value"),
            facetvalue: model.get("facet-value"),
            facetid: model.get("facet-id"),
            parentid: model.get("parent-id"),
            all_versions: model.get("all_versions"),
            type: model.get("type")
          });
        }
      });
      return filters;
    }
  });
  _.extend(FacetView.prototype, KeyEventNavigation);
  _.extend(FacetView.prototype, {
    allowLimiting: function(models) {
      return models && !(models.length > 0 && models[0].get("facet-item-view") === "date_item_view");
    },
    buildLimitedTopics: function(models) {
      if (!this.allowLimiting(models)) {
        return models;
      }
      let topicsLevelCompleteCountMap = {}, topicLevelCountTracker = {}, limitedTopicTracker = {}, resultTopicsArr = [], tempLevelItemsTracker = {};
      this.hasLimitedItemGroup = false;
      this.limitedTopicTracker = limitedTopicTracker;
      models.forEach(topic => {
        topicsLevelCompleteCountMap[topic.get("parent-id")] = (topicsLevelCompleteCountMap[topic.get("parent-id")] || 0) + 1;
      });
      models.forEach(topic => {
        let parentId = topic.get("parent-id");
        if (!topicLevelCountTracker[parentId]) {
          topicLevelCountTracker[parentId] = 0;
          tempLevelItemsTracker[parentId] = [];
        }
        let processedLevelCount = topicLevelCountTracker[parentId], actualCount = topicsLevelCompleteCountMap[parentId], doInsert = topic.get("checked") || (actualCount <= LIMITED_TOPIC_THRESHOLD || processedLevelCount < MIN_ITEMS_TO_SHOW), itemsArr = tempLevelItemsTracker[parentId];
        if (!doInsert && itemsArr.length) {
          doInsert = itemsArr.at(-1).get("checked");
        }
        if (doInsert) {
          resultTopicsArr.push(topic);
          tempLevelItemsTracker[parentId].push(topic);
          topicLevelCountTracker[parentId]++;
        }
      });
      Object.keys(tempLevelItemsTracker).forEach(k => {
        let items = tempLevelItemsTracker[k];
        if (topicsLevelCompleteCountMap[k] > LIMITED_TOPIC_THRESHOLD) {
          let topic = items.at(-1);
          this.limitedTopicTracker[topic.get("parent-id")] = true;
          topic?.set("more-items-count", topicsLevelCompleteCountMap[k] - tempLevelItemsTracker[k].length);
          topic?.set("is-last-item", true);
          this.hasLimitedItemGroup = true;
        }
      });
      return resultTopicsArr;
    },
    getSiblings: function(pid) {
      if (!this.siblingsMap[pid]) {
        this.siblingsMap[pid] = this.completemodels.filter(model => model.get("parent-id") === pid);
      }
      return this.siblingsMap[pid];
    },
    filterItems: function(items, idSet) {
      return items.filter(item => idSet.has(item.get("id")));
    },
    isD2FilterItems: function(model) {
      return model.get("type") === "filter";
    },
    showDialog: function(childViewModel) {
      if (this.blockFacetDialog) {
        return;
      }
      let parentId = childViewModel.get("parent-id"), parent = this.collection.get(parentId), children = this.getSiblings(parentId);
      this.blockFacetDialog = true;
      require([ "d2/dialogs/facet.dialog/facet.dialog.view" ], FacetDialog => {
        let facetDialog = new FacetDialog({
          facetModel: this.model,
          items: children,
          fixedPosition: this.model.get("fixed-position"),
          isSingleSelection: !childViewModel.get("multiselect"),
          isRadioSelection: this.isD2FilterItems(childViewModel),
          dialogTitle: childViewModel.get("label") || parent?.get("name") || this.model.get("name")
        });
        facetDialog.openDialog().then(({
          newSelectionIds,
          unSelectionIds
        }) => {
          let newSelectedItems = this.filterItems(children, newSelectionIds), newUnSelectedItems = this.filterItems(children, unSelectionIds);
          newSelectedItems.forEach(item => item.set("checked", true));
          newUnSelectedItems.forEach(item => item.unset("checked"));
          if (newSelectedItems.length) {
            this.selectMultipleItemsWithModel(newSelectedItems);
          }
          this._onMultiFilterUnselect(newUnSelectedItems);
        }, () => {}).finally(() => this.blockFacetDialog = false);
      });
    }
  });
  return FacetView;
});