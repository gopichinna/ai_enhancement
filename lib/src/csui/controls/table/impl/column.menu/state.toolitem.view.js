/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/controls/toolbar/toolitem.view" ], function(_, ToolItemView) {
  var StateToolItemView = ToolItemView.extend({
    constructor: function StateToolItemView() {
      ToolItemView.prototype.constructor.apply(this, arguments);
    },
    render: function() {
      if (this._inDropDown) {
        const dropdownOptions = this.model.get("dropdown");
        if (dropdownOptions) {
          const saved = _.pick(this.options, ToolItemView.STATE_PARAMS);
          ToolItemView.STATE_PARAMS.forEach(param => delete this.options[param]);
          _.extend(this.options, _.pick(dropdownOptions, ToolItemView.STATE_PARAMS));
          const result = ToolItemView.prototype.render.apply(this, arguments);
          ToolItemView.STATE_PARAMS.forEach(param => delete this.options[param]);
          _.extend(this.options, saved);
          return result;
        }
      }
      return ToolItemView.prototype.render.apply(this, arguments);
    },
    restoreRenderState: function() {
      this._inDropDown = false;
      return ToolItemView.prototype.restoreRenderState.apply(this, arguments);
    },
    renderTextOnly: function(saveState) {
      if (saveState) {
        this._inDropDown = true;
      }
      return ToolItemView.prototype.renderTextOnly.apply(this, arguments);
    }
  });
  return StateToolItemView;
});