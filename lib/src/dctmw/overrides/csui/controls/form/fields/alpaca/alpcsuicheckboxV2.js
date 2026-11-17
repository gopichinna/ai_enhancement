/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "csui/controls/form/fields/alpaca/alpcsuicheckboxV2" ], function($, CSUICheckboxV2) {
  "use strict";
  const oShowField = CSUICheckboxV2.prototype.showField;
  const oDestroy = CSUICheckboxV2.prototype.destroy;
  CSUICheckboxV2.prototype._attachLabelClickListener = function() {
    this._getLabelElement().off("click.alpfield").on("click.alpfield", () => {
      let checked = this.fieldView.model.get("checked") === "true";
      this.fieldView.model.set({
        checked: JSON.stringify(!checked)
      });
    });
  };
  CSUICheckboxV2.prototype._detachLabelClickListener = function() {
    this._getLabelElement().off("click.alpfield");
  };
  CSUICheckboxV2.prototype._getLabelElement = function() {
    return $(this.field[0]).find("label");
  };
  CSUICheckboxV2.prototype.showField = function() {
    const retVal = oShowField.call(this);
    this.fieldView.model.set("disabled", this.options.disabled || false);
    this._attachLabelClickListener();
    return retVal;
  };
  CSUICheckboxV2.prototype.destroy = function() {
    this._detachLabelClickListener();
    return oDestroy.call(this);
  };
});