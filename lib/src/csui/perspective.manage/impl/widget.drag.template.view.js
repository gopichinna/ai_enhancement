/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/marionette", "i18n!csui/perspective.manage/impl/nls/lang", "hbs!csui/perspective.manage/impl/widget.drag.template" ], function(_, Marionette, Lang, WidgetDragTemplate) {
  "use strict";
  var WidgetDragTemplateView = Marionette.ItemView.extend({
    constructor: function WidgetItemView(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    className: "csui-template-wrapper",
    template: WidgetDragTemplate,
    templateHelpers: function() {
      return {
        header: this.options && this.options.title,
        body: Lang.templateMessage
      };
    },
    onRender: function() {
      this.$el.data("pman.widget", this.options.newWidget);
    }
  });
  return WidgetDragTemplateView;
});