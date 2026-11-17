/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "d2/utils/constants", "d2/controls/multi.item/impl/item.select.view", "csui/utils/non-emptying.region/non-emptying.region", "i18n!d2/controls/multi.item/impl/nls/lang", "hbs!d2/controls/multi.item.multi.steps/impl/multi.item.multi.steps", "css!d2/controls/multi.item.multi.steps/impl/multi.item.multi.steps" ], function(_, $, Backbone, Marionette, LayoutViewEventsPropagationMixin, constants, ItemSelectView, NonEmptyingRegion, lang, template) {
  "use strict";
  var MultiItemView = Marionette.LayoutView.extend({
    className: "list-selection",
    template: template,
    constructor: function MultiItemView() {
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.propagateEventsToRegions();
      this.index = 0;
      this.modelIndex = 0;
      this.viewMap = {};
    },
    ui: {
      itemDetailsHeader: ".item-details-header",
      itemDetailsHeaderMessage: ".header-message"
    },
    templateHelpers: function() {
      return {
        applytoRemainingFiles: lang.applytoRemainingFiles
      };
    },
    regions: {
      itemSelectRegion: ".list-region",
      itemDetailsRegion: ".item-details-region",
      toggleRegion: ".toggle-region"
    },
    onRender: function() {
      var options = _.extend({
        multiItemView: this
      }, this.options);
      this.itemSelectView = new ItemSelectView(options);
      this.itemSelectRegion.show(this.itemSelectView);
    },
    onBeforeDestroy: function() {
      this.destroyItemDetailsViews();
    },
    nextItem: function() {
      var dfd = $.Deferred();
      this.selectedModel = this.collection.at(this.modelIndex);
      var nextItemView;
      this.index++;
      var stepId = this.selectedModel.get("id");
      if (this.options.itemDetailsViewSteps[stepId][this.index]) {
        this.currentViewId = this.options.itemDetailsViewSteps[stepId][this.index].id;
        this.options?.wizard?.steps && (this.options.wizard.steps[this.options.wizard.currentStep].isPropertyPageType = this.options.itemDetailsViewSteps[stepId][this.index].isPropertyPageType);
        nextItemView = this.itemSelectView.children.findByModel(this.selectedModel);
        this.changeViewInItemDetails(nextItemView, false, false).done(function() {
          dfd.resolve();
        }).fail(dfd.reject);
      } else if (this.collection.at(++this.modelIndex)) {
        var nextModel = this.collection.at(this.modelIndex);
        stepId = nextModel.get("id");
        nextItemView = this.itemSelectView.children.findByModel(nextModel);
        this.index = 0;
        this.currentViewId = this.options.itemDetailsViewSteps[stepId][this.index].id;
        this.options?.wizard?.steps && (this.options.wizard.steps[this.options.wizard.currentStep].isPropertyPageType = this.options.itemDetailsViewSteps[stepId][this.index].isPropertyPageType);
        this.changeViewInItemDetails(nextItemView, true, false).done(function() {
          dfd.resolve();
        }).fail(dfd.reject);
      } else {
        this.options.parent.trigger("multi.item:submit");
      }
      return dfd.promise();
    },
    previousStep: function() {
      var dfd = $.Deferred(), prevItemView;
      var selectedModel = this.collection.at(this.modelIndex);
      this.index--;
      var stepId = selectedModel.get("id");
      var prevModelIndex = this.modelIndex - 1;
      if (this.options.itemDetailsViewSteps[stepId][this.index]) {
        this.currentViewId = this.options.itemDetailsViewSteps[stepId][this.index].id;
        this.options?.wizard?.steps && (this.options.wizard.steps[this.options.wizard.currentStep].isPropertyPageType = this.options.itemDetailsViewSteps[stepId][this.index].isPropertyPageType);
        prevItemView = this.itemSelectView.children.findByModel(selectedModel);
        this.changeViewInItemDetails(prevItemView, false, false).done(function() {
          dfd.resolve();
        }).fail(dfd.reject);
      } else if (this.collection.at(prevModelIndex)) {
        --this.modelIndex;
        var prevModel = this.collection.at(this.modelIndex);
        stepId = prevModel.get("id");
        prevItemView = this.itemSelectView.children.findByModel(prevModel);
        var checkStatus = this.checkItemStatus(true);
        if (checkStatus) {
          this.index = this.options.itemDetailsViewSteps[stepId].length - 1;
        } else {
          this.index = 0;
        }
        this.currentViewId = this.options.itemDetailsViewSteps[stepId][this.index].id;
        this.options?.wizard?.steps && (this.options.wizard.steps[this.options.wizard.currentStep].isPropertyPageType = this.options.itemDetailsViewSteps[stepId][this.index].isPropertyPageType);
        this.changeViewInItemDetails(prevItemView, true, false).done(function() {
          dfd.resolve();
        }).fail(dfd.reject);
      }
      return dfd.promise();
    },
    showFirstItem: function() {
      var firstModel = this.collection.at(0);
      var firstItemView = this.itemSelectView.children.findByModel(firstModel);
      this.isFirstItem = true;
      this.options?.wizard?.steps && (this.options.wizard.steps[this.options.wizard.currentStep].isPropertyPageType = this.options.itemDetailsViewSteps[firstModel.get("id")][this.index].isPropertyPageType);
      this.changeViewInItemDetails(firstItemView, false, false);
      return firstItemView;
    },
    changeViewInItemDetails: function(itemView, validateItem, updateIndex) {
      var dfd = $.Deferred(), self = this;
      var itemDetailsViewObject = this._getItemDetailsView(itemView, updateIndex);
      this.currentItemDetailsView = itemDetailsViewObject.view;
      if (this.currentItemDetailsView) {
        this.currentItemDetailsView.listenTo(this.currentItemDetailsView, "d2:metadata:formFieldChange", function() {
          this.updateNodeStatus(this.currentItemDetailsView.getItemModel(), constants.ItemStates.NOT_VALIDATED);
          this.options.parent.trigger("multi.item:validation", false);
        }.bind(this));
      }
      self.changeItem(itemView, itemDetailsViewObject.renderView);
      this.options.parent.trigger("multi.item:change");
      dfd.resolve();
      return dfd.promise();
    },
    changeSelectedItem: function(itemView) {
      if (this.currentItemDetailsView && _.isEqual(this.currentItemDetailsView.getItemModel && this.currentItemDetailsView.getItemModel(), itemView.model)) {
        return false;
      }
      return true;
    },
    changeItem: function(itemView, renderView) {
      this.itemSelectView.highlightSelectedView(itemView);
      this.showItemPosition(itemView);
      var regionShowOptions = {
        preventDestroy: true,
        forceShow: true,
        render: renderView
      };
      if (itemView.model.get("itemState") !== constants.ItemStates.VALIDATED) {
        this.updateNodeStatus(itemView.model, constants.ItemStates.NOT_VALIDATED);
      }
      this.currentItemDetailsView.triggerMethod("step:before:active");
      this.itemDetailsRegion.show(this.currentItemDetailsView, regionShowOptions);
    },
    updateNodeStatus: function(node, status) {
      node && node.set("itemState", status);
    },
    validate: function() {
      if (this.currentItemDetailsView && this.currentItemDetailsView.validate) {
        if (!this.currentItemDetailsView.validate()) {
          this.updateNodeStatus(this.currentItemDetailsView.getItemModel(), constants.ItemStates.NOT_VALIDATED);
          this.options.parent.trigger("multi.item:validation", false);
          return false;
        } else {
          this.updateNodeStatus(this.currentItemDetailsView.getItemModel(), constants.ItemStates.VALIDATED);
          this.options.parent.trigger("multi.item:validation", true);
          return true;
        }
      }
      return true;
    },
    checkItemStatus: function(includeCurrentItem) {
      var returnFlag = true;
      try {
        var currIndex = this.modelIndex;
        this.itemSelectView.children.each(function(node, index) {
          var condition = includeCurrentItem ? index <= currIndex : index < currIndex;
          if (condition) {
            var model = node.model;
            if (model.get("itemState") !== constants.ItemStates.VALIDATED) {
              throw "invalidated";
            }
          }
        });
      } catch (ex) {
        returnFlag = false;
      }
      return returnFlag;
    },
    destroyItemDetailsViews: function() {
      var self = this;
      _.keys(this.viewMap).forEach(function(item) {
        var views = self.viewMap[item];
        views.forEach(function(view) {
          view.destroy();
        });
      });
    },
    showItemPosition: function(item) {
      if (this.options.parent) {
        var index = this.collection.indexOf(item.model);
        var filePositionMessage = _.str.sformat(lang.filePositionMessage, index + 1, this.collection.length);
        this.options.parent.updateFilePosition && this.options.parent.updateFilePosition(filePositionMessage);
      }
    },
    _getItemDetailsView: function(item, updateIndex) {
      var view;
      var id = item.options.model.get("id");
      var renderView = false;
      if (_.isUndefined(updateIndex) && item.options.model !== item.options.collection.at(this.modelIndex)) {
        this.index = 0;
        this.modelIndex = this.options.collection.indexOf(item.options.model);
      }
      if (this.viewMap[id] && this.viewMap[id][this.index]) {
        view = this.viewMap[id][this.index];
      } else if (this.options.itemDetailsViewSteps[id]) {
        var optionsForView = this.options.itemDetailsViewSteps[id][this.index]?.viewOptions;
        optionsForView.wizard = this.options.wizard;
        optionsForView.node = item.options.model;
        optionsForView.context = this.options.context;
        view = new this.options.itemDetailsViewSteps[id][this.index].viewClass(optionsForView);
        if (this.viewMap[id]) {
          this.viewMap[id].push(view);
        } else {
          var stepView = [];
          stepView.push(view);
          this.viewMap[id] = stepView;
        }
        renderView = true;
      }
      return {
        view: view,
        renderView: renderView
      };
    },
    getIndexValue: function() {
      return this.index;
    },
    getModelIndex: function() {
      return this.modelIndex;
    },
    getSelectedModel: function() {
      return this.collection.at(this.modelIndex);
    },
    getPrevButtonToolTip: function() {
      var selectedModel = this.collection.at(this.modelIndex);
      var stepId = selectedModel.get("id");
      if (!_.isEmpty(this.viewMap) && this.viewMap[stepId][this.index - 1]) {
        return this.viewMap[stepId][this.index - 1].getTitle && this.viewMap[stepId][this.index - 1].getTitle();
      } else if (this.modelIndex - 1 >= 0 && this.collection.at(this.modelIndex - 1)) {
        var prevModel = this.collection.at(this.modelIndex - 1);
        stepId = prevModel.get("id");
        var index = this.options.itemDetailsViewSteps[stepId].length - 1;
        if (this.modelIndex === 0 && index === 0) {
          return "";
        }
        return this.viewMap[stepId][index].getTitle && this.viewMap[stepId][index].getTitle();
      }
    },
    isFinalStep: function() {
      var selectedModel = this.collection.at(this.modelIndex);
      if (_.isUndefined(this.collection.at(this.modelIndex + 1)) && _.isUndefined(this.options.itemDetailsViewSteps[selectedModel.get("id")][this.index + 1])) {
        return true;
      } else {
        return false;
      }
    }
  });
  _.extend(MultiItemView.prototype, LayoutViewEventsPropagationMixin);
  return MultiItemView;
});