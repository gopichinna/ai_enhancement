/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/utils/url", "csui/controls/progressblocker/blocker", "csui/dialogs/modal.alert/modal.alert", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "d2/utils/constants", "i18n!d2/dialogs/new.file/impl/nls/lang", "hbs!d2/dialogs/new.file/impl/import.metadata.properties", "css!d2/dialogs/new.file/impl/import.metadata.properties" ], function(require, _, $, Backbone, Marionette, Url, BlockingView, ModelAlert, LayoutViewEventsPropagationMixin, constants, lang, template) {
  "use strict";
  var ImportMetadataPropertiesView = Marionette.LayoutView.extend({
    className: "import-metadata-properties",
    template: template,
    constructor: function ImportMetadataPropertiesView(options) {
      this.context = options.context;
      this.profileData = options.profileData;
      this.wizard = options.wizard;
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.propagateEventsToRegions();
      this.listenTo(this, "multi.item:change", this.onMultiItemChange).listenTo(this, "multi.item:validation", this.onMultiItemValidation).listenTo(this, "metadata:form:validation", this.onFormValidation).listenTo(this, "metadata:form:field:change", this.onFormFieldChange).listenTo(this, "metadata:form:render:validation", this.onFormRenderValidation);
      if (this.wizard) {
        BlockingView.delegate(this, this.wizard);
      } else {
        BlockingView.imbue(this);
      }
      this.enableReorder = true;
    },
    regions: {
      importMetadataRegion: ".import-metadata"
    },
    onStepBeforeActive: function() {
      var selectedFileIds = this.getSelectedFileIds();
      if (this.multiItemView) {
        if (this.profileDataChanged) {
          this.multiItemView.updateAllItemState(constants.ItemStates.NOT_VISITED);
          this.multiItemView.removeCopyReference();
          this.multiItemView.showFirstItem();
          this.multiItemView.updateReorderState();
          this.profileDataChanged = false;
        }
        if (!_.isEqual(selectedFileIds, this.lastSelectedFileIds)) {
          this.multiItemView.removeCopyReference();
          this.multiItemView.showFirstItem();
          this.multiItemView.updateReorderState();
          this.lastSelectedFileIds = selectedFileIds;
        }
      } else {
        this.lastSelectedFileIds = selectedFileIds;
      }
      this.getFooterButtons();
    },
    onRender: function() {
      var me = this;
      this.initWizardAttributes();
      this.initViews().done(views => {
        var options = _.extend({
          itemDetailsViewClass: views.PropertiesView,
          parent: this,
          modelKey: "node",
          enableReorder: this.enableReorder,
          itemOptions: {
            operationType: "import",
            formMode: "create",
            action: "import",
            parent: this,
            wizard: this.wizard
          }
        }, this.options);
        this.multiItemView = new views.MultiItemView(options);
        this.importMetadataRegion.show(this.multiItemView);
        this.listenTo(this.multiItemView, "item:reorder", function() {
          this.updateApplyToRemainingBtnAsUnChecked();
          this.updateFooterButtons();
        });
        me.enableFooter();
      });
      this.listenTo(me.profileData, "change", function() {
        me.collection.each(function(nodeModel) {
          if (nodeModel.has("properties")) {
            nodeModel.unset("properties");
          }
          nodeModel.trigger("refresh:form:model");
        });
        me.profileDataChanged = true;
      });
    },
    initViews: function() {
      let def = $.Deferred();
      require([ "d2/controls/multi.item/multi.item.view", "d2/dialogs/new.file/profile.metadata.properties.view" ], (MultiItemView, ProfileMetadataPropertiesView) => {
        def.resolve({
          MultiItemView: MultiItemView,
          PropertiesView: ProfileMetadataPropertiesView
        });
      });
      return def.promise();
    },
    nextItem: function() {
      this.multiItemView.nextItem();
    },
    next: function() {
      this.multiItemView.validateSelectedItem().done(function(isValid) {
        if (isValid && this.validateAllItems()) {
          this.wizard.nextStep();
        }
      }.bind(this));
    },
    updateFooterButtons: function() {
      this.updateHeaderMessage(false);
      this.validationForFooterButtons();
      this.options.wizard.refreshFooter();
    },
    onFormValidation: function(isValid) {
      if (isValid) {
        this.enableFooter();
      } else {
        this.updateApplyToRemainingBtn();
        this.disableFooter();
      }
    },
    onFormFieldChange: function() {
      this.updateApplyToRemainingBtn();
    },
    onFormRenderValidation: function(isValid) {
      if (isValid) {
        this.enableFooter();
      } else {
        this.disableFooter();
      }
    },
    onMultiItemValidation: function(isValid) {
      if (isValid) {
        this.enableFooter();
      } else {
        this.disableFooter();
      }
    },
    enableFooter: function() {
      var currentNode = this.getCurrentItemModel(), index = this.collection.findIndex(currentNode);
      this.nextFileButtonDisabled = false;
      this.applyRemainingBtnDisabled = false;
      this.validationForFooterButtons(currentNode, index);
      this.options.wizard.refreshFooter();
    },
    disableFooter: function() {
      this.nextButtonDisabled = true;
      this.nextFileButtonDisabled = true;
      this.applyRemainingBtnDisabled = true;
      this.options.wizard.refreshFooter();
    },
    getTitle: function() {
      return lang.propertiesTitle;
    },
    getSubTitle: function() {
      if (!this.subtitle) {
        this.subtitle = "";
      }
      return this.subtitle;
    },
    validateAllItems: function() {
      var invalidItem = this.collection.find(function(item) {
        return item.get("itemState") !== constants.ItemStates.VALIDATED;
      });
      return !invalidItem;
    },
    validateOtherItems: function() {
      var currentNode = this.getCurrentItemModel();
      var invalidItem = this.collection.find(function(item) {
        return currentNode.cid !== item.cid && item.get("itemState") !== constants.ItemStates.VALIDATED;
      });
      return invalidItem ? false : true;
    },
    updateFilePosition: function(filePosition) {
      this.subtitle = filePosition;
      if (this.collection && this.collection.length === 1) {
        this.subtitle = "";
      }
      this.options.wizard.refreshHeader();
    },
    initWizardAttributes: function() {
      this.nextButtonDisabled = true;
      this.nextButtonHidden = false;
      this.nextFileButtonDisabled = true;
      this.nextFileButtonHidden = false;
      this.applyRemainingBtnDisabled = false;
      this.applyRemainingBtnHidden = false;
      this.applyToRemainingCaption = lang.applyToRemainingCaption;
      this.nextFileCaption = lang.nextFileCaption;
    },
    getSelectedFileIds: function() {
      var selectedFileIds = [];
      this.collection.each(function(nodeModel) {
        selectedFileIds.push(nodeModel.cid);
      });
      return selectedFileIds;
    },
    getCurrentItemModel: function() {
      return this.multiItemView.getSelectedItemModel();
    },
    onMultiItemChange: function() {
      this.updateFooterButtons();
      var currentItemModel = this.getCurrentItemModel();
      var copiedNodes = _.select(this.collection.models, function(item) {
        return item.copyReference && item.copyReference.cid === currentItemModel.cid;
      });
      if (copiedNodes && copiedNodes.length > 0) {
        this.updateApplyToRemainingBtnAsChecked();
      } else {
        this.updateApplyToRemainingBtnAsUnChecked();
      }
      this.options.wizard.refreshFooter();
    },
    validateOnApplyToAll: function(previousItems, remainingItems, currentItemModel) {
      var dfd = $.Deferred(), showAlert = false, previousItemIds = _.pluck(previousItems, "cid");
      if (remainingItems && remainingItems.length > 0) {
        showAlert = _.any(remainingItems, function(itemModel) {
          return itemModel.copyReference && itemModel.copyReference.cid !== currentItemModel.cid && !_.contains(previousItemIds, itemModel.copyReference.cid);
        });
      }
      if (showAlert) {
        ModelAlert.confirmQuestion(function(result) {
          if (result) {
            dfd.resolve();
          } else {
            dfd.reject();
          }
        }, lang.applyToRemainingReplaceMsg, lang.applyToRemainingReplaceTitle, {
          buttons: {
            showYes: true,
            labelYes: lang.applyToRemainingReplaceCaption,
            showNo: false,
            showCancel: true
          }
        });
      } else {
        dfd.resolve();
      }
      return dfd.promise();
    },
    onApplyToRemaining: function(remainingItems, currentItemView, currentItemModel) {
      var me = this, deferred = $.Deferred();
      currentItemView.updateObjectNameFieldValue(currentItemModel.get("name"));
      me.multiItemView.validate().done(function(isValid) {
        if (isValid) {
          me.multiItemView._updateSelectedItemData();
          if (currentItemModel.has("properties")) {
            var asyncFieldDefaultDataSourceObject = currentItemView.getAsyncFieldDefaultDataSourceObject(currentItemModel.get("properties"));
            remainingItems.forEach(function(itemModel) {
              itemModel.copyReference = currentItemModel;
              itemModel.propertiesForceFetch = true;
              var properties = _.clone(currentItemModel.get("properties"));
              properties["object_name"] = itemModel.get("name");
              itemModel.set("properties", properties, {
                silent: true
              });
              itemModel.overrideIgnoreFields = [ "object_name" ];
              if (_.has(properties, "object_name")) {
                itemModel.overrideIgnoreFields = [ "object_name" ];
                if (currentItemView.getDefaultObjectName && currentItemView.getDefaultObjectName() !== itemModel.get("name")) {
                  itemModel.overrideIgnoreFields = [];
                }
              }
              if (asyncFieldDefaultDataSourceObject) {
                itemModel.asyncFieldDefaultDataSourceObject = asyncFieldDefaultDataSourceObject;
              }
              me.multiItemView.updateNodeStatus(itemModel, constants.ItemStates.VALIDATED);
            });
          }
          me.updateApplyToRemainingBtnAsChecked();
        }
        deferred.resolve(isValid);
      }.bind(this));
      return deferred;
    },
    applyToRemaining: function() {
      if (this.applyToRemainingBtnView) {
        var me = this, flag = me.applyToRemainingBtnView.$el.attr("state") === "unchecked" ? true : false, previousItems = this.multiItemView.getPreviousItems(), remainingItems = this.multiItemView.getRemainingItems(), currentItemView = this.multiItemView.getCurrentItemDetailsView(), currentItemModel = this.getCurrentItemModel();
        if (currentItemModel) {
          if (flag) {
            if (this.enableReorder) {
              me.validateOnApplyToAll(previousItems, remainingItems, currentItemModel).done(function() {
                me.onApplyToRemaining(remainingItems, currentItemView, currentItemModel).done(function() {
                  me.updateFooterButtons();
                });
              });
            } else {
              me.onApplyToRemaining(remainingItems, currentItemView, currentItemModel).done(function() {
                me.updateFooterButtons();
              });
            }
          } else {
            currentItemView.updateObjectNameFieldValue();
            remainingItems.forEach(function(itemModel) {
              if (itemModel.copyReference && itemModel.copyReference.cid === currentItemModel.cid) {
                delete itemModel.copyReference;
                itemModel.propertiesForceFetch = true;
                me.multiItemView.updateNodeStatus(itemModel, constants.ItemStates.NOT_VALIDATED);
              }
            });
            me.updateApplyToRemainingBtnAsUnChecked();
            me.updateFooterButtons();
          }
          this.multiItemView.getItemSelectView().trigger("dom:refresh");
        }
      }
    },
    updateApplyToRemainingBtn: function() {
      var me = this;
      var currentItemModel = this.getCurrentItemModel();
      if (currentItemModel) {
        if (currentItemModel.copyReference) {
          delete currentItemModel.copyReference;
        }
        currentItemModel.unset("properties", {
          silent: true
        });
        var copiedNodes = _.select(this.collection.models, function(item) {
          return item.copyReference && item.copyReference.cid === currentItemModel.cid;
        });
        _.each(copiedNodes, function(item) {
          if (item.copyReference) {
            delete item.copyReference;
          }
          me.multiItemView.updateNodeStatus(item, constants.ItemStates.NOT_VALIDATED);
        });
        this.multiItemView.updateNodeStatus(currentItemModel, constants.ItemStates.NOT_VALIDATED);
        this.multiItemView.showHeaderMessage("");
        this.updateApplyToRemainingBtnAsUnChecked();
      }
      this.updateFooterButtons();
    },
    updateApplyToRemainingBtnAsChecked: function() {
      if (this.applyToRemainingBtnView) {
        this.applyToRemainingBtnView.$el.attr("state", "checked");
        this.applyToRemainingCaption = lang.removeToRemainingCaption;
      }
    },
    updateApplyToRemainingBtnAsUnChecked: function() {
      if (this.applyToRemainingBtnView) {
        this.applyToRemainingBtnView.$el.attr("state", "unchecked");
        this.applyToRemainingCaption = lang.applyToRemainingCaption;
      }
    },
    validationForFooterButtons: function(currentNode, index) {
      if (!currentNode) {
        currentNode = this.getCurrentItemModel();
      }
      if (!index) {
        index = this.collection.findIndex(currentNode);
      }
      var isLastNode = index === this.collection.length - 1 ? true : false, isValid = this.validateOtherItems();
      if (isLastNode) {
        this.applyRemainingBtnDisabled = true;
        this.nextFileButtonDisabled = true;
        this.nextBtnView.$el.addClass("primaryBtn");
        this.nextFileBtnView.$el.removeClass("primaryBtn");
      } else {
        this.applyRemainingBtnDisabled = false;
        this.nextFileButtonDisabled = false;
        this.nextBtnView.$el.removeClass("primaryBtn");
        this.nextFileBtnView.$el.addClass("primaryBtn");
      }
      if (currentNode.copyReference) {
        this.applyRemainingBtnDisabled = true;
      }
      this.nextFileButtonHidden = false;
      this.applyRemainingBtnHidden = false;
      if (this.collection && this.collection.length === 1) {
        this.nextFileButtonHidden = true;
        this.applyRemainingBtnHidden = true;
      }
      if (isValid) {
        this.nextButtonDisabled = false;
      } else {
        this.nextButtonDisabled = true;
      }
      return isValid;
    },
    getFooterButtons: function() {
      var me = this;
      if (me.wizard && me.wizard.footerView && me.wizard.footerView.collection && me.wizard.footerView.collection.length > 0) {
        me.wizard.footerView.collection.each(function(item) {
          if (item.get("id") === "applyToRemaining") {
            me.applyToRemainingBtnView = me.wizard.footerView.children.findByModel(item);
          } else if (item.get("id") === "next") {
            me.nextBtnView = me.wizard.footerView.children.findByModel(item);
          } else if (item.get("id") === "nextFile") {
            me.nextFileBtnView = me.wizard.footerView.children.findByModel(item);
          }
        });
      }
      if (this.nextBtnView && this.nextFileBtnView) {
        if (this.collection.length === 1) {
          this.nextBtnView.$el.addClass("primaryBtn");
          this.nextFileBtnView.$el.removeClass("primaryBtn");
        } else {
          this.nextBtnView.$el.removeClass("primaryBtn");
          this.nextFileBtnView.$el.addClass("primaryBtn");
        }
      }
      if (this.multiItemView) {
        var currentItemModel = this.getCurrentItemModel();
        if (currentItemModel) {
          var copiedNodes = _.select(this.collection.models, function(item) {
            return item.copyReference && item.copyReference.cid === currentItemModel.cid;
          });
          if (copiedNodes && copiedNodes.length > 0) {
            this.updateApplyToRemainingBtnAsChecked();
          } else {
            this.updateApplyToRemainingBtnAsUnChecked();
          }
        }
        me.wizard.refreshFooter();
      }
    },
    updateHeaderMessage: function(refreshFooter) {
      if (this.multiItemView.getCurrentItemDetailsView() && this.multiItemView.getCurrentItemDetailsView().getItemModel() && this.collection.models && this.collection.models.length > 0) {
        var currentNode = this.getCurrentItemModel();
        var message = "";
        if (currentNode.copyReference) {
          message = _.str.sformat(lang.propertiesSameAsFile, '<span class="file-name">' + currentNode.copyReference.get("name") + "</span>");
          this.applyRemainingBtnDisabled = true;
        } else {
          this.applyRemainingBtnDisabled = false;
        }
        this.multiItemView.showHeaderMessage(message);
        if (refreshFooter) {
          this.options.wizard.refreshFooter();
        }
      }
    }
  });
  _.extend(ImportMetadataPropertiesView.prototype, LayoutViewEventsPropagationMixin);
  return ImportMetadataPropertiesView;
});