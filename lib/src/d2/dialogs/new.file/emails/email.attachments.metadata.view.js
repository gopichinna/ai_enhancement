/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "d2/controls/multi.item/multi.item.view", "d2/dialogs/new.file/profile.metadata.properties.view", "d2/dialogs/new.file/import/import.metadata.properties.view", "d2/utils/constants", "d2/utils/creation.utils", "i18n!d2/dialogs/new.file/emails/impl/nls/lang", "css!d2/dialogs/new.file/emails/impl/email.attachments.item.select" ], function(_, $, Backbone, Marionette, MultiItemView, ProfileMetadataPropertiesView, ImportMetadataPropertiesView, constants, creationUtil, lang) {
  "use strict";
  var ProfileMetadataViewAdapter = ProfileMetadataPropertiesView.extend({
    constructor: function ProfileMetadataViewAdapter() {
      ProfileMetadataPropertiesView.prototype.constructor.apply(this, arguments);
      this.stopListening(this.options.node, "refresh:form:model");
      var profileData = this.options.node.profileData;
      this.listenTo(profileData, "change:profile-value-config-id", this.onProfileDataChange);
    },
    onProfileDataChange: function() {
      if (this.options.node.has("properties")) {
        this.options.node.unset("properties");
      }
      delete this.options.node.copyReference;
      this._updatePropertiesSource();
      this.options.node.set("propertyValidationState", constants.ItemStates.NOT_VISITED);
      if (this.parent) {
        this.parent.triggerMethod && this.parent.triggerMethod("profile:data:changed", this.options.node);
      }
    },
    validate: function() {
      var deferred = $.Deferred();
      if (this.options.node.profileData.hasValidData && !creationUtil.hasPropertyPage(this.options.node.profileData)) {
        deferred.resolve(true);
      } else {
        deferred = ProfileMetadataPropertiesView.prototype.validate.apply(this, arguments);
      }
      return deferred;
    }
  });
  var MultiItemViewAdapter = MultiItemView.extend({
    constructor: function MultiItemViewAdapter() {
      MultiItemView.prototype.constructor.apply(this, arguments);
    },
    showItemPosition: function(item) {
      if (this.options.parent) {
        var index = this.collection.indexOf(item.model);
        var filePositionMessage = _.str.sformat(lang.attachmentPositionMessage, index + 1, this.collection.length);
        this.options.parent.updateFilePosition(filePositionMessage);
      }
    },
    showFirstItem: function() {
      var firstModel = this.collection.find(function(item) {
        return item.isSelected;
      });
      if (!firstModel) {
        firstModel = this.collection.at(0);
      }
      var firstItemView = this.itemSelectView.children.findByModel(firstModel);
      this.changeViewInItemDetails(firstItemView, false);
      return firstItemView;
    }
  });
  var EmailAttachmentsMetadataView = ImportMetadataPropertiesView.extend({
    className: function() {
      var zuper = EmailAttachmentsMetadataView.__super__;
      var className = _.isString(zuper.className) ? zuper.className : _.isFunction(zuper.className) ? zuper.className.call(this, this.options) : "";
      className += " d2-email_attachments-metadata";
      if (this.options && this.options.className) {
        className += " " + _.result(this.options, "className");
      }
      return className;
    },
    constructor: function EmailAttachmentsMetadataView(options) {
      options = options || {};
      this.options = options;
      if (options.className) {
        options.className = this.className();
      }
      this.noPreviousStep = options.noPreviousStep;
      ImportMetadataPropertiesView.prototype.constructor.apply(this, arguments);
      this.enableReorder = false;
    },
    onRender: function() {
      var me = this;
      this.initWizardAttributes();
      this.collection.each(function(model) {
        model.set("itemState", model.isSelected ? constants.ItemStates.NOT_VALIDATED : constants.ItemStates.NOT_VISITED);
      });
      var options = _.extend({
        itemDetailsViewClass: ProfileMetadataViewAdapter,
        parent: this,
        modelKey: "node",
        itemOptions: {
          operationType: "import",
          formMode: "create",
          action: "import",
          parent: this
        }
      }, this.options);
      this.multiItemView = new MultiItemViewAdapter(options);
      this.importMetadataRegion.show(this.multiItemView);
      me.enableFooter();
    },
    enableFooter: function() {
      this.updateFooterButtons();
    },
    deleteCopyReference: function(model, statePropertyName) {
      delete model.copyReference;
      model.propertiesForceFetch = true;
      model.set(statePropertyName, model.profileData.hasValidData && creationUtil.hasPropertyPage(model.profileData) ? constants.ItemStates.NOT_VALIDATED : constants.ItemStates.NOT_VISITED);
    },
    onProfileDataChanged: function(nodeModel) {
      this.collection.each(function(model) {
        if (model.copyReference && model.copyReference.cid === nodeModel.cid) {
          this.deleteCopyReference(model, "propertyValidationState");
        }
      }.bind(this));
    },
    initWizardAttributes: function() {
      ImportMetadataPropertiesView.prototype.initWizardAttributes.apply(this, arguments);
      this.applyRemainingBtnDisabled = true;
      this.applyToRemainingCaption = lang.labelApplyToRemainingAll;
      this.nextFileCaption = lang.labelNextFile;
    },
    onMultiItemChange: function() {
      var currentItemModel = this.getCurrentItemModel();
      this.collection.each(function(model) {
        model.isSelected = model === currentItemModel;
      });
      ImportMetadataPropertiesView.prototype.onMultiItemChange.apply(this, arguments);
    },
    nextItem: function() {
      var currentItem = this.getCurrentItemModel();
      this.multiItemView.validateSelectedItem().done(function(isValid) {
        if (isValid) {
          var nodeIndex = this.collection.findIndex(currentItem);
          if (!this.isAnyPreviousNodeInvalid(nodeIndex)) {
            var nextNodeIndex = nodeIndex + 1;
            if (nextNodeIndex < this.collection.length) {
              this.collection.each(function(model, index) {
                model.isSelected = index === nextNodeIndex;
              });
              if (this.noPreviousStep) {
                this.gotoSelectedItem();
              } else {
                this.wizard && this.wizard.prevStep();
              }
            } else {
              this.next();
            }
          }
        }
      }.bind(this));
    },
    isAnyPreviousNodeInvalid: function(nodeIndex) {
      var invalidItem = _.find(this.collection.slice(0, nodeIndex), function(model) {
        return creationUtil.hasPropertyPage(model.profileData) && model.get("itemState") !== constants.ItemStates.VALIDATED;
      });
      if (invalidItem) {
        var $invalidItem = this.multiItemView.itemSelectView.children.findByModel(invalidItem).$el;
        $invalidItem.trigger("focus");
        $invalidItem.trigger("click");
        return true;
      }
      return !!invalidItem;
    },
    isValidItem: function(item) {
      return item && item.profileData && item.profileData.hasValidData && (!creationUtil.hasPropertyPage(item.profileData) || item.get("itemState") === constants.ItemStates.VALIDATED);
    },
    validateAllItems: function() {
      var invalidItem = this.collection.find(function(item) {
        return !this.isValidItem(item);
      }.bind(this));
      return invalidItem ? false : true;
    },
    validateOtherItems: function() {
      var currentNode = this.getCurrentItemModel();
      var invalidItem = this.collection.find(function(item) {
        return currentNode.cid !== item.cid && !this.isValidItem(item);
      }.bind(this));
      return invalidItem ? false : true;
    },
    onStepBeforeActive: function() {
      this.collection && this.collection.each(function(model) {
        model.set({
          itemState: model.get("propertyValidationState")
        });
        model.unset("propertyValidationState", {
          silent: true
        });
      });
      this.allProfilesAreSame = false;
      var refProfile = this.collection.at(0).profileData;
      if (refProfile && refProfile.hasValidData) {
        this.allProfilesAreSame = this.collection.all(function(model) {
          return model.profileData && model.profileData.hasValidData && _.isEqual(refProfile.attributes, model.profileData.attributes);
        });
      }
      if (!this.allProfilesAreSame) {
        this.collection.each(function(model) {
          if (model.copyReference) {
            this.deleteCopyReference(model, "itemState");
          }
        }.bind(this));
      }
      ImportMetadataPropertiesView.prototype.onStepBeforeActive.apply(this);
      var itemToSelect;
      if (this._isRendered) {
        itemToSelect = this.gotoSelectedItem();
      }
      if (!this.multiItemView || itemToSelect === this.getCurrentItemModel()) {
        this.updateFooterButtons();
      }
    },
    gotoSelectedItem: function() {
      var itemToSelect = this.collection.find(function(model) {
        return model.isSelected;
      });
      if (!!itemToSelect && this.multiItemView) {
        this.blockActions();
        this.multiItemView.selectItemByModel(itemToSelect).always(function() {
          this.unblockActions();
          var currentItemDetailsView = this.multiItemView.getCurrentItemDetailsView();
          if (itemToSelect === this.getCurrentItemModel() && currentItemDetailsView) {
            currentItemDetailsView.refreshForms();
          }
        }.bind(this));
      }
      return itemToSelect;
    },
    onStepBeforeInactive: function() {
      this.collection && this.collection.each(function(model) {
        model.set({
          propertyValidationState: model.get("itemState")
        }, {
          slient: true
        });
        model.unset("itemState");
      });
    },
    getCurrentItemModel: function() {
      return this.multiItemView && this.multiItemView.getSelectedItemModel();
    },
    updateFooterButtons: function() {
      if (this.multiItemView) {
        this.updateHeaderMessage(false);
      }
      this.updateApplyToAllButtonVisibilityState();
      var currentItemModel = this.getCurrentItemModel();
      if (currentItemModel && this.collection.length > 0) {
        var nodeIndex = this.collection.findIndex(currentItemModel);
        if (nodeIndex === this.collection.length - 1) {
          this.applyRemainingBtnHidden = true;
          this.nextFileButtonDisabled = true;
          this.nextBtnView.$el.addClass("primaryBtn");
          this.nextFileBtnView.$el.removeClass("primaryBtn");
        } else {
          this.applyRemainingBtnHidden = false;
          this.nextFileButtonDisabled = false;
          this.nextBtnView.$el.removeClass("primaryBtn");
          this.nextFileBtnView.$el.addClass("primaryBtn");
        }
        if (this.validateOtherItems(false)) {
          this.nextButtonDisabled = false;
        } else {
          this.nextButtonDisabled = true;
        }
      }
      this.wizard && this.wizard.refreshFooter();
    },
    updateApplyToAllButtonVisibilityState: function() {
      this.applyRemainingBtnDisabled = true;
      if (this.multiItemView) {
        var currentItemModel = this.getCurrentItemModel();
        if (currentItemModel && !currentItemModel.copyReference) {
          var nodeIndex = this.collection.findIndex(currentItemModel);
          this.applyRemainingBtnDisabled = !(this.allProfilesAreSame && nodeIndex !== this.collection.length - 1);
          this.applyRemainingBtnHidden = !this.allProfilesAreSame || nodeIndex === this.collection.length - 1;
        }
      }
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
      return lang.titleMetadataView;
    }
  });
  return EmailAttachmentsMetadataView;
});