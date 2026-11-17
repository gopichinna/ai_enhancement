/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/controls/form/fields/textfield.view", "d2/controls/form/fields/massupdatefields/mass.update.field.mixin" ], function(_, TextFieldView, MassUpdateFieldMixin) {
  "use strict";
  TextFieldView.prototype.events = _.extend(TextFieldView.prototype.events, {
    "focusout @ui.writeField": "focusOutAction"
  });
  MassUpdateFieldMixin.mixin(TextFieldView.prototype);
});