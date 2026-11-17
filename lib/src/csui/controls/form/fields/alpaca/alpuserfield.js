/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/alpaca/js/alpaca.lite", "csui/controls/form/fields/alpaca/alptypeaheadfield.mixin", "csui/controls/form/fields/userfield.view", "csui/utils/contexts/factories/member", "csui/controls/form/pub.sub", "i18n!csui/controls/form/impl/nls/lang" ], function(_, $, Alpaca, AlpTypeaheadFieldMixin, UserFieldView, MemberModelFactory, PubSub, Lang) {
  var CsuiUserField = AlpTypeaheadFieldMixin.mixin({
    constructor: function CsuiUserField(container, data, options, schema, view, connector, onError) {
      var errorMessage = schema.type === "otcs_user_picker" ? Lang.invalidUser : schema.type === "otcs_group_picker" ? options?.errorMessage ? options.errorMessage : Lang.invalidGroup : Lang.invalidUserOrGroup;
      options = $.extend(true, options || {}, {
        alpacaFieldType: "otcs_user",
        alpacaFieldClasses: options.hideFieldIcon ? "csui-field-otcs_user csui-field-no-icon" : "csui-field-otcs_user",
        lang: {
          invalidItem: errorMessage
        },
        noId: -3
      });
      Object.defineProperty(options, "baseFieldType", {
        value: "otcs_user",
        writable: false,
        enumerable: true
      });
      options.ItemModelFactory = MemberModelFactory;
      options.TypeaheadFieldView = UserFieldView;
      this.onlyUsers = schema.type === "otcs_user_picker";
      this.base(container, data, options, schema, view, connector, onError);
      this.makeAlpTypeaheadField();
    }
  });
  var original = _.extend({}, CsuiUserField);
  CsuiUserField = _.extend(CsuiUserField, {
    showField: function(data) {
      var ret = original.showField.apply(this, arguments);
      PubSub.trigger(this.propertyId + this.fieldView.formView.cid + "tkl:asyncBuildRelation", this.fieldView);
      return ret;
    }
  });
  Alpaca.Fields.CsuiUserField = Alpaca.Fields.TextField.extend(CsuiUserField);
  Alpaca.registerFieldClass("otcs_user", Alpaca.Fields.CsuiUserField);
  return $.alpaca.Fields.CsuiUserField;
});