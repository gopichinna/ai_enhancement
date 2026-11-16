/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/controls/form/fields/textfield.view", "d2/controls/form/fields/massupdatefields/mass.update.field.mixin", "hbs!d2/controls/form/impl/textfield/textfield", "css!d2/controls/form/impl/textfield/textfield" ], function(TextFieldView, MassUpdateFieldMixin, newTemplate) {
  "use strict";
  TextFieldView.prototype.template = newTemplate;
  MassUpdateFieldMixin.mixin(TextFieldView.prototype);
});