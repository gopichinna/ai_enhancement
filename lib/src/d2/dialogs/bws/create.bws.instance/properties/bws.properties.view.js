/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import $ from "nuc/lib/jquery";

import _ from "nuc/lib/underscore";

import ProfileMetadataPropertiesView from "d2/dialogs/new.file/profile.metadata.properties.view";

class BwsCreateMetadataPropertiesView extends ProfileMetadataPropertiesView {
  constructor(options) {
    options.collection = options.parent.options.propertyFormCollection;
    super(options);
    this.isFormValid = false;
    this._updateCreateButton();
    this.listenTo(this, "render:forms", () => {
      this._syncObjectNameField();
      this._validateAndToggleCreate();
      setTimeout(() => this._validateAndToggleCreate(), 0);
    });
    this.listenTo(this, "show", () => {
      this._validateAndToggleCreate();
      setTimeout(() => this._validateAndToggleCreate(), 0);
    });
    const footerView = this._getFooterView();
    if (footerView) {
      this.listenTo(footerView, "render", () => this._updateCreateButton());
    }
    this.listenTo(this.options.node, "change:isSaved", () => {
      this._syncObjectNameField();
    });
    this.listenTo(this, "d2:metadata:formFieldChange", () => {
      this._validateAndToggleCreate();
    });
  }
  _validateAndToggleCreate() {
    this._validateAllForms(true, false).done(isValid => {
      this.isFormValid = !!isValid;
      this._updateCreateButton();
    });
  }
  _updateCreateButton() {
    const model = this._getNextButtonModel();
    if (model) {
      model.set("disabled", !this.isFormValid);
      return;
    }
    const footer = this._getFooterView();
    const el = footer && footer.$el.find("otc-button.default-next-button.nextBtn.primaryBtn")[0];
    if (el) {
      if (this.isFormValid) {
        el.removeAttribute("disabled");
        el.setAttribute("aria-disabled", "false");
        el.classList.remove("binf-disabled");
      } else {
        el.setAttribute("disabled", "");
        el.setAttribute("aria-disabled", "true");
        el.classList.add("binf-disabled");
      }
    }
  }
  _getFooterView() {
    return this.options?.wizard?.footerView || this.options?.parent?.wizard?.footerView;
  }
  _getNextButtonModel() {
    const footerView = this._getFooterView();
    if (!footerView || !footerView.collection) return null;
    return footerView.collection.findWhere({
      id: "next"
    }) || null;
  }
  _validateAllForms(refreshState, validateOnlyRequiredFields) {
    const dfd = $.Deferred();
    const childViews = [];
    if (this.tabContent?.children?.forEach) {
      this.tabContent.children.forEach(tab => {
        if (tab?.content) childViews.push(tab.content);
      });
    }
    if (!childViews.length) {
      dfd.resolve(false);
      return dfd.promise();
    }
    const promises = _.map(childViews, v => {
      if (typeof v.validateForm === "function") {
        try {
          if (v.validateForm.length >= 3) {
            return v.validateForm(!!refreshState, !!validateOnlyRequiredFields, {
              hideInitValidationError: true
            });
          }
          if (v.validateForm.length === 2) {
            const p = $.Deferred();
            const res = v.validateForm(!!refreshState, !!validateOnlyRequiredFields);
            $.when(res).done(r => p.resolve(r)).fail(() => p.resolve(false));
            return p.promise();
          }
          const p = $.Deferred();
          const res = v.validateForm();
          $.when(res).done(r => p.resolve(r)).fail(() => p.resolve(false));
          return p.promise();
        } catch (e) {
          const p = $.Deferred();
          p.resolve(false);
          return p.promise();
        }
      }
      const p = $.Deferred();
      p.resolve(true);
      return p.promise();
    });
    $.when.apply($, promises).done(function() {
      const results = arguments.length > 1 ? Array.prototype.slice.call(arguments) : [ arguments[0] ];
      dfd.resolve(!_.contains(results, false));
    }).fail(() => dfd.resolve(false));
    return dfd.promise();
  }
  _syncObjectNameField() {
    this._updateFormModel();
    this._updateObjectNameField();
  }
  _initProfileMetadataProperties() {}
  _updateObjectNameField() {
    const field = this.getObjectNameField();
    if (field) {
      field.curVal = this.options.node.get("name");
      field.render();
    }
  }
  _updateFormModel() {
    const field = this.getObjectNameField();
    if (field) {
      field.model.set({
        data: this.options.node.get("name")
      });
    }
  }
  getObjectNameField() {
    let objectNameField;
    if (this.tabContent) {
      this.tabContent.children.forEach(tabContent => {
        const d2FormView = tabContent.content;
        const sourceForm = d2FormView.getParentFormForControl("object_name");
        const keyPathMap = sourceForm?._keyPathMap;
        if (keyPathMap && _.has(keyPathMap, "object_name")) {
          const path = keyPathMap["object_name"].fieldPath;
          objectNameField = sourceForm.getAlpacaControlByPath(path).fieldView;
        }
      });
    }
    return objectNameField;
  }
  onChangeFormField() {
    super.onChangeFormField.apply(this, arguments);
    const objectNameField = this.getObjectNameField();
    if (objectNameField) {
      this.options.node.set({
        name: objectNameField.model.get("data")
      });
    }
    this._validateAndToggleCreate();
  }
}

Object.defineProperty(BwsCreateMetadataPropertiesView.prototype.constructor, "name", {
  value: "BwsCreateMetadataPropertiesView"
});

export default BwsCreateMetadataPropertiesView;