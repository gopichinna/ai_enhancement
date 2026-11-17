/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "csui/controls/tile/behaviors/infinite.scrolling.behavior", "csui/controls/form/pub.sub", "dctmw/utils/utils", "dctmw/utils/dctmw.datasource.utils", "i18n!dctmw/controls/form/impl/nls/lang", "dctmw/controls/form/fields/models/field.option", "dctmw/controls/form/fields/listfieldview/dctmwlistfieldoptionsitem.view", "hbs!dctmw/controls/form/impl/dctmwlist/dctmwlistfieldoptions.view" ], function(_, $, Backbone, Marionette, PerfectScrollingBehavior, InfiniteScrollingBehavior, PubSub, utils, DctmwDataSourceUtils, Lang, FieldOptionModel, OptionsItemView, OptionsViewTemplate) {
  "use strict";
  return Marionette.CompositeView.extend({
    childView: OptionsItemView,
    childViewContainer: ".dctmw-listfield-options",
    childViewOptions: function() {
      return {
        parentView: this
      };
    },
    template: OptionsViewTemplate,
    className: "dctmw-listfield-options-wrapper",
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: "> .dctmw-listfield-options",
        suppressScrollX: true
      },
      InfiniteScrolling: {
        behaviorClass: InfiniteScrollingBehavior,
        contentParent: "ul.dctmw-listfield-options",
        content: "ul.dctmw-listfield-options>li:visible"
      }
    },
    ui: {
      options: ".dctmw-listfield-options",
      addNewOption: ".dctmw-add-new-option",
      noneOption: ".dctmw-none-item",
      noneIconContainer: ".dctmw-none-item .dctmw-listfield-icon-container",
      dropDownSearchResultCount: ".dctmw-searchResultCountDetails",
      lazyloader: ".dctmw-lazy-loading",
      selectAllOption: ".dctmw-select-all-item",
      staticOptions: ".dctmw-listfield-options-static",
      noneItem: ".none-item-option",
      selectAllItem: ".select-all-item-option"
    },
    events: {
      "mousedown @ui.addNewOption": "onClickAddOption",
      "keydown @ui.addNewOption": "onKeyDownAddOption",
      "mousedown @ui.noneOption": "onClickNoneOption",
      "keydown @ui.noneOption": "onKeyDownNoneOption",
      "click .csui-search": "showInputField",
      "click @ui.searchClearIcon": "clearSearchText",
      "mousedown @ui.selectAllOption": "onClickSelectAllOption",
      "keydown @ui.selectAllOption": "onKeyDownSelectAllOption"
    },
    templateHelpers: function() {
      var searchText = utils.sanitizeInputText(this.searchText), label = searchText.length > 0 ? _.str.sformat(Lang.addNewItem, searchText) : Lang.addNew;
      return {
        isEditableList: this.options.isEditableList,
        addNewLabel: label,
        addNewId: _.uniqueId("listitem"),
        noneLabel: Lang.selectFieldDefaultLabel,
        selectAllLabel: Lang.selectAllLabel,
        applyBorderBottom: !this.options.alpacaField?.isRequired()
      };
    },
    constructor: function() {
      this.searchText = "";
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
      this.resultCount = this.collection && this.collection.allModels && this.collection.allModels.length > 0 ? this.collection.allModels.length : null;
      this.listenTo(this.collection, "change:selected", this.updateNoneNode);
      this.listenTo(this.collection, "change:selected", this.updateSelectAllNode);
      this.updateHeight = this.updateHeight.bind(this);
      this.listenTo(this, "render", this.updateHeight);
      this.listenTo(PubSub, "hide:overlay:list", this.deactivateOptions);
      this.selectedCollection = this.options.parentView.selectedCollection;
      this.fieldCollection = this.options.fieldCollection;
      this.listenTo(this.selectedCollection, "update", this.updateSelectedOptions);
    },
    render: function(visible) {
      this._ensureViewIsIntact();
      this._isRendering = true;
      this.resetChildViewContainer();
      this.triggerMethod("before:render", this);
      this._renderTemplate();
      this._renderChildren();
      this._isRendering = false;
      this.isRendered = true;
      this.triggerMethod("render", this, visible);
      return this;
    },
    openSearchView: function(displayView) {
      displayView ? !this.isOpen && this.$el.animate({
        scrollTop: 0
      }, 50) : this.isOpen && this.$el.animate({
        scrollTop: 56
      }, 50);
      this.isOpen = displayView;
    },
    onRender: function(view, visible) {
      this.ui.lazyloader.hide();
      this.updateNoneNode();
      this.updateSelectAllNode();
      if (!visible) {
        this.hideOptions();
      }
    },
    search: function(searchText) {
      if (!this.isVisible()) {
        this.triggerMethod("activate:options");
      }
      if (this.searchText !== searchText) {
        this.ui.dropDownSearchResultCount.removeClass("dctmw-combo-no-result");
        this.triggerMethod("text:search", searchText);
        this.searchText = searchText;
        this.pullData({
          filter: searchText,
          validateSearchText: true
        }).done(_.bind(function() {
          if (this.searchText === searchText) {
            this.filterOptions.call(this, searchText);
          }
        }, this));
      }
    },
    filterOptions: function(searchText) {
      if (searchText.length > 0) {
        searchText = searchText.replace(/[.+^${}()|[\]\\]/g, "\\$&");
        searchText = searchText.replace(/\?/g, ".");
        searchText = searchText.replace(/\*/g, ".*?");
      }
      if (this.options?.showOptionsInHierarchy) {
        this.options.parentView.alreadyVisitedNodes = {};
      }
      this.setOptionsFilter(searchText, "searchText").always(_.bind(function() {
        this.updateSearchResultMessage();
        if (searchText.length > 0) {
          this.ui.noneOption.hide();
        }
        var exactMatches = _.filter(this.collection.allModels, function(model) {
          return model.get("exactMatch") === true;
        });
        if (exactMatches.length === 1) {
          this.ui.addNewOption.hide();
        } else {
          this.ui.addNewOption.show();
        }
        if (this.options?.parentView?.alreadyVisitedNodes) {
          delete this.options.parentView.alreadyVisitedNodes;
        }
      }, this));
    },
    setOptionsFilter: function(searchText) {
      return this.collection.setOptionsFilter(searchText, "searchText").always(() => {
        this.render(true);
      });
    },
    showOptions: function() {
      if (this.isVisible()) {
        return;
      }
      this.$el.removeClass("binf-hide");
      this.$el.addClass("binf-show");
      this.pullData();
      if (this.options.alpacaField && this.options.alpacaField.isRequired()) {
        this.ui.noneOption.hide();
      }
      this.updateHeight();
    },
    deactivateOptions: function() {
      this.triggerMethod("deactivate:options");
      PubSub.trigger("list:options:hide");
      $(window).off("resize.listField", this.updateHeight);
    },
    hideOptions: function() {
      this.searchText = "";
      if (this.collection.allModels && this.collection.allModels.length > 0) {
        this.collection.setOptionsFilter(this.searchText, "searchText");
      }
      this.render(true);
      this.$el.removeClass("binf-show");
      this.$el.addClass("binf-hide");
    },
    setFocus: function() {
      var firstItem = this.children.findByIndex(0) && this.children.findByIndex(0).$el.find("a"), count = 0;
      while (firstItem && !firstItem.is(":visible")) {
        count++;
        firstItem = this.children.findByIndex(count) && this.children.findByIndex(count).$el.find("a");
      }
      if (firstItem) {
        firstItem.attr("tabindex", 0);
        firstItem.trigger("focus");
      } else if (this.ui.noneOption.length && this.ui.noneOption.css("display") !== "none") {
        this.ui.noneOption.find("a") && this.ui.noneOption.find("a").trigger("focus");
      } else if (this.ui.dropDownSearchResultCount.length === 1 && !this.ui.dropDownSearchResultCount.hasClass("binf-hidden")) {
        this.ui.dropDownSearchResultCount.trigger("focus");
      } else if (this.ui.addNewOption.length === 1) {
        this.ui.addNewOption.find("a").trigger("focus");
      }
    },
    isVisible: function() {
      return this.$el.is(":visible");
    },
    enableDisableField: function(enabled) {
      if (!enabled) {
        this.hideOptions();
      }
    },
    onClickAddOption: function(event) {
      event.preventDefault();
      event.stopPropagation();
      var searchText = utils.sanitizeInputText(this.searchText);
      if (searchText.length > 0) {
        var newModel = new FieldOptionModel({
          id: searchText,
          name: searchText,
          uniqueOptionId: _.uniqueId(this.options.alpacaField.name + "_option_")
        });
        this.collection.add(newModel);
        this.fieldCollection.add(newModel.attributes);
        newModel.set("selected", true);
        this.updateSearchResultMessage();
        if (this.options.isEditableList == "false") {
          this.ui.addNewOption.hide();
        }
        this.searchText = "";
      } else {
        this.triggerMethod("activate:typein");
      }
    },
    onKeyDownAddOption: function(event) {
      if (event.keyCode === 13 || event.keyCode === 32) {
        this.onClickAddOption(event);
      }
    },
    onClickNoneOption: function(event) {
      event.preventDefault();
      event.stopPropagation();
      $(this.ui.noneItem).removeAttr("checked");
      this.noneOptionClick = true;
      var someModelsAreNonEmpty = this.collection.allModels.some(function(model) {
        return !model.isEmpty();
      });
      var selectedModels = _.filter(someModelsAreNonEmpty ? this.collection.allModels : this.collection.models, function(model) {
        return model.get("selected") === true;
      });
      if (selectedModels && selectedModels.length > 0) {
        _.each(selectedModels, function(selModel) {
          selModel.set("selected", false);
        });
        this.options.parentView.selectedCollection.reset();
      }
      $(this.ui.selectAllItem).removeAttr("checked");
      $(this.ui.selectAllItem).removeAttr("indeterminate");
      delete this.noneOptionClick;
    },
    onKeyDownNoneOption: function(event) {
      if (event.keyCode === 13 || event.keyCode === 32) {
        this.onClickNoneOption(event);
      }
    },
    onClickSelectAllOption: function(event) {
      event.preventDefault();
      event.stopPropagation();
      this.selectAllOptionClick = true;
      let selectedAttributeNewValue = $(this.ui.selectAllItem)?.attr("checked") ? false : true, modelSelection = this.collection.filters?.searchText ? "filteredModels" : "allModels", models = modelSelection === "filteredModels" ? this.collection.lastFilteredAndSortedModels : this.collection.allModels;
      models = _.filter(models, model => {
        return !model.get("options")?.disabled;
      });
      if (models && models.length > 0) {
        _.each(models, function(model) {
          model.set("selected", selectedAttributeNewValue);
        });
        if (selectedAttributeNewValue) {
          let clonedModels = models.map(model => {
            return model.clone();
          });
          this.options.parentView.selectedCollection.add(clonedModels);
        } else {
          this.options.parentView.selectedCollection.remove(models);
        }
      }
      if (modelSelection === "allModels" && !selectedAttributeNewValue) {
        $(this.ui.noneItem).attr("checked", "");
      }
      delete this.selectAllOptionClick;
    },
    onKeyDownSelectAllOption: function(event) {
      if (event.keyCode === 13 || event.keyCode === 32) {
        this.onClickSelectAllOption(event);
      }
    },
    updateSelectedOptions: function(collection, options) {
      var me = this;
      if (options && options.changes && options.changes.removed && options.changes.removed.length > 0) {
        _.each(options.changes.removed, function(removed) {
          var modelsToCheck = me.options.isEditableList ? _.union(me.collection.models, me.collection.allModels) : me.collection.allModels;
          var removedOption = _.find(modelsToCheck, function(model) {
            return removed.get("id") === model.get("id");
          });
          if (removedOption) {
            removedOption.set("selected", false);
          }
        });
      }
    },
    updateNoneNode: function() {
      var allModelsIsEmpty = this.collection.allModels.every(function(model) {
        return Object.keys(model.attributes).length === 0;
      });
      var selectedModels = _.filter(allModelsIsEmpty ? this.collection.models : this.collection.allModels, function(model) {
        return model.get("selected") === true;
      });
      if (!this.noneOptionClick) {
        if (selectedModels.length === 0) {
          $(this.ui.noneItem).attr("checked", "");
        } else {
          $(this.ui.noneItem).removeAttr("checked");
        }
      }
    },
    updateSelectAllNode: function() {
      let allModels = this.collection.filters?.searchText ? this.collection.lastFilteredAndSortedModels : this.collection.allModels;
      allModels = _.filter(allModels, model => {
        return !model.get("options")?.disabled;
      });
      let allModelsLength = allModels.length, totalSelectedModels = _.filter(allModels, model => {
        return !model.get("options")?.disabled && model.get("selected") === true;
      });
      if (!this.selectAllOptionClick) {
        if (totalSelectedModels.length !== 0 && totalSelectedModels.length >= allModelsLength) {
          $(this.ui.selectAllItem).attr("checked", "");
        } else {
          $(this.ui.selectAllItem).removeAttr("checked");
        }
        if (totalSelectedModels.length > 0 && totalSelectedModels.length < allModelsLength) {
          $(this.ui.selectAllItem).attr("indeterminate", "");
        } else {
          $(this.ui.selectAllItem).removeAttr("indeterminate");
        }
      }
    },
    updateHeight: function() {
      let optionItemViewHeight = this.optionItemViewHeight || this.ui.noneOption.outerHeight();
      const height = this.options.rows * optionItemViewHeight;
      if (height > 0) {
        this.ui.options.css("height", height);
        this.triggerMethod("ensure:scrollbar");
        this.triggerMethod("update:scrollbar");
      }
    },
    pullData: function(options) {
      options = _.extend({
        view: this.options.parentView,
        filter: ""
      }, options);
      var dfd = $.Deferred(), doUpdateCollection;
      this.ui.dropDownSearchResultCount.addClass("binf-hidden");
      if (DctmwDataSourceUtils.isAsynchronousDataSourceField(this.options.alpacaField) && (this.options.async === true || this.options.alpacaField.options.ds.dependencies && this.options.alpacaField.options.ds.dependencies.length !== 0) && (!_.isUndefined(this.options.alpacaField.options.ds.url) || _.isFunction(this.options.alpacaField.options.ds.getDataSource) || this.options.alpacaField.options.ds["assistance_type"] === "custom")) {
        this.ui.lazyloader.show();
        this.ui.staticOptions.hide();
        this.ui.options.hide();
        this.ui.addNewOption.hide();
        this.options.alpacaField.pullData(options).done(_.bind(function(response) {
          doUpdateCollection = _.isEmpty(options.filter) || !options.validateSearchText || options.validateSearchText && options.filter === this.searchText;
          if (doUpdateCollection) {
            var collectionData = _.map(response, function(model) {
              if (model.get("name") !== "") {
                return model.attributes;
              }
            });
            this.collection.hasMoreRecords = this.fieldCollection.hasMoreRecords;
            this.collection.populate(collectionData, {
              reset: true
            }).done(_.bind(function() {
              this.fieldCollection.reset(response);
              this.options.selected.each(function(selectedModel) {
                var selId = selectedModel.get("id");
                var mdl = _.find(this.collection.allModels, function(model) {
                  return model.get("id") === selId;
                });
                if (mdl) {
                  mdl.set("selected", true);
                } else {
                  this.fieldCollection.add(selectedModel.attributes);
                  this.collection.add(selectedModel.attributes);
                }
              }, this);
              if (_.isEmpty(this.searchText)) {
                this.resultCount = this.collection.allModels.length;
              }
              this.ui.lazyloader.hide();
              this.ui.staticOptions.show();
              this.ui.options.show();
              this.ui.addNewOption.show();
              this.updateSearchResultMessage();
              this.updateHeight();
              this.updateSelectAllNode();
              dfd.resolve(response);
            }, this));
          } else {
            this.updateSelectAllNode();
            dfd.resolve();
          }
        }, this)).fail(_.bind(function(err) {
          this.ui.lazyloader.hide();
          dfd.reject(err);
        }, this));
      } else {
        this.updateSelectAllNode();
        dfd.resolve();
      }
      return dfd.promise();
    },
    updateSearchResultMessage: function() {
      if (this.children.length === 0) {
        this.ui.dropDownSearchResultCount.addClass("dctmw-combo-no-result");
        this.ui.dropDownSearchResultCount.text(Lang.noResultFound);
        this.ui.dropDownSearchResultCount.attr("aria-label", Lang.noResultFound);
        this.ui.dropDownSearchResultCount.removeClass("binf-hidden");
        return;
      } else {
        this.ui.dropDownSearchResultCount.removeClass("dctmw-combo-no-result");
        this.ui.dropDownSearchResultCount.addClass("binf-hidden");
      }
      if (this.showSearchCount || this.options.async) {
        var message, messageLabel;
        if (this.resultCount === null || this.resultCount === undefined) {
          messageLabel = Lang.showingResultsNoTotal;
        } else if (this.collection.hasMoreRecords) {
          messageLabel = Lang.showingHasMore;
        } else {
          messageLabel = Lang.showingResultsOfMatches;
        }
        var matchCount = this.collection.filteredResultCount || this.collection.allModels.length;
        if (_.isEmpty(this.searchText)) {
          message = _.str.sformat(messageLabel, this.resultCount, this.resultCount);
          matchCount = this.collection.hasMoreRecords ? matchCount : 0;
        } else {
          message = _.str.sformat(messageLabel, matchCount, this.resultCount);
        }
        if (matchCount > 0) {
          this.ui.dropDownSearchResultCount.text(message);
          this.ui.dropDownSearchResultCount.attr("aria-label", message);
          this.ui.dropDownSearchResultCount.removeClass("binf-hidden");
        }
      }
    }
  });
});