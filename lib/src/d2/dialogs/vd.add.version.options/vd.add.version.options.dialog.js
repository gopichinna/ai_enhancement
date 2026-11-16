/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "d2/widgets/metadata/utils/form.converter", "d2/widgets/metadata/general.panels/d2/d2.general.form.model", "d2/controls/form/d2.form.view", "d2/utils/constants", "i18n!d2/dialogs/vd.add.version.options/impl/nls/lang", "hbs!d2/dialogs/vd.add.version.options/impl/vd.add.version.options.dialog", "css!d2/dialogs/vd.add.version.options/impl/vd.add.version.options.dialog" ], function(_, $, Marionette, FormConverter, D2GeneralFormModel, D2FormView, constants, lang, template) {
  var DICT_ADD_VERSION_OPTIONS = Object.freeze({
    Root: {
      text: lang.labelCheckinVdOnly,
      value: constants.VDAddVesionOptions.ROOT
    },
    RootAndDescendants: {
      text: lang.labelCheckinVdAndDescendants,
      value: constants.VDAddVesionOptions.ROOT_AND_DESCENDANTS
    }
  });
  var AddversionSelectionView = Marionette.LayoutView.extend({
    className: "d2-add-version-selection",
    template: template,
    regions: {
      region: "#add-version-type-form-wrapper"
    },
    constructor: function AddversionSelectionView(options) {
      options || (options = {});
      this.options = options;
      this.context = options.context;
      Marionette.LayoutView.prototype.constructor.apply(this, options);
    },
    onRender: function() {
      this.$el.addClass("csui-top-align-label");
      this._formView();
      this.region.show(this.addVersionSelectionView);
    },
    _formView: function() {
      this.versionSelectionFormModel = new D2GeneralFormModel({
        id: "add-version-type-form"
      });
      this.options["add-version-type"] = DICT_ADD_VERSION_OPTIONS.Root.value;
      var formModel = this._getAddVersionSelectionSchema(this.options.name, this.options["add-version-type"]);
      this.versionSelectionFormModel.set(formModel);
      this.addVersionSelectionView = new D2FormView({
        model: this.versionSelectionFormModel,
        mode: "create",
        context: this.context,
        className: "d2-add-version-type-selection",
        templateWrapperClassName: "d2-add-version-type-selection-form-wrapper",
        initialActivationWeight: 2
      });
      this.listenTo(this.addVersionSelectionView, {
        "change:field": this._setValue
      });
    },
    _setValue: function() {
      this.options["add-version-type"] = this.addVersionSelectionView.getValues()["add-version-type"];
    },
    _getAddVersionSelectionSchema: function(name, defaultSelection) {
      var form = {
        id: "add-version-type-form",
        data: {
          "vd-name": _.str.sformat(lang.chooseAddVersionDlgLabel, name),
          "add-version-type": defaultSelection
        },
        schema: {
          id: "add-version-type-form",
          initial_invalid: true,
          properties: {
            "vd-name": {
              type: "string",
              required: false
            },
            "add-version-type": {
              enum: [ DICT_ADD_VERSION_OPTIONS.Root.value, DICT_ADD_VERSION_OPTIONS.RootAndDescendants.value ]
            }
          }
        },
        options: {
          fields: {
            "vd-name": {
              type: "d2label",
              isEditable: false
            },
            "add-version-type": {
              type: "radio",
              removeDefaultNone: true,
              optionLabels: [ DICT_ADD_VERSION_OPTIONS.Root.text, DICT_ADD_VERSION_OPTIONS.RootAndDescendants.text ]
            }
          }
        },
        expressions: {
          "vd-name": {},
          "add-version-type": {}
        }
      };
      FormConverter.generateFormModelConfig([ form ]);
      return form;
    }
  });
  return AddversionSelectionView;
});