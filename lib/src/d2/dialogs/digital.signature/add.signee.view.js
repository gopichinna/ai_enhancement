/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "csui/behaviors/keyboard.navigation/tabables.behavior", "csui/controls/checkbox/checkbox.view", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/dialogs/digital.signature/signature.email/signature.email.form.view", "d2/dialogs/digital.signature/signee.groups/signee.groups.view", "d2/dialogs/digital.signature/signee.single.group/signee.single.group.view", "i18n!d2/dialogs/digital.signature/impl/nls/lang", "hbs!d2/dialogs/digital.signature/impl/add.signee.view", "css!d2/dialogs/digital.signature/impl/add.signee.view" ], function($, _, Backbone, Marionette, TabablesBehavior, CheckboxView, WizardTabableRegionBehavior, SignatureEmailFormView, SigneeGroupsView, SigneeSingleGroupView, lang, AddSigneeTemplate) {
  "use strict";
  return Marionette.LayoutView.extend({
    template: AddSigneeTemplate,
    className: "d2-add-signee-view",
    behaviors: {
      TabableRegion: {
        behaviorClass: WizardTabableRegionBehavior
      }
    },
    regions: {
      signeeView: ".signers",
      checkboxContainer: ".d2-define-signee-order-checkbox-container",
      emailContainer: ".d2-signature-email-container"
    },
    childEvents: {
      "update:email:form": "updateEmailForm"
    },
    templateHelpers: function() {
      return {
        defineOrder: this.model.get("allow_flow_decisions"),
        defineOrderLabel: lang.DefineOrderLabel,
        defineOrderInfo: lang.DefineOrderInfo
      };
    },
    constructor: function AddSigneeView(options) {
      if (!options.collection) {
        options.collection = new Backbone.Collection();
      }
      if (!options.userData) {
        options.userData = new Backbone.Collection();
      }
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.currentlyFocusedElement = function(event) {
        var tabElements = this.$(TabablesBehavior.focusablesSelector).filter(":visible:not([disabled])"), elToFocus;
        if (tabElements.length) {
          tabElements.prop("tabindex", "-1");
          tabElements = tabElements.filter(":not(.add-signer-button)");
          tabElements = tabElements.filter(":not(.signee-remove-group)");
          tabElements.prop("tabindex", 0);
        }
        if (!!event && event.shiftKey) {
          elToFocus = tabElements[tabElements.length - 1];
        } else {
          elToFocus = tabElements[0];
        }
        if (!event.preventScroll) {
          var elemScrollParent = this.$el;
          var elemTop = $(elToFocus).offset().top, viewportTop = elemScrollParent[0].getBoundingClientRect().top, viewportBottom = elemScrollParent[0].getBoundingClientRect().bottom, isElemVisible = elemTop > viewportTop && elemTop < viewportBottom;
          if (!isElemVisible) {
            var currScrollTop = elemScrollParent.scrollTop();
            elemTop < viewportBottom ? elemScrollParent.scrollTop(currScrollTop + (elemTop - viewportBottom)) : elemScrollParent.scrollTop(currScrollTop - (viewportTop - elemTop));
          }
        }
        return elToFocus;
      };
    },
    onRender: function() {
      this.childViewOptions = {
        parentView: this,
        userData: this.options.userData,
        collection: this.collection,
        model: this.options.model,
        context: this.options.context,
        wizard: this.options.wizard
      };
      if (this.model.get("allow_flow_decisions")) {
        var checkboxView = new CheckboxView();
        this.checkboxContainer.show(checkboxView);
        this.listenTo(checkboxView.model, "change:checked", function(model, checked) {
          this.collection = this.getCollection(this.collection, checked);
          if (checked === "true") {
            this.checkboxContainer.$el.addClass("checked");
            this.signeeGroupsView = new SigneeGroupsView(this.childViewOptions);
            this.signeeView.show(this.signeeGroupsView);
          } else {
            this.checkboxContainer.$el.removeClass("checked");
            this.signeeSingleGroupView = new SigneeSingleGroupView(this.childViewOptions);
            this.signeeView.show(this.signeeSingleGroupView);
          }
          this.refreshButtons();
        }.bind(this));
      }
      this.signeeSingleGroupView = new SigneeSingleGroupView(this.childViewOptions);
      this.signatureEmailFormView = new SignatureEmailFormView({
        digitalSignatureModel: this.options.model,
        wizard: this.options.wizard
      });
      this.signeeView.show(this.signeeSingleGroupView);
      this.emailContainer.show(this.signatureEmailFormView);
      this.updateEmailForm();
    },
    isValid: function() {
      var isValid = this.signatureEmailFormView && this.signatureEmailFormView.isValidForm();
      if (this.signeeSingleGroupView && !this.signeeSingleGroupView.isDestroyed && !this.signeeSingleGroupView._isDestroyed) {
        return isValid && this.signeeSingleGroupView.isValid();
      } else if (this.signeeGroupsView && !this.signeeGroupsView.isDestroyed && !this.signeeGroupsView._isDestroyed) {
        return isValid && this.signeeGroupsView.isValid();
      }
      return false;
    },
    refreshButtons: function() {
      this.options.wizard && this.options.wizard.refreshFooter([ "next" ]);
    },
    getCollection: function(collection, checked) {
      var removeModels = _.clone(collection.models);
      if (checked === "true") {
        collection.add(new Backbone.Model({
          usersList: new Backbone.Collection(collection.models)
        }), {
          silent: true
        });
        collection.remove(removeModels, {
          silent: true
        });
      } else {
        collection.each(function(model) {
          model.get("usersList") instanceof Backbone.Collection && model.get("usersList").each(function(groupModel) {
            collection.add(groupModel, {
              silent: true
            });
          });
        });
        collection.remove(removeModels, {
          silent: true
        });
      }
      return collection;
    },
    updateEmailForm: function() {
      if (this.collection.length) {
        if (this.collection.at(0).get("usersList") instanceof Backbone.Collection) {
          var hasUser = false;
          this.collection.each(function(model) {
            hasUser = hasUser || model.get("usersList").length;
          });
          if (hasUser) {
            this.emailContainer.$el.removeClass("binf-hidden");
            this.signatureEmailFormView.$el.find(".cs-field-write textarea").trigger("keydown");
          } else {
            this.emailContainer.$el.addClass("binf-hidden");
          }
          return this.currentlyFocusedElement({
            preventScroll: true
          });
        } else {
          this.emailContainer.$el.removeClass("binf-hidden");
          this.signatureEmailFormView.$el.find(".cs-field-write textarea").trigger("keydown");
          return this.currentlyFocusedElement({
            preventScroll: true
          });
        }
      }
      this.emailContainer.$el.addClass("binf-hidden");
      this.currentlyFocusedElement({
        preventScroll: true
      });
    }
  });
});