/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "i18n", "nuc/lib/marionette", "nuc/lib/underscore", "nuc/lib/jquery", "d2/utils/constants", "d2/utils/event.utils", "d2/controls/query.form/query.form.view", "d2/widgets/workflow.queryform/impl/workflow.query.form.panel" ], function(i18n, Marionette, _, $, constants, eventUtils, QueryFormView, WFQueryFormPanel) {
  "use strict";
  return QueryFormView.extend({
    className: function() {
      var parentClassName = QueryFormView.prototype.className || "";
      if (_.isFunction(parentClassName)) {
        parentClassName = parentClassName.apply(this, arguments);
      }
      return parentClassName + " d2-workflow-query-form";
    },
    constructor: function WorkflowsQueryFormView() {
      QueryFormView.prototype.constructor.apply(this, arguments);
    },
    createFormView: function() {
      this.options["document-id_restoreContainer"] = true;
      this.options["document-id_storeContainer"] = true;
      return $.Deferred().resolve(new WFQueryFormPanel(this.options)).promise();
    },
    refreshFooter: function() {
      var valid = this.isValidForm();
      this._validate(valid);
    },
    onShow: function() {
      this._ensureDraggablePanel();
    },
    _onClear: function() {
      this.options.ignoreDefaultValue = true;
      this.render();
      this.listenToOnce(this.formview, "render:form", function() {
        this.formview.trigger("d2:change:formValidation");
      });
    },
    _ensureDraggablePanel: function() {
      var me = this;
      var $d2TableQueryFormView = this.options.originatingView && this.options.originatingView.$el.find(".d2-table-queryformview");
      if ($d2TableQueryFormView && $d2TableQueryFormView.length > 0 && !$d2TableQueryFormView.hasClass("ui-resizable-handle")) {
        var SearchDragHandler = ".d2-table-queryformview .ui-resizable-handle";
        $d2TableQueryFormView.resizable({
          handles: i18n && i18n.settings.rtl ? "w" : "e",
          maxWidth: 400,
          minWidth: 300,
          stop: function() {
            me.options.originatingView.triggerMethod("dom:refresh");
          },
          resize: function() {
            me.onQueryFormResize();
          }
        });
        eventUtils.enableTouchEventsByClass(SearchDragHandler);
      }
    }
  });
});