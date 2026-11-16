/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/backbone", "csui/controls/dialog/dialog.view", "csui/controls/source.dialog/source.dialog.textarea.field.view", "i18n!csui/widgets/html.editor/impl/nls/lang", "css!csui/controls/source.dialog/impl/source.dialog" ], function(_, Backbone, DialogView, TextAreaFieldView, lang) {
  var SourceDialog = DialogView.extend({
    className: "fr-source-code-view",
    constructor: function SourceDialog(options = {}) {
      _.defaults(options, {
        buttons: [ {
          id: "froalaOkButton",
          default: true,
          label: lang.okTitle,
          click: _.bind(this._okAction, this),
          enabled: true
        }, {
          id: "froalaCancelButton",
          label: lang.cancelTitle,
          close: true,
          enabled: true
        } ],
        title: lang.sourceDialogTitle,
        view: new TextAreaFieldView({
          model: new Backbone.Model({
            data: options.data,
            options: options
          }),
          mode: "writeonly"
        })
      });
      DialogView.prototype.constructor.call(this, options);
    },
    _okAction: function() {
      const model = this.options.view.model;
      this.trigger("toggle:content", {
        data: model.get("data"),
        enableSaveButton: !!model.changed.data
      });
      this.destroy();
    },
    destroy: function() {
      DialogView.prototype.destroy.call(this);
      this.trigger("show:froala-toolbar");
    }
  });
  return SourceDialog;
});