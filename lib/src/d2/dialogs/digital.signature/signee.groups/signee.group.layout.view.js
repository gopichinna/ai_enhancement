/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "d2/dialogs/digital.signature/signee.list/signee.list.view", "d2/dialogs/digital.signature/signee.form/signee.form.view", "i18n!d2/dialogs/digital.signature/signee.groups/impl/nls/lang", "hbs!d2/dialogs/digital.signature/signee.groups/impl/signee.group.layout.view", "css!d2/dialogs/digital.signature/signee.groups/impl/signee.group.layout.view" ], function($, _, Backbone, Marionette, SigneelistView, SigneeFormView, lang, SingleGroupTemplate) {
  "use strict";
  var getTransitionEndEvent = _.once(function() {
    var transitions = {
      transition: "transitionend",
      WebkitTransition: "webkitTransitionEnd",
      MozTransition: "transitionend",
      OTransition: "oTransitionEnd otransitionend"
    }, element = document.createElement("div"), transition;
    for (transition in transitions) {
      if (typeof element.style[transition] !== "undefined") {
        return transitions[transition];
      }
    }
  });
  return Marionette.LayoutView.extend({
    template: SingleGroupTemplate,
    className: "signature-signee-group-layout",
    emptyView: false,
    templateHelpers: function() {
      return {
        lang: lang,
        groupTitle: _.str.sformat(lang.SigneeGroup_Title, this.options.index + 1),
        showRemoveIcon: this.options.groupModel.collection.length > 1,
        showDragDropMessage: this.options.groupModel.collection.length > 1
      };
    },
    childViewOptions: function() {
      return {
        collection: this.options.collection,
        model: this.options.model,
        context: this.options.context,
        groupIndex: this.options.index,
        wizard: this.options.wizard
      };
    },
    regions: {
      signerListRegion: ".signee-list",
      signerFormRegion: ".signee-form"
    },
    ui: {
      addSignerButton: ".add-signer-button",
      removeGroupIcon: ".signee-remove-group",
      signeeGroupBody: ".signee-group-body",
      signeeGroupContainer: ".signee-group-view",
      signeeGroupDroppableRegion: ".signee-group-droppable-region",
      dragAndDropMessage: ".signature-drag-drop-message"
    },
    events: {
      "click @ui.addSignerButton": "onClickAddSigner",
      "click @ui.removeGroupIcon": "onClickRemoveGroupIcon",
      "keyup @ui.removeGroupIcon": "onKeyUpRemoveGroupIcon",
      "keydown @ui.signeeGroupContainer": "onGroupKeyDown",
      "keyup @ui.signeeGroupContainer": "onGroupKeyUp"
    },
    childEvents: {
      "add:user": "onAddUser",
      "cancel:add:user": "onCancelAddUser",
      "remove:user": "onRemoveUser",
      "signee:list:empty": "focusGroup"
    },
    focusGroup: function() {
      this.ui.signeeGroupContainer.trigger("focus");
    },
    constructor: function SigneeGroupView() {
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
    },
    isValid: function() {
      return this.collection.length && (this.signerFormRegion.$el.hasClass("binf-hidden") ? true : this.signeeFormView.isValid());
    },
    refreshButtons: function() {
      this.options.wizard && this.options.wizard.refreshFooter([ "next" ]);
    },
    onRender: function() {
      this.signeeListView = new SigneelistView(_.extend({
        hideEmptyView: this.options.groupModel.collection.length > 1,
        allowDragAndDrop: true,
        removeTabIndex: true
      }, this.childViewOptions()));
      this.signerListRegion.show(this.signeeListView);
      this.$el.find(".signee-form").addClass("binf-hidden");
      this.signeeFormView = new SigneeFormView(_.extend({
        parentView: this.options.parentView,
        userData: this.options.userData,
        alwaysShowButtons: true,
        cancelTooltip: lang.CloseFormTooltip
      }, this.childViewOptions(), {
        collection: this.options.groupCollection
      }));
      this.signerFormRegion.show(this.signeeFormView);
      this.signerFormRegion.$el.addClass("binf-hidden");
      this.ui.signeeGroupDroppableRegion.droppable({
        tolerance: "intersect",
        accept: ".signature-signee",
        drop: function(event, ui) {
          if (this.ui.signeeGroupDroppableRegion.hasClass("acceptable-hover")) {
            var dragObject = $(ui.draggable);
            var fromGroup = parseInt(dragObject.find(".signee-item").attr("data-group-index"));
            var toMoveModel = dragObject.data("model");
            var toGroup = this.options.index;
            this.triggerMethod("change:group", {
              fromGroup: fromGroup,
              toGroup: toGroup,
              toMoveModel: toMoveModel
            });
          }
        }.bind(this),
        over: function(event, ui) {
          var model = ui.draggable.data("model");
          if (!model || !this.collection.find({
            id: model.get("id")
          })) {
            this.ui.signeeGroupDroppableRegion.addClass("acceptable-hover");
          } else {
            this.ui.signeeGroupDroppableRegion.removeClass("acceptable-hover");
            ui.helper.addClass("invalid-drag");
          }
        }.bind(this),
        out: function(event, ui) {
          this.ui.signeeGroupDroppableRegion.removeClass("acceptable-hover");
          ui.helper.removeClass("invalid-drag");
        }.bind(this)
      });
      this.collection.length && this.ui.dragAndDropMessage.addClass && this.ui.dragAndDropMessage.addClass("binf-hidden");
      this.collection.length && this.ui.signeeGroupBody.addClass("show-border");
    },
    onClickAddSigner: function() {
      this.showAddSignerForm();
    },
    showAddSignerForm: function() {
      if (this.ui.signeeGroupContainer.outerHeight() < 275) {
        this.ui.addSignerButton.attr("disabled", true);
        this.ui.addSignerButton.attr("tabindex", "-1");
        this.ui.signeeGroupContainer.one(getTransitionEndEvent(), function() {
          this.ui.addSignerButton.attr("disabled", false);
          this.ui.addSignerButton.attr("tabindex", "0");
          this.signerFormRegion.$el.removeClass("binf-hidden");
          this.signeeFormView._afterActionPerform();
          this.options.signeeGroupsView.options.parentView.currentlyFocusedElement({
            preventScroll: true
          });
          this.signeeFormView.onFormFocus();
        }.bind(this));
        this.ui.signeeGroupContainer.css({
          "min-height": 275
        });
      } else {
        this.signerFormRegion.$el.removeClass("binf-hidden");
        this.signeeFormView._afterActionPerform();
        this.options.signeeGroupsView.options.parentView.currentlyFocusedElement({
          preventScroll: true
        });
        this.signeeFormView.onFormFocus();
      }
    },
    onAddUser: function(view, userModel) {
      this.collection.add(userModel);
      this.signerFormRegion.$el.addClass("binf-hidden");
      this.ui.signeeGroupContainer.css({
        "min-height": 0
      });
      this.triggerMethod("add:user:child", userModel);
      this.collection.length && this.ui.dragAndDropMessage.addClass && this.ui.dragAndDropMessage.addClass("binf-hidden");
      this.collection.length && this.ui.signeeGroupBody.addClass && this.ui.signeeGroupBody.addClass("show-border");
      this.refreshButtons();
      this.ui.addSignerButton.trigger && this.ui.addSignerButton.trigger("focus");
    },
    onRemoveUser: function(view, userModel) {
      this.collection.remove(userModel);
      this.triggerMethod("remove:user:child", userModel);
      !this.collection.length && this.ui.dragAndDropMessage.removeClass && this.ui.dragAndDropMessage.removeClass("binf-hidden");
      !this.collection.length && this.ui.signeeGroupBody.removeClass("show-border");
      this.refreshButtons();
    },
    onCancelAddUser: function() {
      this.signerFormRegion.$el.addClass("binf-hidden");
      this.ui.signeeGroupContainer.css({
        "min-height": 0
      });
      this.refreshButtons();
      this.ui.addSignerButton.trigger && this.ui.addSignerButton.trigger("focus");
    },
    onKeyUpRemoveGroupIcon: function(event) {
      switch (event.keyCode) {
       case 13:
       case 32:
        event.stopPropagation();
        event.preventDefault();
        this.onClickRemoveGroupIcon();
        break;
      }
    },
    onClickRemoveGroupIcon: function() {
      this.triggerMethod("remove:group", this.options.groupModel);
    },
    onGroupKeyDown: function(event) {
      switch (event.keyCode) {
       case 13:
       case 32:
        if (event.target === this.ui.signeeGroupContainer[0]) {
          event.stopPropagation();
          event.preventDefault();
          if (!this.signerFormRegion.$el.hasClass("binf-hidden")) {
            this.signeeFormView.onFormFocus();
          } else if (this.collection.length) {
            this.signeeListView.getElementByIndex(0).prop("tabindex", "0").trigger("focus");
          } else {
            this.ui.addSignerButton.trigger("focus");
          }
        }
        break;

       case 46:
        if (event.target === this.ui.signeeGroupContainer[0] && this.ui.removeGroupIcon.length) {
          event.stopPropagation();
          event.preventDefault();
          this.onClickRemoveGroupIcon();
        }
        break;

       case 9:
        if ($(event.target).hasClass("signee-item") || $(event.target).parent().hasClass("signee-item") || event.target === this.ui.addSignerButton[0] || event.target === this.ui.removeGroupIcon[0] || event.shiftKey && $(event.target).hasClass("d2-signature-signee") || !event.shiftKey && $(event.target).hasClass("d2-signature-signee-cancel")) {
          event.stopPropagation();
          event.preventDefault();
          if ($(event.target).hasClass("signee-item") || $(event.target).parent().hasClass("signee-item")) {
            if ($(event.target).parent().hasClass("signee-item")) {
              if (event.shiftKey) {
                $(event.target).parent().trigger("focus");
              } else {
                this.ui.addSignerButton.trigger("focus");
                $(event.target).parent().removeAttr("tabindex");
              }
            } else {
              if (event.shiftKey) {
                this.ui.removeGroupIcon.length ? this.ui.removeGroupIcon.trigger("focus") : this.ui.addSignerButton.trigger("focus");
                $(event.target).removeAttr("tabindex");
              } else {
                $(event.target).find(".d2-remove-signee").trigger("focus");
              }
            }
          } else if (event.target === this.ui.addSignerButton[0]) {
            event.shiftKey ? this.collection.length ? this.signeeListView.getElementByIndex(0).prop("tabindex", "0").trigger("focus") : this.ui.removeGroupIcon.length ? this.ui.removeGroupIcon.trigger("focus") : null : this.ui.removeGroupIcon.length ? this.ui.removeGroupIcon.trigger("focus") : this.collection.length ? this.signeeListView.getElementByIndex(0).prop("tabindex", "0").trigger("focus") : null;
          } else if (event.target === this.ui.removeGroupIcon[0]) {
            event.shiftKey ? this.ui.addSignerButton.trigger("focus") : this.collection.length ? this.signeeListView.getElementByIndex(0).prop("tabindex", "0").trigger("focus") : this.ui.addSignerButton.trigger("focus");
          } else if ($(event.target).hasClass("d2-signature-signee")) {
            this.signeeFormView.ui.cancel.trigger("focus");
          } else if ($(event.target).hasClass("d2-signature-signee-cancel")) {
            this.signeeFormView.onFormFocus();
          }
        }
        break;

       case 88:
        if (event.ctrlKey && $(event.target).hasClass("signee-item")) {
          event.stopPropagation();
          event.preventDefault();
          this.options.signeeGroupsView.dragging && this.options.signeeGroupsView.dragging.removeClass("dragging");
          this.options.signeeGroupsView.dragging = $(event.target).parent();
          this.options.signeeGroupsView.dragging.addClass("dragging");
        }
        break;

       case 86:
        if (event.ctrlKey && event.target === this.ui.signeeGroupContainer[0] && this.options.signeeGroupsView.dragging) {
          event.stopPropagation();
          event.preventDefault();
          this.options.signeeGroupsView.dragging.removeClass("dragging");
          var fromGroup = parseInt(this.options.signeeGroupsView.dragging.find(".signee-item").attr("data-group-index"));
          var toMoveModel = this.options.signeeGroupsView.dragging.data("model");
          var toGroup = this.options.index;
          fromGroup !== toGroup && this.triggerMethod("change:group", {
            fromGroup: fromGroup,
            toGroup: toGroup,
            toMoveModel: toMoveModel
          });
          this.options.signeeGroupsView.dragging = null;
          this.options.signeeGroupsView.children.findByIndex(toGroup).ui.signeeGroupContainer.trigger("focus");
        }
        break;
      }
    },
    onGroupKeyUp: function(event) {
      switch (event.keyCode) {
       case 27:
        if ($(event.target).hasClass("signee-item") || event.target === this.ui.addSignerButton[0] || event.target === this.ui.removeGroupIcon[0]) {
          event.stopPropagation();
          event.preventDefault();
          $(event.target).hasClass("signee-item") && $(event.target).removeAttr("tabindex");
          this.ui.signeeGroupContainer.trigger("focus");
        }
        break;
      }
    }
  });
});