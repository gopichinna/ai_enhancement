/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "csui/controls/form/fields/alpaca/alpcsuiarrayfield", "d2/overrides/csui/controls/form/fields/alpaca/impl/d2.arrayfield.resizer.mixin" ], function(_, $, CsuiArrayField, D2ArrayFieldResizerMixin) {
  var prototype = CsuiArrayField.prototype;
  var oldShowItemsInWriteMode = prototype._showItemsInWriteMode;
  var oldPostRender = prototype.postRender;
  var oldRemoveItem = prototype.removeItem;
  var oldUpdateToolbars = prototype.updateToolbars;
  function setVisible(control, value) {
    var parent;
    if (value === true) {
      if (control.isHidden()) {
        parent = _findParent(control);
        parent && parent.css({
          display: ""
        });
        control.schema["hidden"] = false;
        control.show();
      }
    } else {
      parent = _findParent(control);
      if (!control.isHidden() || control.isHidden() && parent && parent.css("display") !== "none") {
        parent && parent.css({
          display: "none"
        });
        control.schema["hidden"] = true;
        control.hide();
      }
    }
  }
  function _findParent(control) {
    return control && control.fieldView && control.fieldView.$el && $(control.fieldView.$el).closest(".alpaca-container-item");
  }
  prototype._showItemsInWriteMode = function(itemIndex) {
    oldShowItemsInWriteMode.apply(this, arguments);
    if (itemIndex) {
      _.each(this.children[itemIndex].children, function(child) {
        setVisible(child, !child.schema.hidden);
      });
      var writeFieldsInRow = this.children[itemIndex].getFieldEl().find(".cs-field-write");
      writeFieldsInRow.length && $(writeFieldsInRow[0]).find(":input").trigger("focus");
    }
  };
  prototype.postRender = function() {
    oldPostRender.apply(this, arguments);
    _.each(this.children, function(row) {
      _.each(row.children, function(cell) {
        setVisible(cell, !cell.schema.hidden);
      });
    });
    var gridState = this.connector.config.formView.options.originatingView.options.gridState;
    var firstColId = this.options["firstColId"];
    if (gridState && firstColId && gridState[firstColId]) {
      this.options.showExpanded = gridState[firstColId];
    }
    var parentObjectField = this.getParent();
    var setEl = this.containerItemEl.find(".cs-form-set-container");
    this.initCustomization?.call(this);
    var delayedRestrucutureSet = _.debounce(function() {
      parentObjectField.restructureSetContainer(setEl, parentObjectField);
    }, 100);
    this.containerItemEl.on("d2:refresh:setcontainer", delayedRestrucutureSet);
  };
  prototype._onFieldChanged = function(event) {
    event.stopPropagation();
    if (!this.options.submitArray) {
      var regExp = /\[([^\]]+)\]\/?([^\]]*)$/;
      var matches = regExp.exec(event.fieldpath);
      if (!!matches && matches.length === 4 && matches[2]) {
        this.data[parseInt(matches[1])][matches[2]] = event.fieldvalue;
      } else {
        this.data[parseInt(matches[1])] = event.fieldvalue;
      }
    }
    if (this.options.submitArray || this.options.mode === "create") {
      this._raiseValueChanged(this.options.mode === "create" ? this.getValue() : event.fieldvalue, this.name, this.path, event.fieldvalue, event.fieldid, event.fieldpath, event.changedFieldId);
      this.options.submitArray = false;
    }
  };
  prototype._raiseValueChanged = function(fieldvalue, fieldid, fieldpath, targetfieldvalue, targetfieldid, targetfieldpath, changedFieldId) {
    var data = {
      fieldvalue: fieldvalue,
      fieldid: fieldid,
      fieldpath: fieldpath,
      targetfieldvalue: targetfieldvalue,
      targetfieldid: targetfieldid,
      targetfieldpath: targetfieldpath,
      changedField: changedFieldId
    };
    var newEvent = $.Event("field:changed");
    _.extend(newEvent, data);
    this.containerItemEl.trigger(newEvent);
    if (this.options.mode === "create") {
      this.parent.data[this.propertyId] = this.getValue();
      this.data = fieldvalue;
    } else {
      this.parent.data[this.propertyId] = fieldvalue;
      this.data = fieldvalue.slice();
      if (!!this.options && !!this.options.isSetType) {
        if (this.children.length === this.data.length) {
          for (var i = 0; i < this.children.length; i++) {
            this.children[i].data = this.data[i];
          }
        }
      }
    }
  };
  prototype.validateContainer = function(elements) {
    var that = this, isFieldValid = true;
    $.each(elements, function(indx, child) {
      if (child.fieldView) {
        if (!$.isEmptyObject(child.fieldView._behaviors) && !!child.fieldView.getStatesBehavior()) {
          if (child.fieldView.alpacaField.type === "select") {
            if (child.fieldView.getEditValue().get("id") !== child.fieldView.getOldValue().get("id")) {
              that.options.isBlockModified = true;
            }
            isFieldValid = child.fieldView.trySetValue();
            child.fieldView.ui.writeField.trigger("select");
          } else if (child.fieldView.alpacaField.type === "d2combo") {
            if (child.fieldView.getOldValue().get("id") !== child.fieldView.getValue().get("id")) {
              if (!(child.fieldView.getOldValue().get("id") === "" && child.fieldView.getValue().get("id") === null)) {
                that.options.isBlockModified = true;
                isFieldValid = child.fieldView.setValue(child.fieldView.getValue(), true);
              }
            }
          } else {
            if (child.fieldView.getEditValue() !== child.fieldView.getValue() || child.fieldView.getEditValue() !== child.fieldView.getOldValue()) {
              if (!(child.fieldView.getEditValue() === "" && child.fieldView.getValue() === null)) {
                that.options.isBlockModified = true;
              }
            }
            isFieldValid = child.fieldView.setValue(child.fieldView.getEditValue(), true);
          }
          if (isFieldValid) {
            child.fieldView.$el.removeClass("cs-formfield-invalid");
            that.isContainerValid = true;
          } else {
            child.fieldView.$el.addClass("cs-formfield-invalid");
            that.isContainerValid = false;
          }
        }
      } else if (!!child.children && isFieldValid) {
        that.validateContainer(child.children);
      }
    });
  };
  prototype.removeItem = function() {
    oldRemoveItem.apply(this, arguments);
    if (this.options._d2Containertype === "d2grid") {
      var event = $.Event(this.isValid(true) ? "field:valid" : "field:invalid");
      this.containerItemEl.trigger(event, this);
    }
  };
  prototype.doAfterAddItem = function(item) {
    item.containerItemEl.find(".cs-pull-left").on("mouseenter", _.bind(this._showActionIconsForSets, this)).on("mouseleave", _.bind(this._hideActionIcons, this));
    item.containerItemEl.find(".cs-pull-right").on("mouseenter", _.bind(this._showActionIconsForSets, this)).on("mouseleave", _.bind(this._hideActions, this));
    if (this.options._d2Containertype === "d2grid") {
      item.refreshValidationState();
    }
  };
  prototype.updateToolbars = function() {
    this.getFieldEl().find(".cs-pull-right").show();
    oldUpdateToolbars.apply(this, arguments);
    if (this.options._d2Containertype === "d2grid" && this.schema.disabled) {
      this.getFieldEl().find(".cs-pull-right").hide();
    }
  };
  D2ArrayFieldResizerMixin.mixin(prototype);
});