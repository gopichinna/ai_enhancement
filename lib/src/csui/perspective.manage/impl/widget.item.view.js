/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/lib/marionette", "csui/utils/base", "csui/perspective.manage/impl/widget.drag.template.view", "smart/themes/theming", "csui/themes/csui.jato.action.icons", "i18n!csui/perspective.manage/impl/nls/lang", "hbs!csui/perspective.manage/impl/widget.item" ], function(require, _, $, Backbone, Marionette, base, widgetDragTemplateView, theming, jatoActionIcons, Lang, WidgetItemTemplate) {
  "use strict";
  var config = Object.assign({
    dragImageOffsetTop: 50,
    dragImageOffsetLeft: 50
  }, require.moduleConfig("csui/perspective.manage/impl/widget.list.view"));
  var WidgetItemView = Marionette.ItemView.extend({
    constructor: function WidgetItemView(options) {
      options || (options = {});
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    className: "csui-module-group",
    template: WidgetItemTemplate,
    templateHelpers: function() {
      var widgetCollection = new Backbone.Collection(this.model.attributes.widgets), disableTitle = Lang.disableTitle, idx = 0;
      widgetCollection.models.forEach(function(model) {
        model.set({
          draggable: !!model.get("canDragAndDrop"),
          disableTitle: disableTitle,
          dataAttr: model.get("id").replace(/\//g, "-"),
          allowMultiple: !!model.get("allowMultiple"),
          index: idx++,
          isJato: theming.isJATOTheme(),
          jatoDragHandleIcon: jatoActionIcons.actionDragHandle
        }, {
          silent: true
        });
      });
      return {
        widgets: widgetCollection.models,
        jatoCaretUpIcon: jatoActionIcons.actionChevronSmallUp,
        jatoCaretDownIcon: jatoActionIcons.actionChevronSmallDown,
        isJato: theming.isJATOTheme()
      };
    },
    ui: {
      accordionHeader: ".csui-accordion-header",
      accordionContent: ".csui-accordion-content",
      accordionHeaderIcon: ".csui-accordion-header .cs-icon",
      widget: ".csui-draggable-widget-item"
    },
    events: {
      "click @ui.accordionHeader": "toggle",
      "keydown @ui.accordionHeader": "toggle",
      "dragstart @ui.widget": "onDragStart",
      "dragend @ui.widget": "onDragEnd"
    },
    toggle: function() {
      var isClosed = this.ui.accordionHeader.hasClass("csui-accordion-expand");
      this.ui.accordionHeader.toggleClass("csui-accordion-expand");
      this.options.parentView.$el.find(".csui-module-group").removeClass("csui-accordion-visible").find(".csui-accordion-header").removeClass("csui-accordion-expand");
      if (!isClosed) {
        this.$el.addClass("csui-accordion-visible");
        this.ui.accordionHeader.addClass("csui-accordion-expand");
      }
      base.onTransitionEnd(this.ui.accordionContent, function() {
        this.trigger("widgets:expanded");
      }, this);
    },
    onRender: function() {
      var dndContainer = $(".perspective-editing .csui-dnd-container");
      if (dndContainer.length) {
        this._makeWidgetSortable();
      }
    },
    _makeWidgetSortable: function() {
      var self = this, draggableChildren = this.$el.find(".csui-widget-item.csui-draggable-widget-item"), widgetEls = draggableChildren.parent();
      widgetEls.data("pman.widget", this.model.get("widgets"));
      widgetEls.sortable({
        connectWith: [ ".perspective-editing .csui-dnd-container", ".perspective-editing .pman-trash-area" ],
        containment: ".perspective-editing ",
        helper: function(event, ui) {
          var widgetModel = ui.data("widget-index");
          self.widgetDragTemplate = new widgetDragTemplateView({
            title: self.model.get("widgets")[widgetModel].get("title"),
            newWidget: self.model.get("widgets")[widgetModel],
            jatoCaretUpIcon: jatoActionIcons.actionChevronSmallUp,
            jatoCaretDownIcon: jatoActionIcons.actionChevronSmallDown,
            isJato: theming.isJATOTheme()
          });
          self.widgetDragTemplate.render();
          self.widgetDragTemplate.$el.width("220px");
          self.widgetDragTemplate.$el.height("220px");
          self.widgetDragTemplate.$el.css({
            opacity: .75
          });
          self.widgetDragTemplate.$el.appendTo(self.options.parentView.$el.closest(".pman-pannel-wrapper"));
          return self.widgetDragTemplate.$el;
        },
        tolerance: "pointer",
        cursorAt: {
          top: config.dragImageOffsetTop,
          left: config.dragImageOffsetLeft
        },
        start: function(event, ui) {
          ui.item.css("display", "block");
          ui.placeholder.css("display", "block");
          self.dragStart();
        },
        stop: function() {
          self.dragEnd();
        }
      });
    },
    onDragStart: function(event) {
      var idx = $(event.currentTarget).data("widget-index"), widget = this.model.get("widgets")[idx], dataTransfer = event.originalEvent.dataTransfer;
      var template = $(".csui-template-wrapper");
      template.find(".csui-template-header").text(widget.get("title"));
      if (this._hasNativeDragImageSupport()) {
        dataTransfer.setData("text", JSON.stringify(widget.toJSON()));
        dataTransfer.setDragImage(template[0], config.dragImageOffsetLeft, config.dragImageOffsetTop);
      }
      this.dragStart();
    },
    _hasNativeDragImageSupport: function() {
      var dataTransfer = window.DataTransfer || window.Clipboard;
      return "setDragImage" in dataTransfer.prototype;
    },
    onDragEnd: function(event) {
      this.dragEnd();
    },
    dragStart: function() {
      this.$el.closest(".csui-pman-panel").addClass("csui-pman-drag-start");
      $(document.body).addClass("csui-pman-dnd-active");
    },
    dragEnd: function() {
      this.$el.closest(".csui-pman-panel").removeClass("csui-pman-drag-start");
      $(document.body).removeClass("csui-pman-dnd-active");
    }
  });
  return WidgetItemView;
});