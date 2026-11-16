/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "d2/dialogs/digital.signature/signee.form/signee.form.view", "d2/dialogs/digital.signature/signee.list/signee.list.view", "i18n!d2/dialogs/digital.signature/signee.single.group/impl/nls/lang", "hbs!d2/dialogs/digital.signature/signee.single.group/impl/signee.single.group.view", "css!d2/dialogs/digital.signature/signee.single.group/impl/signee.single.group.view" ], function(_, Backbone, Marionette, SigneeFormView, SigneeListView, lang, SigneeSingleGroupViewTemplate) {
  "use strict";
  return Marionette.LayoutView.extend({
    template: SigneeSingleGroupViewTemplate,
    className: "signature-single-group",
    ui: {
      header: ".single-group-signee-list-header"
    },
    regions: {
      signeeForm: ".single-group-signee-form",
      signeeList: ".single-group-signee-list"
    },
    templateHelpers: function() {
      return {
        signeeSingleListHeader: lang.signeeSingleListHeader
      };
    },
    constructor: function SigneeSingleGroupView() {
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
    },
    childEvents: {
      "add:user": "onAddUser",
      "remove:user": "onRemoveUser",
      "signee:list:empty": "focusForm"
    },
    onRender: function() {
      this.childViewOptions = {
        collection: this.collection,
        model: this.options.model,
        context: this.options.context,
        parentView: this.options.parentView,
        wizard: this.options.wizard,
        userData: this.options.userData
      };
      this.signeeFormView = new SigneeFormView(this.childViewOptions);
      this.signeeListView = new SigneeListView(_.extend({
        emptyViewMessage: lang.signeeSingleListEmptyMessage
      }, this.childViewOptions));
      this.signeeForm.show(this.signeeFormView);
      this.signeeList.show(this.signeeListView);
      !this.collection.length && this.ui.header.addClass("binf-hidden");
      this.refreshButtons();
    },
    isValid: function() {
      return this.collection.length && this.signeeFormView.isValid();
    },
    refreshButtons: function() {
      this.options.wizard && this.options.wizard.refreshFooter([ "next" ]);
    },
    onAddUser: function(view, userModel) {
      this.collection.add(userModel);
      this.triggerMethod("update:email:form");
      this.collection.length && this.ui.header.removeClass("binf-hidden");
      this.refreshButtons();
    },
    onRemoveUser: function(view, userModel) {
      this.collection.remove(userModel);
      this.triggerMethod("update:email:form");
      !this.collection.length && this.ui.header.addClass("binf-hidden");
      this.refreshButtons();
    },
    focusForm: function() {
      this.signeeFormView.$el.trigger("focus");
    }
  });
});