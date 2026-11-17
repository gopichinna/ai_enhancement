/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/controls/form/form.view" ], function(module, FormView) {
  "use strict";
  var ElinkFormView = FormView.extend({
    _renderContent: function() {
      let schema = this.model.get("schema");
      schema.properties.email_alias.type = "url";
      this.model.set("schema", schema);
      let options = this.model.get("options");
      options.fields.email_alias.type = "url";
      options.fields.email_alias.fieldClass = "email_alias";
      this.model.set("options", options);
      FormView.prototype._renderContent.call(this);
    },
    _formRendered: function(form) {
      FormView.prototype._formRendered.call(this, form);
      let email = this.model.get("data")["email_alias"];
      this.el.querySelector(".email_alias .cs-field-read .btn-container>a").setAttribute("href", `mailto:${email}`);
    }
  });
  return ElinkFormView;
});