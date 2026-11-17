/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/underscore", "csui/lib/marionette", "i18n!csui/controls/table/inlineforms/favorite/impl/nls/lang", "csui/controls/table/inlineforms/inlineform.registry", "csui/controls/table/inlineforms/inlineform/inlineform.view", "hbs!csui/controls/table/inlineforms/favorite/impl/favorite", "css!csui/controls/table/inlineforms/favorite/impl/favorite" ], function($, _, Marionette, lang, inlineFormViewRegistry, InlineFormView, template) {
  var InlineFormFavoriteView = InlineFormView.extend({
    className: function() {
      var className = "csui-inlineform-favorite";
      if (InlineFormView.prototype.className) {
        className += " " + _.result(InlineFormView.prototype, "className");
      }
      return className;
    },
    template: template,
    templateHelpers: function() {
      var dataFromInlineFormView = this._templateHelpers();
      var disableSaveBtn = !!!this.model.get("favorite_name");
      var data = _.extend(dataFromInlineFormView, {
        name: this.model.get("favorite_name"),
        namePlaceholder: lang.NewNamePlaceholder,
        disableSaveBtn: disableSaveBtn
      });
      return data;
    },
    ui: {},
    constructor: function InlineFormFavoriteView(options) {
      this.options = options || {};
      this.ui = _.extend({}, this.ui, InlineFormView.prototype.ui);
      this.events = _.extend({}, this.events, InlineFormView.prototype.events);
      InlineFormFavoriteView.__super__.constructor.apply(this, arguments);
    },
    _saveIfOk: function() {
      var inputName = this._getInputName();
      var name = this.model.get("favorite_name");
      if (inputName.length > 0 && inputName === name) {
        this.cancel();
      } else {
        if (inputName.length > 0) {
          this._save({
            favorite_name: inputName
          });
        }
      }
    },
    isSaveEnabled: function(newName) {
      return !(!newName.length || newName === this.model.get("favorite_name"));
    }
  }, {
    CSSubType: undefined
  });
  return InlineFormFavoriteView;
});