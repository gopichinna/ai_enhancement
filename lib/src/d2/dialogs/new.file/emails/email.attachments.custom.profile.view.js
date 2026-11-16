/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/progressblocker/blocker", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "d2/controls/multi.item/multi.item.view", "d2/controls/multi.item/impl/item.select.view", "d2/dialogs/new.file/custom.profile.view", "d2/utils/creation.utils", "d2/utils/constants", "i18n!d2/dialogs/new.file/emails/impl/nls/lang", "hbs!d2/dialogs/new.file/emails/impl/email.attachments.custom.profile", "css!d2/dialogs/new.file/emails/impl/email.attachments.custom.profile", "css!d2/dialogs/new.file/emails/impl/email.attachments.item.select" ], function(_, $, Backbone, Marionette, BlockingView, LayoutViewEventsPropagationMixin, MultiItemView, ItemSelectView, CustomProfileView, creationUtil, constants, lang, template) {
  "use strict";
  var CustomProfileMultiViewAdapter = CustomProfileView.extend({
    constructor: function CustomProfileMultiViewAdapter(options) {
      options = options || {};
      options.profileData = options.node && options.node.profileData;
      options.profileCollection = options.node && options.node.profileCollection;
      options.configCollection = options.node && options.node.configCollection;
      options.preselectFromProfileData = true;
      options.showCustomNameField = false;
      this.stopImmediateValidationEvent = options.node.profileReference && !!options.node.profileReference.profileData;
      this.parent = options.parent;
      CustomProfileView.prototype.constructor.apply(this, arguments);
      this.listenTo(this, {
        "render:form:profile": function() {
          this.propagateEventToParent("render:form:profile");
        },
        "render:form:valueconfig": function() {
          this.propagateEventToParent("render:form:valueconfig");
        }
      });
    },
    getItemModel: function() {
      return this.options.node;
    },
    validate: function() {
      var isValid = CustomProfileView.prototype.validate.apply(this, arguments);
      if (this.options.node.parentItem) {
        this.profileData.set("inherited-id", this.options.node.parentItem.get("id"));
      }
      this.profileData.hasValidData = isValid;
      if (this.parent) {
        if (!this.stopImmediateValidationEvent) {
          this.parent.triggerMethod && this.parent.triggerMethod("custom:profile:validation:changed", isValid, this.options.node);
        } else {
          this.stopImmediateValidationEvent = false;
        }
      }
      return $.Deferred().resolve(isValid);
    },
    setProfileSelection: function() {
      this.stopImmediateValidationEvent = true;
      this.onProfileNameViewInitialRender();
    },
    propagateEventToParent: function(eventName) {
      this.parent && this.parent.triggerMethod && this.parent.triggerMethod(eventName, this.options.node);
    }
  });
  var ItemSelectViewAdapter = ItemSelectView.extend({
    constructor: function ItemSelectViewAdapter() {
      ItemSelectView.prototype.constructor.apply(this, arguments);
    },
    getLastSelectedItemView: function() {
      return this.children.find(function(childView) {
        return childView.ui.itemInfo.hasClass("selected-item");
      });
    },
    onClickChildItem: function(itemView) {
      this.options.multiItemView.changeViewInItemDetails(itemView, true, this.getLastSelectedItemView());
    }
  });
  var MultiItemViewAdapter = MultiItemView.extend({
    constructor: function MultiItemViewAdapter() {
      MultiItemView.prototype.constructor.apply(this, arguments);
    },
    onRender: function() {
      var options = _.extend({
        multiItemView: this
      }, this.options);
      this.itemSelectView = new ItemSelectViewAdapter(options);
      this.itemSelectRegion.show(this.itemSelectView);
    },
    showItemPosition: function(item) {
      if (this.options.parent) {
        var index = this.collection.indexOf(item.model);
        var filePositionMessage = _.str.sformat(lang.attachmentPositionMessage, index + 1, this.collection.length);
        this.options.parent.updateFilePosition(filePositionMessage);
      }
    },
    changeViewInItemDetails: function(itemView, validateItem, lastSelectedItemView) {
      if (!lastSelectedItemView) {
        lastSelectedItemView = this.itemSelectView.getLastSelectedItemView();
      }
      var alreadyValidated = lastSelectedItemView && lastSelectedItemView.model.profileData && lastSelectedItemView.model.profileData.hasValidData;
      return MultiItemView.prototype.changeViewInItemDetails.call(this, itemView, alreadyValidated ? false : validateItem);
    }
  });
  var AttachmentsCustomProfileView = Marionette.LayoutView.extend({
    className: "d2-email_attachments-custom-profile",
    template: template,
    regions: {
      customProfileContainer: ".attachments-custom-profile-container"
    },
    constructor: function AttachmentsCustomProfileView(options) {
      options = options || {};
      this.context = options.context;
      this.wizard = options.wizard;
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.propagateEventsToRegions();
      if (this.wizard) {
        BlockingView.delegate(this, this.wizard);
      } else {
        BlockingView.imbue(this);
      }
      this.isNextButtonDisabled = true;
      this.applyRemainingBtnDisabled = true;
      this.applyRemainingBtnHidden = false;
      this.listenTo(this, "multi.item:change", this.onMultiItemChange);
    },
    onRender: function() {
      if (!this.multiItemView) {
        this.collection.each(function(model) {
          model.set("itemState", constants.ItemStates.NOT_VALIDATED);
        });
        var options = _.extend({
          itemDetailsViewClass: CustomProfileMultiViewAdapter,
          parent: this,
          modelKey: "node",
          itemOptions: {
            parent: this,
            context: this.context,
            wizard: this.wizard,
            _contentMode: this.options.mode,
            profileCollection: this.options.profileCollection,
            configCollection: this.options.configCollection,
            inheritableSourceNode: this.options.inheritableSourceNode,
            container: this.options.container
          }
        }, this.options);
        this.multiItemView = new MultiItemViewAdapter(options);
        this.customProfileContainer.show(this.multiItemView);
      }
    },
    onCustomProfileValidationChanged: function(isValid, triggeringModel) {
      if (triggeringModel === this.getCurrentItemModel()) {
        this.updateFooterButtonsOnCurrentProfileDataChange();
      }
    },
    updateFooterButtonsOnCurrentProfileDataChange: function() {
      this.isNextButtonDisabled = !this.canGoToNext();
      this.updateApplyToRemainingButtonOnCurrentProfileDataChange();
      this.wizard && this.wizard.refreshFooter();
    },
    updateFilePosition: function(filePosition) {
      this.subtitle = filePosition;
      this.options.wizard.refreshHeader();
    },
    canGoToNext: function() {
      var retVal = false;
      if (this.multiItemView) {
        var itemModel = this.getCurrentItemModel();
        if (this.hasValidProfile(itemModel)) {
          this.multiItemView.updateNodeStatus(itemModel, constants.ItemStates.VALIDATED);
          var nodeIndex = this.collection.findIndex(itemModel);
          if (nodeIndex === 0) {
            retVal = true;
          } else if (nodeIndex !== -1) {
            retVal = !this.isAnyPreviousNodeInvalid(nodeIndex);
          }
        } else {
          this.multiItemView.updateNodeStatus(itemModel, constants.ItemStates.NOT_VALIDATED);
        }
      }
      return retVal;
    },
    isAnyPreviousNodeInvalid: function(nodeIndex) {
      return _.some(this.collection.slice(0, nodeIndex), function(model) {
        return !(this.hasValidProfile(model) && this.hasValidProperties(model));
      }.bind(this));
    },
    hasValidProfile: function(model) {
      return model && (model.profileData && model.profileData.hasValidData || model.profileReference && model.profileReference.profileData && model.profileReference.profileData.hasValidData);
    },
    hasValidProperties: function(model) {
      return model && (!creationUtil.hasPropertyPage(model.profileData) || model.has("properties"));
    },
    gotoNextStep: function() {
      if (this.canGoToNext()) {
        var itemModel = this.getCurrentItemModel();
        if (!creationUtil.hasPropertyPage(itemModel.profileData)) {
          var nodeIndex = this.collection.findIndex(itemModel);
          var allRemainingHasSameProfile = _.all(this.collection.slice(nodeIndex), function(model) {
            return model.get("itemState") === constants.ItemStates.VALIDATED && _.isEqual(itemModel.profileData.attributes, model.profileData.attributes);
          });
          if (allRemainingHasSameProfile || nodeIndex + 1 >= this.collection.length) {
            this.wizard && this.wizard.close();
          } else {
            this.blockActions();
            this.multiItemView.selectItemByModel(this.collection.at(nodeIndex + 1)).always(this.unblockActions.bind(this));
          }
        } else {
          this.collection.each(function(model) {
            model.isSelected = model === itemModel;
          });
          this.wizard && this.wizard.nextStep();
        }
      }
    },
    onStepBeforeActive: function() {
      this.collection && this.collection.each(function(model) {
        model.set({
          itemState: model.get("profileValidationState")
        });
        model.unset("profileValidationState", {
          silent: true
        });
      });
      if (this._isRendered) {
        var itemToSelect = this.collection.find(function(model) {
          return model.isSelected;
        });
        if (!!itemToSelect && this.multiItemView) {
          this.blockActions();
          this.multiItemView.selectItemByModel(itemToSelect).always(this.unblockActions.bind(this));
        }
      }
      this.getApplyToRemainingBtn();
    },
    onStepBeforeInactive: function() {
      this.collection && this.collection.each(function(model) {
        model.set({
          profileValidationState: model.get("itemState")
        }, {
          slient: true
        });
        model.unset("itemState");
      });
    },
    getCurrentItemModel: function() {
      return this.multiItemView.getSelectedItemModel();
    },
    getApplyToRemainingBtn: function() {
      if (this.wizard && this.wizard.footerView && this.wizard.footerView.collection && this.wizard.footerView.collection.length > 0) {
        var model = this.wizard.footerView.collection.detect(function(item) {
          return item.get("id") === "applyToRemaining";
        });
        if (model) {
          this.applyToRemainingBtnView = this.wizard.footerView.children.findByModel(model);
          this.applyToRemainingBtnView.$el.addClass("applyToRemainingBtn");
        }
      }
      if (this.multiItemView) {
        var currentItemModel = this.getCurrentItemModel();
        if (currentItemModel) {
          var copiedNodes = this.collection.select(function(model) {
            return model.profileReference && model.profileReference.cid === currentItemModel.cid;
          });
          if (copiedNodes && copiedNodes.length > 0) {
            this.updateApplyToRemainingBtnAsChecked();
          } else {
            this.updateApplyToRemainingBtnAsUnChecked();
          }
        }
      }
      return this.applyToRemainingBtnView;
    },
    updateApplyToRemainingButtonOnCurrentProfileDataChange: function() {
      var currentModel = this.getCurrentItemModel(), hasValidProfile = this.hasValidProfile(currentModel), nodeIndex = this.collection.findIndex(currentModel);
      this.applyRemainingBtnDisabled = !(hasValidProfile && (nodeIndex >= 0 && nodeIndex < this.collection.length - 1));
      this.applyRemainingBtnHidden = nodeIndex === this.collection.length - 1;
      if (currentModel) {
        delete currentModel.profileReference;
        this.collection.each(function(model) {
          if (model.profileReference && model.profileReference.cid === currentModel.cid) {
            this.clearProfileReference(model);
          }
        }.bind(this));
        this.multiItemView.updateNodeStatus(currentModel, hasValidProfile ? constants.ItemStates.VALIDATED : constants.ItemStates.NOT_VALIDATED);
        this.multiItemView.showHeaderMessage("");
        this.updateApplyToRemainingBtnAsUnChecked();
      }
    },
    applyToRemaining: function() {
      var flag = this.applyToRemainingBtnView.$el.attr("state") === "unchecked" ? true : false, remainingItems = this.multiItemView.getRemainingItems(), currentItemModel = this.getCurrentItemModel();
      if (currentItemModel) {
        if (flag) {
          if (currentItemModel.profileData.hasValidData) {
            _.each(remainingItems, function(itemModel) {
              itemModel.profileReference = currentItemModel;
              itemModel.profileData.hasValidData = currentItemModel.profileData.hasValidData;
              itemModel.profileData.data = currentItemModel.profileData.data;
              itemModel.profileData.set(currentItemModel.profileData.attributes);
              this.multiItemView.updateNodeStatus(itemModel, constants.ItemStates.VALIDATED);
              var viewMap = this.multiItemView.getViewMap();
              if (_.has(viewMap, itemModel.cid)) {
                viewMap[itemModel.cid].setProfileSelection && viewMap[itemModel.cid].setProfileSelection();
              }
            }.bind(this));
            this.updateApplyToRemainingBtnAsChecked();
          }
        } else {
          _.each(remainingItems, function(itemModel) {
            if (itemModel.profileReference && itemModel.profileReference.cid === currentItemModel.cid) {
              this.clearProfileReference(itemModel);
            }
          }.bind(this));
          this.updateApplyToRemainingBtnAsUnChecked();
        }
        this.multiItemView.getItemSelectView().trigger("dom:refresh");
        this.wizard && this.wizard.refreshFooter();
      }
    },
    clearProfileReference: function(model) {
      delete model.profileReference;
      this.multiItemView.updateNodeStatus(model, constants.ItemStates.NOT_VALIDATED);
    },
    updateMultiViewHeaderMessage: function() {
      var currentItem = this.getCurrentItemModel(), nodeIndex = this.collection.findIndex(currentItem);
      var message = "";
      if (currentItem.profileReference) {
        message = _.str.sformat(lang.profileSameAsFile, '<span class="file-name">' + currentItem.profileReference.get("name") + "</span>");
        this.applyRemainingBtnDisabled = true;
      } else {
        if (nodeIndex >= 0 && nodeIndex < this.collection.length - 1) {
          this.applyRemainingBtnDisabled = currentItem.profileData.hasValidData !== true;
        } else {
          this.applyRemainingBtnDisabled = true;
        }
      }
      this.applyRemainingBtnHidden = nodeIndex === this.collection.length - 1;
      this.multiItemView.showHeaderMessage(message);
    },
    onMultiItemChange: function() {
      this.updateMultiViewHeaderMessage();
      this.isNextButtonDisabled = !this.canGoToNext();
      var currentItemModel = this.getCurrentItemModel();
      var copiedNodes = _.select(this.collection.models, function(item) {
        return item.profileReference && item.profileReference.cid === currentItemModel.cid;
      });
      if (copiedNodes && copiedNodes.length > 0) {
        this.updateApplyToRemainingBtnAsChecked();
      } else {
        this.updateApplyToRemainingBtnAsUnChecked();
      }
      this.wizard && this.wizard.refreshFooter();
    },
    updateApplyToRemainingBtnAsChecked: function() {
      if (this.applyToRemainingBtnView) {
        this.applyToRemainingBtnView.$el.attr("state", "checked");
        this.applyToRemainingCaption = lang.labelRemoveApplyToRemainingAll;
      }
    },
    updateApplyToRemainingBtnAsUnChecked: function() {
      if (this.applyToRemainingBtnView) {
        this.applyToRemainingBtnView.$el.attr("state", "unchecked");
        this.applyToRemainingCaption = lang.labelApplyToRemainingAll;
      }
    },
    getTitle: function() {
      return lang.titleCustomProfileView;
    },
    getSubTitle: function() {
      if (!this.subtitle) {
        this.subtitle = "";
      }
      return this.subtitle;
    }
  });
  _.extend(AttachmentsCustomProfileView.prototype, LayoutViewEventsPropagationMixin);
  return AttachmentsCustomProfileView;
});