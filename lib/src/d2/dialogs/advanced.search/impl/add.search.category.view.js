/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/utils/url", "csui/lib/alpaca/js/alpaca.lite", "csui/utils/contexts/factories/connector", "csui/controls/table/inlineforms/base/inline.edit.view", "d2/dialogs/advanced.search/impl/add.search.category.form.view", "d2/dialogs/advanced.search/impl/add.search.category.error.view", "d2/utils/advanced.search.utils", "d2/utils/constants", "i18n!d2/utils/impl/nls/lang" ], function($, _, Url, Alpaca, ConnectorFactory, InlineEditView, AddSearchCategoryFormView, AddSearchCategoryErrorView, AdvancedSearchUtils, constants, utilsLang) {
  "use strict";
  var AddSearchCategoryView = InlineEditView.extend({
    constructor: function AddSearchCategoryView() {
      InlineEditView.prototype.constructor.apply(this, arguments);
    },
    className: function() {
      return InlineEditView.prototype.className + " add-" + this.options.categoryType + "-category";
    },
    cancelClicked: function() {
      this.baseInlineFormView.trigger("end:of:edit");
    },
    refreshTabableElements: function() {
      this.tabableElements = this.$el.find("input:not([disabled]),  select:not([disabled]), button:not([disabled]), .d2list-search-toolbar > a:not([disabled])").filter(":visible").toArray();
    },
    saveClicked: function(event) {
      var me = this, dfd = $.Deferred(), formValues = this.baseInlineFormView.getValues(), categoryName = formValues["object_name"], restrictedGroups = formValues["restricted_to_groups"];
      AdvancedSearchUtils.saveSavedSearchCategory({
        connector: this.options.context.getObject(ConnectorFactory),
        name: categoryName,
        category: this.options.category,
        parentId: this.options.parentId,
        restrictedGroups: restrictedGroups
      }).done(function(response) {
        me._handleSuccess(response);
      }).fail(function(error) {
        me._handleErrorInForm(error);
        dfd.reject();
      });
      event.preventDefault();
      event.stopPropagation();
      return dfd.promise();
    },
    onRender: function() {
      this.baseInlineFormView = new AddSearchCategoryFormView(this.options);
      this.getRegion("inlineFormRegion").show(this.baseInlineFormView);
      this.listenTo(this.baseInlineFormView, "enable:save:btn", this._enableSaveBtn).listenTo(this.baseInlineFormView, "cancel:edit:form", this.cancel).listenTo(this.baseInlineFormView, "end:of:edit", this.onFormEndOfEdit).listenTo(this.baseInlineFormView, "d2:change:form:field", this.onFormFieldChange);
      this.refreshTabableElements();
      this.$el.closest("tr").attr("addchildnodetype", this.options.categoryType);
      setTimeout(function() {
        var $scrollableEl = this.$el.closest(".d2-single-select-tree-region"), currentScrollTop = $scrollableEl.scrollTop(), currentElHeight = this.$el.outerHeight();
        $scrollableEl.scrollTop(currentScrollTop + currentElHeight);
        this.$el.find(".csui-field-text .cs-textfield input").trigger("focus");
      }.bind(this), 100);
    },
    onFormEndOfEdit: function() {
      this.trigger("form:closed");
      this.destroy();
    },
    _handleSuccess: function(response) {
      var treeNode = this.options.treeNodeData.node, createdNode = AdvancedSearchUtils.createTreeNode(response.properties), parentPath = treeNode.parent.data.path;
      createdNode.path = parentPath ? _.str.sformat(utilsLang.searchLocationPath, parentPath, createdNode.title) : createdNode.title;
      createdNode.creationNode = false;
      treeNode.match = true;
      treeNode.applyPatch(createdNode);
      treeNode.render(true);
      treeNode.setActive(true);
      this.baseInlineFormView.trigger("end:of:edit");
    },
    _handleErrorInForm: function(error) {
      if (this.options.categoryType === "public") {
        this._showCustomFormErrorMessage(error);
      } else {
        this._showCustomFieldErrorMessage(error);
      }
    },
    _showCustomFieldErrorMessage: function(error) {
      this._hideCustomFieldErrorMessage();
      var alpacaFieldView = this.baseInlineFormView.form.childrenByPropertyId["object_name"].view, messageTemplateDescriptor = alpacaFieldView.getTemplateDescriptor("message"), customErrorMessageEl = Alpaca.tmpl(messageTemplateDescriptor, {
        id: "userErrorMessage",
        message: error.message,
        view: alpacaFieldView
      });
      customErrorMessageEl.addClass("d2-add-category-error-message").attr("role", "alert");
      this.baseInlineFormView.$el.find(".cs-field-write").append(customErrorMessageEl);
    },
    _hideCustomFieldErrorMessage: function() {
      this.baseInlineFormView.$el.find(".cs-field-write").find(".d2-add-category-error-message").remove();
    },
    _showCustomFormErrorMessage: function(error) {
      this._hideCustomFormErrorMessage();
      var errorView = new AddSearchCategoryErrorView({
        errorMessage: error.message
      });
      errorView.render();
      this.$el.prepend(errorView.$el);
    },
    _hideCustomFormErrorMessage: function() {
      this.$el.find(".d2-add-category-error-message").remove();
    },
    onFormFieldChange: function() {
      if (this.options.categoryType === "public") {
        this._hideCustomFormErrorMessage();
      } else {
        this._hideCustomFieldErrorMessage();
      }
    }
  });
  return AddSearchCategoryView;
});