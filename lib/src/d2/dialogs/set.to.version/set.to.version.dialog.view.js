/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "d2/widgets/metadata/utils/form.converter", "d2/widgets/metadata/general.panels/d2/d2.general.form.model", "d2/controls/form/d2.form.view", "i18n!d2/dialogs/set.to.version/impl/nls/lang", "hbs!d2/dialogs/set.to.version/impl/set.to.version.dialog.view", "css!d2/dialogs/set.to.version/impl/set.to.version.dialog.view" ], function(_, $, Marionette, FormConverter, D2GeneralFormModel, D2FormView, lang, template) {
  var SetChildVersionView = Marionette.LayoutView.extend({
    className: "d2-child-version",
    template: template,
    regions: {
      versionRegion: "#vd-version-form-wrapper"
    },
    constructor: function SetChildVersionView(options) {
      options || (options = {});
      this.options = options;
      this.context = options.context;
      Marionette.LayoutView.prototype.constructor.apply(this, options);
    },
    onRender: function() {
      this.$el.addClass("csui-top-align-label");
      this._loadVersionFormView();
      this.versionRegion.show(this.versionView);
    },
    _loadVersionFormView: function() {
      this.versionFormModel = new D2GeneralFormModel({
        id: "vd-version-form"
      });
      var formModel = this._getVersionSchema(this.options.name, this.options.bindingVersion);
      var versionOptions = this.options.versionList.map(function(model) {
        return {
          text: model.get("text"),
          value: model.get("value")
        };
      });
      var dataSourceCallback = function(cb) {
        if (_.isFunction(cb)) {
          cb(versionOptions);
        }
      };
      formModel["options"]["fields"]["vd-version"]["dataSource"] = dataSourceCallback;
      this.versionFormModel.set(formModel);
      this.versionView = new D2FormView({
        model: this.versionFormModel,
        mode: "create",
        context: this.context,
        className: "d2-vd-version-selection",
        templateWrapperClassName: "d2-vd-version-selection-form-wrapper",
        initialActivationWeight: 2
      });
      this.listenTo(this.versionView, {
        "change:field": this._setValue
      });
      this.listenTo(this.versionView, "change:field", () => {
        this.trigger("change:field");
      });
    },
    _setValue: function() {
      this.options["vd-version"] = this.versionView.getValues()["vd-version"];
    },
    _getVersionSchema: function(name, bindingVersion) {
      var form = {
        id: "vd-version-form",
        data: {
          "vd-name": name,
          "vd-version": bindingVersion
        },
        schema: {
          id: "vd-version-form",
          initial_invalid: true,
          properties: {
            "vd-name": {
              title: lang.NameLabel,
              type: "string",
              required: false
            },
            "vd-version": {
              title: lang.VersionLabel,
              type: "string",
              required: true
            }
          }
        },
        options: {
          fields: {
            "vd-name": {
              label: lang.NameLabel,
              type: "dctmwlabel",
              isEditable: false
            },
            "vd-version": {
              label: lang.VersionLabel,
              type: "d2combo",
              dataSource: function(cb) {
                cb([ {
                  text: "Select",
                  value: ""
                } ]);
              },
              removeDefaultNone: false,
              isEditable: false,
              hideInitValidationError: false,
              useDataSourceAsEnum: true
            }
          }
        },
        expressions: {
          "vd-name": {},
          "vd-version": {}
        }
      };
      FormConverter.generateFormModelConfig([ form ]);
      return form;
    }
  });
  return SetChildVersionView;
});