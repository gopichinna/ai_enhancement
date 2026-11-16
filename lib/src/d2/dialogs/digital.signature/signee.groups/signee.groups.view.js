/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "csui/dialogs/modal.alert/modal.alert", "d2/dialogs/digital.signature/signee.groups/signee.group.layout.view", "i18n!d2/dialogs/digital.signature/signee.groups/impl/nls/lang", "hbs!d2/dialogs/digital.signature/signee.groups/impl/signee.groups.view", "css!d2/dialogs/digital.signature/signee.groups/impl/signee.groups.view" ], function(_, Backbone, Marionette, ModalAlert, SigneeGroupView, lang, SigneeGroupsViewTemplate) {
  "use strict";
  return Marionette.CompositeView.extend({
    className: "signature-signee-groups-layout",
    childView: SigneeGroupView,
    childViewContainer: ".signature-signee-groups",
    template: SigneeGroupsViewTemplate,
    templateHelpers: function() {
      return {
        lang: lang
      };
    },
    ui: {
      addGroupBtnContainer: ".signature-signee-add-group",
      addGroupBtn: ".signature-signee-add-group-button"
    },
    events: {
      "click @ui.addGroupBtn": "onAddGroupBtnClick"
    },
    childEvents: {
      "remove:group": "onRemoveGroup",
      "change:group": "onChangeItemGroup",
      "add:user:child": "onChildAddUser",
      "remove:user:child": "onChildRemoveUser"
    },
    childViewOptions: function(childModel, index) {
      return {
        context: this.options.context,
        model: this.options.model,
        collection: childModel.get("usersList"),
        groupCollection: this.collection,
        index: index,
        groupModel: childModel,
        wizard: this.options.wizard,
        signeeGroupsView: this,
        parentView: this.options.parentView,
        userData: this.options.userData
      };
    },
    constructor: function SigneeGroupsView() {
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
    },
    onRender: function() {
      this.updateAddGroupButton();
    },
    onShow: function() {
      this.collection.length === 1 && this.collection.at(0).get("usersList").length && this.onAddGroupBtnClick();
      this.updateAddGroupButton();
    },
    updateAddGroupButton: function() {
      var method = "removeClass";
      this.collection.each(function(model) {
        method = model.get("usersList") instanceof Backbone.Collection && model.get("usersList").length ? method : "addClass";
      });
      this.ui.addGroupBtnContainer[method]("binf-hidden");
      this.options.parentView.currentlyFocusedElement({
        preventScroll: true
      });
    },
    isValid: function() {
      var valid = true;
      this.children.each(function(view) {
        valid = valid && view.isValid();
      });
      return valid;
    },
    refreshButtons: function() {
      this.options.wizard && this.options.wizard.refreshFooter([ "next" ]);
    },
    onAddGroupBtnClick: function() {
      this.collection.add(new Backbone.Model({
        usersList: new Backbone.Collection()
      }));
      this.render();
      this.refreshButtons();
      this.options.parentView.currentlyFocusedElement({
        preventScroll: true
      });
      this.children.findByIndex(this.children.length - 1).ui.signeeGroupContainer.trigger("focus");
    },
    onRemoveGroup: function(view, model) {
      var hasUsers = model.get("usersList").length > 0;
      if (hasUsers) {
        var me = this, buttonOptions = {
          labelYes: lang.RemoveGroupButtonLabel,
          showNo: false,
          showCancel: true
        };
        var msg = _.str.sformat(lang.RemoveGroupConfirmMessage, _.str.sformat(lang.SigneeGroup_Title, this.collection.findIndex(model) + 1));
        ModalAlert.confirmQuestion(function(result) {
          if (result) {
            me.collection.remove(model);
            me.render();
            me.refreshButtons();
            me.triggerMethod("update:email:form");
            me.children.findByIndex(0).ui.signeeGroupContainer.trigger("focus");
          }
        }, msg, lang.RemoveGroupConfirmTitle, {
          buttons: buttonOptions
        });
      } else {
        this.collection.remove(model);
        this.render();
        this.refreshButtons();
        this.triggerMethod("update:email:form");
        this.children.findByIndex(0).ui.signeeGroupContainer.trigger("focus");
      }
    },
    onChangeItemGroup: function(view, data) {
      var fromGroup = data.fromGroup, toGroup = data.toGroup, toMoveModel = data.toMoveModel;
      this.collection.at(fromGroup).get("usersList").remove(toMoveModel);
      this.collection.at(toGroup).get("usersList").add(toMoveModel);
      this.render();
      this.refreshButtons();
    },
    onChildAddUser: function() {
      this.triggerMethod("update:email:form");
      if (this.collection.length === 1 && this.collection.at(0).get("usersList").length === 1) {
        this.onAddGroupBtnClick();
      } else {
        this.updateAddGroupButton();
      }
    },
    onChildRemoveUser: function() {
      this.triggerMethod("update:email:form");
      this.updateAddGroupButton();
    }
  });
});