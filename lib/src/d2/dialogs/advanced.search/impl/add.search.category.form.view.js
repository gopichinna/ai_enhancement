/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/utils/url", "csui/models/form", "dctmw/utils/utils", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "d2/utils/advanced.search.utils", "d2/controls/form/d2.form.view", "d2/widgets/metadata/utils/form.converter", "i18n!d2/dialogs/advanced.search/impl/nls/lang", "css!d2/dialogs/advanced.search/impl/add.search.category.form" ], function($, _, Url, FormModel, utils, RestResources, RestLinkrels, AdvancedSearchUtils, D2FormView, MetadataConverter, lang) {
  "use strict";
  var AddSearchCategoryFormView = D2FormView.extend({
    className: function() {
      return D2FormView.prototype.className.apply(this, arguments) + " add-category-form add-" + this.options.categoryType + "-category-form";
    },
    constructor: function AddSearchCategoryFormView(options) {
      options || (options = {});
      var form = this._getForm(options);
      options.topAlignedLabel = true;
      options.model = new FormModel(form.propertiesConfig[0]);
      options.model.get("schema")["initial_invalid"] = true;
      options.mode = "create";
      D2FormView.prototype.constructor.apply(this, arguments);
      this.listenTo(this, "valid:field", this._raiseValidChangeEvent);
      this.listenTo(this, "invalid:field", this._raiseInvalidChangeEvent);
      this.listenTo(this, "d2:change:formValidation", this.onFormFieldChangeValidate);
      this.$el.on("focusin focusout", function(event) {
        event.stopPropagation();
      });
    },
    onFormFieldChangeValidate: function() {
      this.onFormFieldValidate({
        refreshState: false,
        validateOnlyRequiredFields: true
      });
    },
    onFormFieldValidate: function(options) {
      options = options || {};
      var dfd = $.Deferred(), refreshState = !!options.refreshState, validateOnlyRequiredFields = !!options.validateOnlyRequiredFields;
      this.validateForm(refreshState, validateOnlyRequiredFields).done(function(isValid) {
        this.formValidated = isValid;
        this.trigger("enable:save:btn");
        if (isValid) {
          dfd.resolve();
        } else {
          dfd.reject();
        }
      }.bind(this));
      return dfd.promise();
    },
    checkAllformFields: function() {
      return !!this.formValidated;
    },
    _getAddCategoryForm: function() {},
    _getAddPublicCategoryForm: function() {
      return {
        dialog: {
          content: {
            order: 1,
            text: {
              id: "object_name",
              condition_required: true,
              label: lang.categoryNameFieldLabel,
              order: 1
            },
            list: {
              id: "restricted_to_groups",
              label: lang.categoryRestrictedToLabel,
              assistance_type: "custom",
              asynchronous: true,
              order: 2,
              rows: 5
            }
          }
        }
      };
    },
    _getAddPrivateCategoryForm: function() {
      return {
        dialog: {
          content: {
            order: 1,
            text: {
              id: "object_name",
              condition_required: true,
              label: lang.categoryNameFieldLabel,
              order: 1
            }
          }
        }
      };
    },
    _getForm: function(options) {
      var formConverterOptions = {
        actionMode: "create",
        layoutMode: "singleCol"
      }, formContent;
      if (options.categoryType === "public") {
        formContent = this._getAddPublicCategoryForm();
        formConverterOptions["extendFieldOptions"] = function(field) {
          field.getDataSourceCallBack = function(attr, alpField) {
            var fieldOptions = alpField.options.ds, fieldView = alpField.fieldView, filter = fieldOptions && fieldOptions.filter || "";
            return AdvancedSearchUtils.getGroupsForRestrictedTo({
              filter: filter,
              context: options.context,
              collection: fieldView.collection
            });
          };
        };
      } else {
        formContent = this._getAddPrivateCategoryForm();
      }
      return MetadataConverter.convertConfig(formContent, formConverterOptions);
    }
  });
  return AddSearchCategoryFormView;
});