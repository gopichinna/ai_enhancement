/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/utils/base", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "csui/controls/form/fields/booleanfield.view", "d2/utils/constants", "d2/controls/multi.item/impl/item.select.view", "i18n!d2/controls/multi.item/impl/nls/lang", "hbs!d2/controls/multi.item/impl/multi.item", "css!d2/controls/multi.item/impl/multi.item" ], function(_, $, Backbone, Marionette, base, LayoutViewEventsPropagationMixin, ToggleSwitchView, constants, ItemSelectView, lang, template) {
  "use strict";
  var MultiItemView = Marionette.LayoutView.extend({
    className: "list-selection",
    template: template,
    constructor: function MultiItemView(options) {
      this._validateOptions(options);
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.propagateEventsToRegions();
      this.viewMap = {};
    },
    ui: {
      itemSelectRegion: ".list-region",
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
      toggleRegion: ".toggle-region",
      singleItemHeaderDetailsRegion: ".single-item-details-region"
    },
    onRender: function() {
      var options = _.extend({
        multiItemView: this
      }, this.options);
      this.itemSelectView = new ItemSelectView(options);
      this.itemSelectRegion.show(this.itemSelectView);
      this.listenTo(this, "dom:refresh", () => {
        this.showItemDetailsInHeader(options);
      });
    },
    showBannerOnTopForSingleItem: function(options) {
      if (this.options.showBannerForSingleItem) {
        this.ui.itemDetailsHeader.addClass("single-item");
        this.singleItemSelectView = new ItemSelectView(options);
        this.singleItemHeaderDetailsRegion.show(this.singleItemSelectView);
      }
    },
    showItemDetailsInHeader: function(options) {
      const hideMultiItemView = _.isFunction(this.options.hideMultiItemView) ? this.options.hideMultiItemView() : false;
      if (hideMultiItemView) {
        this.ui.itemSelectRegion.addClass("binf-hidden");
        this.showBannerOnTopForSingleItem(options);
      } else {
        this.ui.itemSelectRegion.hasClass("binf-hidden") && this.ui.itemSelectRegion.removeClass("binf-hidden");
        this.ui.itemDetailsHeader.removeClass("single-item");
        this.singleItemHeaderDetailsRegion.empty();
      }
    },
    updateAllItemState: function(state, targetState) {
      this.collection.each(function(model) {
        if (targetState) {
          if (targetState !== model.get("itemState")) {
            return;
          }
        }
        model.set("itemState", state);
      });
    },
    onBeforeDestroy: function() {
      this.destroyItemDetailsViews();
    },
    _validateOptions: function(options) {
      if (!options.modelKey) {
        throw Error("Model Key View is undefined");
      }
      if (!options.parent) {
        throw Error("Parent View is undefined");
      }
      if (!options.itemDetailsViewClass) {
        throw Error("Item Details View Class is undefined");
      }
    },
    nextItem: function() {
      var dfd = $.Deferred();
      var index = this.collection.models.indexOf(this.currentItemDetailsView.getItemModel());
      index++;
      if (index < this.collection.length) {
        var nextModel = this.collection.at(index);
        var nextItemView = this.itemSelectView.children.findByModel(nextModel);
        this.changeViewInItemDetails(nextItemView, true).done(function() {
          dfd.resolve();
        }).fail(dfd.reject);
      } else {
        dfd.reject();
      }
      return dfd.promise();
    },
    selectItemByModel: function(model) {
      var dfd = $.Deferred();
      var itemView = this.itemSelectView.children.findByModel(model);
      this.changeViewInItemDetails(itemView, true).done(function() {
        dfd.resolve();
      }).fail(dfd.reject);
      return dfd.promise();
    },
    getSelectedItemModel: function() {
      var itemModel;
      if (this.currentItemDetailsView && this.currentItemDetailsView.getItemModel) {
        itemModel = this.currentItemDetailsView.getItemModel();
      }
      return itemModel;
    },
    getCurrentItemDetailsView: function() {
      return this.currentItemDetailsView;
    },
    showFirstItem: function() {
      var firstModel = this.collection.at(0);
      var firstItemView = this.itemSelectView.children.findByModel(firstModel);
      this.changeViewInItemDetails(firstItemView, false);
      return firstItemView;
    },
    validate: function() {
      var deferred = $.Deferred(), currentItemDetailsView = this.currentItemDetailsView;
      if (currentItemDetailsView) {
        currentItemDetailsView.validate().done(function(isValid) {
          var state = isValid ? constants.ItemStates.VALIDATED : constants.ItemStates.NOT_VALIDATED;
          this.updateNodeStatus(currentItemDetailsView.getItemModel(), state);
          this.options.parent.trigger("multi.item:validation", isValid);
          deferred.resolve(isValid);
        }.bind(this));
      } else {
        deferred.resolve(true);
      }
      return deferred;
    },
    getPreviousItems: function() {
      var currentIndex = this.collection.models.indexOf(this.currentItemDetailsView.getItemModel());
      return this.collection.models.slice(0, currentIndex);
    },
    getRemainingItems: function() {
      var currentIndex = this.collection.models.indexOf(this.currentItemDetailsView.getItemModel());
      return this.collection.models.slice(currentIndex + 1, this.collection.models.length);
    },
    validateSelectedItem: function() {
      var deferred = $.Deferred();
      this.validate().done(function(isValid) {
        if (isValid) {
          this._updateSelectedItemData();
        }
        deferred.resolve(isValid);
      }.bind(this));
      return deferred;
    },
    changeSelectedItem: function(itemView) {
      if (this.currentItemDetailsView && _.isEqual(this.currentItemDetailsView.getItemModel(), itemView.model)) {
        return false;
      }
      return true;
    },
    changeViewInItemDetails: function(itemView, validateItem) {
      var dfd = $.Deferred(), self = this, currentItemDetailsView = this.currentItemDetailsView;
      if (validateItem) {
        if (!this.changeSelectedItem(itemView)) {
          return dfd.reject();
        }
        this.validate().done(function(isValid) {
          if (!isValid) {
            dfd.reject();
            return;
          }
          this._updateSelectedItemData(currentItemDetailsView);
        }.bind(this));
      }
      var itemDetailsViewObject = this._getItemDetailsView(itemView);
      this.currentItemDetailsView = itemDetailsViewObject.view;
      if (this.currentItemDetailsView.fetchRequiredData) {
        this.currentItemDetailsView.fetchRequiredData().done(function() {
          self.changeItem(itemView, itemDetailsViewObject.renderView);
          dfd.resolve();
        }).fail(dfd.reject);
      } else {
        self.changeItem(itemView, itemDetailsViewObject.renderView);
        dfd.resolve();
      }
      return dfd.promise();
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
      this.itemDetailsRegion.show(this.currentItemDetailsView, regionShowOptions);
      this.currentItemDetailsView.trigger("multi.item:change");
      this.currentItemDetailsView.trigger("d2:sync:layout");
      this.options.parent.trigger("multi.item:change");
    },
    destroyItemDetailsViews: function() {
      var self = this;
      _.keys(this.viewMap).forEach(function(item) {
        var view = self.viewMap[item];
        view.destroy();
      });
    },
    showItemPosition: function(item) {
      if (this.options.parent) {
        var index = this.collection.indexOf(item.model);
        var filePositionMessage = _.str.sformat(lang.filePositionMessage, index + 1, this.collection.length);
        this.options.parent.updateFilePosition(filePositionMessage);
      }
    },
    getItemSelectView: function() {
      return this.itemSelectView;
    },
    updateNodeStatus: function(node, status) {
      node.set("itemState", status);
    },
    showHeaderMessage: function(message) {
      this.ui.itemDetailsHeaderMessage.html(message);
    },
    getViewMap: function() {
      return this.viewMap;
    },
    removeCopyReference: function() {
      this.collection.each(function(itemModel) {
        if (itemModel.copyReference) {
          delete itemModel.copyReference;
        }
      });
    },
    updateReorderState: function() {
      this.itemSelectView.updateReorderState();
    },
    _getItemDetailsView: function(item) {
      var view;
      var renderView = false;
      var id = item.model.cid;
      if (this.viewMap[id]) {
        view = this.viewMap[id];
      } else {
        var options = item.options.itemOptions;
        options[item.options.modelKey] = item.options.model;
        options.context = this.options.context;
        view = new this.options.itemDetailsViewClass(options);
        this.viewMap[id] = view;
        renderView = true;
      }
      return {
        view: view,
        renderView: renderView
      };
    },
    _updateSelectedItemData: function(currentItemDetailsView) {
      currentItemDetailsView = currentItemDetailsView || this.currentItemDetailsView;
      if (currentItemDetailsView && currentItemDetailsView.updateModelData) {
        currentItemDetailsView.updateModelData(this?.options?.fullForm);
      }
    }
  });
  _.extend(MultiItemView.prototype, LayoutViewEventsPropagationMixin);
  return MultiItemView;
});