/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "d2/widgets/metadata/general.panels/d2/d2.general.form.model", "d2/controls/form/d2.form.view", "d2/widgets/metadata/utils/form.converter", "i18n!d2/widgets/metadata/panels/permissions/impl/nls/lang" ], function(_, D2FormModel, D2FormView, FormConverter, lang) {
  "use strict";
  var SecurityTemplateFormView = D2FormView.extend({
    constructor: function SecurityTemplateFormView(model, options) {
      var formModelSchema = this._getSecurityTemplateFormSchema(model), formModel = new D2FormModel(formModelSchema);
      options.model = formModel;
      options.mode = "read";
      options.topAlignedLabel = true;
      options.templateWrapperClassName = "d2-metadata-security-template-form";
      D2FormView.prototype.constructor.call(this, options);
    },
    _getSecurityTemplateFormSchema: function(model) {
      var form = {
        id: "security-template-form",
        title: "Security Template Form",
        actionMode: "read",
        layoutMode: "doubleCol",
        data: {
          aclCombinedName: model.get("aclCombinedName")
        },
        schema: {
          id: "security-template-form",
          initial_invalid: false,
          properties: {
            aclCombinedName: {
              title: lang.Security,
              type: "string",
              readonly: true,
              maxLength: 255
            }
          }
        },
        options: {
          fields: {
            aclCombinedName: {
              label: lang.Security,
              _type: "string",
              readonly: true,
              type: "d2label"
            }
          }
        },
        expressions: {}
      };
      FormConverter.generateFormModelConfig([ form ]);
      return form;
    }
  });
  return SecurityTemplateFormView;
});