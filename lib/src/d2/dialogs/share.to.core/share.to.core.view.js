/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/utils/commandhelper", "csui/utils/nodesprites", "csui/dialogs/modal.alert/modal.alert", "csui/controls/progressblocker/blocker", "d2/controls/globalmessage/globalmessage", "csui/controls/form/fields/booleanfield.view", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "d2/utils/rest.linkrels", "dctmw/utils/utils", "d2/utils/constants", "d2/dialogs/share.to.core/impl/share.to.core.permission.view", "i18n!d2/dialogs/share.to.core/impl/nls/lang", "hbs!d2/dialogs/share.to.core/impl/share.to.core", "css!d2/dialogs/share.to.core/impl/share.to.core", "csui/lib/binf/js/binf" ], function(_, $, Backbone, Marionette, CommandHelper, NodeSprites, Alert, BlockingView, GlobalMessage, ToggleSwitchView, PerfectScrollingBehavior, TabableRegionBehavior, RestLinkrels, utils, constants, ShareToCorePermissionView, lang, template) {
  "use strict";
  var ShareToCoreView = Marionette.CompositeView.extend({
    constructor: function ShareToCoreView(options) {
      this.actionType = options.actionType;
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
      this.wizard = this.options.wizard;
      this.nodes = this.options.nodes;
      this.context = this.options.context;
      this.connector = this.options.connector;
      this.initWizardAttributes();
      this.reservedNodes = this.nodes.where({
        reserved: true
      });
      this.nonReservedNodes = this.nodes.where({
        reserved: false
      });
      this.reservableNodes = this.nonReservedNodes;
      if (this.options.shareIntent) {
        this.shareIntent = this.options.shareIntent;
        if (this.shareIntent === constants.ShareIntentType.COLLABORATE) {
          this.hideCheckoutToggle = true;
        }
      } else {
        this.shareIntent = constants.ShareIntentType.PUBLISH;
      }
      if (!this._isCheckoutAllowed()) {
        this.hideCheckoutToggle = true;
      }
      if (this.wizard) {
        BlockingView.delegate(this, this.wizard);
      } else {
        BlockingView.imbue(this);
      }
    },
    className: "share-to-core",
    emptyView: false,
    childViewContainer: ".share-to-core-permissions",
    template: template,
    childView: ShareToCorePermissionView,
    childViewOptions: function() {
      return _.extend({
        parentView: this
      }, this.options);
    },
    ui: {
      shareToCorePermissions: ".share-to-core-permissions",
      checkoutToggleBtn: ".checkout-toggle-btn",
      checkoutContainer: ".checkout-container",
      checkoutErrorContainer: ".checkout-error-container",
      checkoutErrorMessage: ".checkout-error-message"
    },
    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      },
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: ".share-to-core-container",
        suppressScrollX: true,
        scrollYMarginOffset: 10
      }
    },
    templateHelpers: function() {
      return {
        checkoutToggleMessage: lang.checkoutToggleMessage
      };
    },
    onRender: function() {
      this._createCheckoutToggleButton();
      if (this.options.validateOnRender) {
        this.validatePermissionSets();
      }
    },
    currentlyFocusedElement: function(event) {
      var tabElements = this.$el.find(".focusable").filter(":visible:not([disabled])");
      if (tabElements.length) {
        tabElements.prop("tabindex", 0);
      }
      if (!!event && event.shiftKey) {
        return tabElements[tabElements.length - 1];
      } else {
        return tabElements[0];
      }
    },
    onLastTabElement: function(shiftTab, event) {
      var visibleElems = this.$("*[tabindex=0]:visible");
      return event.target === (shiftTab ? visibleElems[0] : visibleElems[visibleElems.length - 1]);
    },
    blockWizardElements: function() {
      this.blockActions();
      $(".d2-share-to-core-wizard .load-container .outer-border").addClass("binf-hidden");
      this.updateTabindexOfToggle(true);
    },
    unblockWizardElements: function() {
      this.unblockActions();
      $(".d2-share-to-core-wizard .load-container .outer-border").removeClass("binf-hidden");
      this.updateTabindexOfToggle(false);
    },
    updateTabindexOfToggle: function(disable) {
      var $checkbox = this.ui.checkoutToggleBtn.find(".binf-switch-container input[type=checkbox]");
      $checkbox.attr("tabindex", 0).addClass("focusable");
      if (disable) {
        $checkbox.prop("disabled", true);
      } else {
        $checkbox.prop("disabled", false);
      }
    },
    initWizardAttributes: function() {
      this.shareBtnDisabled = true;
      this.shareUsingCoreTitle = lang.shareUsingCoreTitle;
      this.manageUsingCoreTitle = lang.manageUsingCoreTitle;
      this.shareBtnCaption = lang.shareBtnCaption;
      this.updateBtnCaption = lang.updateBtnCaption;
      if (this.nodes.length === 1) {
        this.wizardSubTitle = this.nodes.at(0).get("name");
      } else {
        this.wizardSubTitle = _.str.sformat(lang.itemsSubtitle, this.nodes.length);
      }
    },
    validatePermissionSets: function(currentChildView, addedAssigneeModel) {
      var isChickletAdded = false, isConflict = false, otherPermissionSetModel;
      this.children.each(function(childView) {
        if (childView.errorAssigneeModel) {
          childView.clearErrorMessage();
        }
        var assigneeCollection = childView.model.get("assignee");
        if (!isChickletAdded && assigneeCollection.length > 0) {
          isChickletAdded = true;
        }
        if (!isConflict && addedAssigneeModel && currentChildView.cid !== childView.cid) {
          var matchedModel = assigneeCollection.detect(function(model) {
            return addedAssigneeModel.get("id") === model.get("id");
          });
          if (matchedModel) {
            otherPermissionSetModel = childView.model;
            isConflict = true;
          }
        }
        childView.updatePermissionCount();
      });
      if (addedAssigneeModel && otherPermissionSetModel) {
        currentChildView.showErrorMessage(addedAssigneeModel, otherPermissionSetModel);
      }
      if (isChickletAdded && !isConflict) {
        this.shareBtnDisabled = false;
      } else {
        this.shareBtnDisabled = true;
      }
      this.wizard.refreshFooter();
    },
    next: function() {
      var assigneeList = this.getAssigneeForPermission();
      this.options.shareData.shareIntent = this.shareIntent;
      this.options.shareData.assigneeList = assigneeList;
      this.options.shareData.nodes = [];
      if (this.reservableNodes && this.reservableNodes.length > 0) {
        this.options.shareData.nodes = this.options.shareData.nodes.concat(this.reservableNodes);
      }
      if (this.reservedNodes && this.reservedNodes.length > 0) {
        this.options.shareData.nodes = this.options.shareData.nodes.concat(this.reservedNodes);
      }
      this.wizard.nextStep();
    },
    showConfirmationMessage: function(title, message, yesButtonLabel) {
      var dfd = $.Deferred(), buttonOptions = {
        showYes: true,
        labelYes: yesButtonLabel,
        showNo: false,
        showCancel: true
      };
      Alert.confirmQuestion(function(result) {
        if (result) {
          dfd.resolve();
        } else {
          dfd.reject();
        }
      }, message, title, {
        buttons: buttonOptions
      });
      return dfd.promise();
    },
    checkAssigneeAddedInPermission: function() {
      if (this.collection.models && this.collection.models.length > 0) {
        for (var i = 0; i < this.collection.models.length; i++) {
          var permissionModel = this.collection.models[i];
          if (permissionModel.get("assignee") && permissionModel.get("assignee").length > 0) {
            return true;
          }
        }
        return false;
      }
    },
    getAssigneeForPermission: function() {
      var assigneeList = [];
      this.collection.each(function(permissionModel) {
        var assigneeCollection = permissionModel.get("assignee");
        if (assigneeCollection && assigneeCollection.length > 0) {
          assigneeCollection.each(function(assigneeModel) {
            assigneeList.push({
              type: "user",
              role: permissionModel.get("name"),
              identity: assigneeModel.get("id")
            });
          });
        }
      });
      return assigneeList;
    },
    _isCheckoutAllowed: function() {
      if (this.nonReservedNodes && this.nonReservedNodes.length > 0) {
        for (var i in this.nonReservedNodes) {
          if (CommandHelper.getOriginalActionLink(this.nonReservedNodes[i], this.options.commandKey, RestLinkrels.CHECKOUT_PRECHECK)) {
            return true;
          }
        }
      }
      return false;
    },
    _createCheckoutToggleButton: function() {
      if (this.hideCheckoutToggle) {
        this.ui.checkoutContainer.addClass("binf-hidden");
        this.ui.shareToCorePermissions.addClass("non-checkout");
      } else if (this.reservedNodes.length > 0) {
        this.ui.checkoutContainer.addClass("binf-hidden");
        this.ui.shareToCorePermissions.addClass("non-checkout");
        this.shareIntent = constants.ShareIntentType.PUBLISH;
      } else {
        this.checkoutModel = new Backbone.Model({
          data: false
        });
        this.checkoutToggleSwitch = new ToggleSwitchView({
          id: _.uniqueId("checkout_toggle"),
          model: this.checkoutModel
        });
        var $checkoutToggleSwitch = this.checkoutToggleSwitch.render().$el;
        $checkoutToggleSwitch.find(".binf-switch-container input").addClass("focusable");
        this.ui.checkoutToggleBtn.html($checkoutToggleSwitch);
        this.ui.checkoutErrorContainer.addClass("binf-hidden");
        this.ui.checkoutErrorMessage.html("");
        this.listenTo(this.checkoutModel, "change:data", this._onCheckoutToggle);
      }
    },
    _resetCheckBoxState: function() {
      this.checkoutModel.set("data", false);
      this.checkoutToggleSwitch.render();
      this.unblockWizardElements();
    },
    _onCheckoutToggle: function(model, value) {
      if (value) {
        this._performCheckoutPrecheck();
      } else {
        this._revertCheckout();
      }
    },
    _revertCheckout: function() {
      this.ui.checkoutErrorContainer.addClass("binf-hidden");
      this.ui.checkoutErrorMessage.html("");
      this.reservableNodes = this.nonReservedNodes;
      this.shareIntent = constants.ShareIntentType.PUBLISH;
    },
    _performCheckoutPrecheck: function() {
      this.blockWizardElements();
      var self = this, batchPayload = [];
      _.each(self.nonReservedNodes, function(node) {
        var uri = CommandHelper.getOriginalActionLink(node, self.options.commandKey, RestLinkrels.CHECKOUT_PRECHECK);
        if (uri) {
          batchPayload.push({
            id: node.get("id"),
            request: {
              method: "GET",
              uri: uri
            }
          });
        }
      });
      utils.makeBatchAjaxCall({
        connector: this.connector,
        operations: batchPayload,
        continueOnError: true
      }).done(function(successList, errorList) {
        var hasNonOkItems = false, allItems = _.map(batchPayload, function(payload) {
          var node, item = _.find(successList, function(successItem) {
            return successItem.id === payload.id;
          });
          if (item) {
            node = self.nodes.find(function(n) {
              return n.get("id") === item.id;
            });
            if (item.output.status !== "OK") {
              hasNonOkItems = true;
            }
            var actionModel = node.actions.findWhere({
              signature: self.options.commandKey
            });
            if (actionModel) {
              var links = actionModel.get("links");
              var checkoutLink = _.findWhere(links, {
                rel: RestLinkrels.CHECKOUT
              });
              if (!checkoutLink) {
                checkoutLink = _.findWhere(item.output.links, {
                  rel: RestLinkrels.CHECKOUT
                });
                if (checkoutLink) {
                  links.push(checkoutLink);
                }
              }
            }
            return {
              id: item.id,
              name: node.get("name"),
              node: node,
              iconClass: NodeSprites.findByNode(node).get("className"),
              status: item.output.status,
              message: item.output.message,
              links: item.output.links
            };
          } else {
            item = _.find(errorList, function(errorItem) {
              return errorItem.id === payload.id;
            });
            node = self.nodes.find(function(n) {
              return n.get("id") === item.id;
            });
            hasNonOkItems = true;
            return {
              id: item.id,
              name: node.get("name"),
              node: node,
              iconClass: NodeSprites.findByNode(node).get("className"),
              status: "ERROR",
              message: utils.parseErrorAsString("object", item.output),
              links: []
            };
          }
        });
        if (hasNonOkItems) {
          self.getConfirmDialog(allItems).always(function(dialog) {
            dialog.confirm().done(function(selectedItems) {
              self._extractReservableNodes(selectedItems);
            }).fail(function() {
              self._resetCheckBoxState();
            });
          });
        } else {
          self._extractReservableNodes(allItems);
        }
      }).fail(function() {
        GlobalMessage.showMessage("error", lang.checkoutCheckFailed);
        self._resetCheckBoxState();
      });
    },
    _extractReservableNodes: function(items) {
      var nonErrorItems = _.select(items, function(item) {
        return item.status === "WARNING" || item.status === "OK";
      });
      this.reservableNodes = _.pluck(nonErrorItems, "node");
      if (this.reservableNodes.length < this.nodes.length) {
        this.ui.checkoutErrorContainer.removeClass("binf-hidden");
        var nonReservableCount = this.nodes.length - this.reservableNodes.length;
        var errorMessage = _.str.sformat(lang.checkoutErrorMessage, nonReservableCount, this.nodes.length);
        this.ui.checkoutErrorMessage.html(errorMessage);
      }
      this.shareIntent = constants.ShareIntentType.COLLABORATE;
      this.unblockWizardElements();
    },
    getConfirmDialog: function(items) {
      var dfd = $.Deferred();
      require([ "d2/dialogs/reserve/confirm.dialog" ], function(ConfirmDialog) {
        var dialog = new ConfirmDialog({
          title: lang.checkoutDialogTitle,
          checkoutItems: items
        });
        dfd.resolve(dialog);
      });
      return dfd.promise();
    }
  });
  return ShareToCoreView;
});