/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "d2/widgets/metadata/utils/form.converter", "d2/widgets/metadata/general.panels/d2/d2.general.form.model", "d2/controls/form/d2.form.view", "i18n!d2/dialogs/vd.create.snapshot/impl/nls/lang", "hbs!d2/dialogs/vd.create.snapshot/impl/snapshot.form" ], function(_, $, Marionette, FormConverter, D2GeneralFormModel, D2FormView, lang, template) {
  var SnapshotTitlePicker = Marionette.LayoutView.extend({
    className: "d2-create-snapshot csui-top-align-label",
    template: template,
    regions: {
      formRegion: "#snapshot-form-wrapper"
    },
    constructor: function SnapshotTitlePicker(options) {
      options || (options = {});
      this.options = options;
      this.context = options.context;
      Marionette.LayoutView.prototype.constructor.apply(this, options);
      this.options["vd-title"] = this.options.name;
    },
    onRender: function() {
      this._loadFormView();
      this.formRegion.show(this.formView);
    },
    _loadFormView: function() {
      this.formModel = new D2GeneralFormModel({
        id: "vd-snapshot-form"
      });
      var formModel = this._getSchema(this.options.name);
      this.formModel.set(formModel);
      this.formView = new D2FormView({
        model: this.formModel,
        mode: "create",
        context: this.context,
        className: "d2-create-snapshot-title",
        templateWrapperClassName: "d2-create-snapshot-title-form-wrapper",
        initialActivationWeight: 2
      });
      this.listenTo(this.formView, {
        "change:field": this._setValue
      });
    },
    _setValue: function() {
      this.options["vd-title"] = this.formView.getValues()["vd-title"];
    },
    _getSchema: function(name) {
      var form = {
        id: "vd-snapshot-form",
        data: {
          "vd-name": name,
          "vd-title": name
        },
        schema: {
          id: "vd-snapshot-form",
          initial_invalid: true,
          properties: {
            "vd-name": {
              title: lang.NameLabel,
              type: "string",
              required: false
            },
            "vd-title": {
              title: lang.TitleLabel,
              type: "string",
              required: false
            }
          }
        },
        options: {
          fields: {
            "vd-name": {
              label: lang.NameLabel,
              type: "d2label",
              isEditable: false
            },
            "vd-title": {
              label: lang.TitleLabel,
              type: "text"
            }
          }
        },
        expressions: {
          "vd-name": {},
          "vd-title": {}
        }
      };
      FormConverter.generateFormModelConfig([ form ]);
      return form;
    }
  });
  return SnapshotTitlePicker;
});