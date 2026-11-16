/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "csui/models/command", "csui/utils/commandhelper", "csui/utils/contexts/factories/connector", "d2/utils/advanced.search.utils", "d2/models/savedsearch/savedsearch.model", "d2/controls/globalmessage/globalmessage", "i18n!d2/commands/nls/localized.strings" ], function(require, _, $, CommandModel, CommandHelper, ConnectorFactory, AdvancedSearchUtils, SavedSearchModel, GlobalMessage, lang) {
  "use strict";
  return CommandModel.extend({
    defaults: {
      signature: "D2-CreateSearchCategory",
      command_key: "D2-CreateSearchCategory",
      name: lang.CommandNameAddCategory,
      scope: "single"
    },
    enabled: function(status) {
      var container = status.container, enabled = !container.get("id") || CommandModel.prototype.enabled.apply(this, arguments);
      if (enabled && container.isAvailablePublic()) {
        enabled = container.searchConfig && container.searchConfig.canCreatePublicSearch;
      }
      return enabled;
    },
    execute: function(status, options) {
      var me = this, deferred = $.Deferred(), node = CommandHelper.getJustOneNode(status), context = status.context || options && options.context, connector = context.getObject(ConnectorFactory);
      status.suppressFailMessage = true;
      status.suppressSuccessMessage = true;
      var parentId = node.get("id"), category = node.get("search-category"), isPublic = node.isAvailablePublic(), categoryType = isPublic ? "public" : "private";
      this._showCreateDialog({
        context: context,
        categoryType: categoryType,
        isPublic: isPublic
      }).done(function(data) {
        var model = new SavedSearchModel(undefined, {
          connector: connector
        });
        model.save(_.extend({
          "search-category": category,
          parent_id: parentId,
          r_object_type: "d2c_query_category"
        }, data)).done(function() {
          var successMessage = _.str.sformat(lang.AdvanceSearchAddCategorySuccessMessage, model.get("name"));
          GlobalMessage.showMessage("success", successMessage, undefined, {});
          CommandHelper.refreshNode(model).done(function() {
            model.set({
              parent_id: parentId
            }, {
              silent: true
            });
            me.addNodeToCollection(model, status);
            deferred.resolve();
          }).fail(deferred.reject);
        }).fail(function(error) {
          GlobalMessage.showMessage("error", error.message, undefined, {});
          deferred.reject(error);
        });
      }).fail(deferred.reject);
      return deferred.promise();
    },
    addNodeToCollection: function(item, status) {
      var collection = status.originatingView.collection;
      item.isLocallyCreated = true;
      item.collection = collection;
      collection.unshift(item);
    },
    _showCreateDialog: function(options) {
      var self = this, dfd = $.Deferred(), categoryType = options.categoryType, context = options.context, data = {};
      require([ "d2/dialogs/advanced.search/impl/add.search.category.form.view", "dctmw/dialogs/modal.alert.custom.content/customizable.modal.alert" ], function(AddSearchCategoryFormView, ModelAlert) {
        var modalClass = "add-category-model", addSearchCategoryView = new AddSearchCategoryFormView({
          context: context,
          categoryType: categoryType
        });
        if (options.isPublic) {
          modalClass += " public-category";
        }
        function onFormRendered() {
          addSearchCategoryView.$("input").attr("tabindex", 0);
          updateBtnState();
        }
        function updateBtnState(isValid) {
          var $modelContent = addSearchCategoryView.$el.closest(".binf-modal-content"), $primaryButton = $modelContent.find(".binf-modal-footer .csui-yes");
          if (isValid) {
            $primaryButton.removeAttr("disabled");
          } else {
            $primaryButton.attr("disabled", "disabled");
          }
        }
        function onFieldValueUpdate() {
          var name = addSearchCategoryView.getValues()["object_name"], restricted_to_groups = addSearchCategoryView.getValues()["restricted_to_groups"];
          data = {
            object_name: name,
            restricted_to_groups: restricted_to_groups
          };
          addSearchCategoryView.validateForm(false, true).done(updateBtnState);
        }
        self.listenToOnce(addSearchCategoryView, "render:form", onFormRendered);
        self.listenTo(addSearchCategoryView, "d2:change:formValidation", onFieldValueUpdate);
        ModelAlert.confirmQuestion(function(result) {
          result ? dfd.resolve(data) : dfd.reject();
        }, "", lang.CommandNameAddCategory, {
          buttons: {
            showYes: true,
            labelYes: lang.AdvanceSearchAddCategoryAddButtonLabel,
            showNo: false,
            showCancel: true
          },
          contentView: addSearchCategoryView,
          modalClass: modalClass
        });
      }, dfd.reject);
      return dfd.promise();
    }
  });
});