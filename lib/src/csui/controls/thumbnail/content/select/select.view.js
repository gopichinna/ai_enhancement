/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/backbone", "csui/lib/marionette", "csui/controls/thumbnail/content/content.registry", "i18n!csui/controls/thumbnail/impl/nls/lang", "hbs!csui/controls/thumbnail/content/select/impl/select", "css!csui/controls/thumbnail/content/select/impl/select" ], function(_, Backbone, Marionette, ContentRegistry, lang, template) {
  "use strict";
  var SelectContentView = Marionette.ItemView.extend({
    template: template,
    templateHelpers: function() {
      return {
        selectable: this.model.get("selectable") !== false,
        checked: this.model.get(SelectContentView.isSelectedModelAttributeName) === true,
        selectItemName: _.str.sformat(lang.selectItem, this.model.get("name")),
        selectItemAria: _.str.sformat(lang.selectItemAria, this.model.get("name"))
      };
    },
    events: {
      keydown: "onKeyInView"
    },
    constructor: function(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.rowIndex = options.rowIndex;
      this.listenTo(this.model, "change:" + SelectContentView.isSelectedModelAttributeName, this.render);
      this.listenTo(this, "before:render", this._detachClickHandler).listenTo(this, "before:destroy", this._detachClickHandler);
    },
    _attachClickHandler: function() {
      const self = this;
      const $cbEl = this.$el.find("otc-checkbox");
      $cbEl.on("change." + this.cid, function(event) {
        Backbone.trigger("closeToggleAction");
        var checked = $cbEl.prop("checked");
        self.triggerMethod("clicked:checkbox", {
          view: self,
          checked: checked
        });
      });
    },
    _detachClickHandler: function() {
      const $cbEl = this.$el.find("otc-checkbox");
      $cbEl.off("change." + this.cid);
    },
    onRender: function() {
      this._ensureViewIsIntact();
      this.triggerMethod("before:render", this);
      this._attachClickHandler();
      return this;
    }
  }, {
    columnClassName: "csui-table-cell-_select",
    isSelectedModelAttributeName: "csuiIsSelected"
  });
  ContentRegistry.registerByKey("_select", SelectContentView);
  return SelectContentView;
});