/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "i18n", "nuc/lib/marionette", "nuc/lib/underscore", "nuc/lib/jquery", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "d2/utils/event.utils", "d2/controls/query.form/impl/query.form.header.view", "d2/controls/query.form/query.form.panel.view", "d2/controls/query.form/impl/query.form.footer.view", "hbs!d2/controls/query.form/impl/query.form.view", "css!d2/controls/query.form/impl/query.form.view" ], function(i18n, Marionette, _, $, TabablesBehavior, eventUtils, D2QueryFormHeaderView, D2QueryFormPanelView, D2QueryFormFooterView, formTemplate) {
  "use strict";
  var QueryFormTabableBehavior = TabablesBehavior.extend({
    constructor: function QueryFormTabableBehavior(options, view) {
      TabablesBehavior.prototype.constructor.apply(this, arguments);
      this.view = view;
      this.stopListening(view, "dom:refresh");
      this.listenTo(view, "dom:refresh", this._setFocusInActiveTabableRegion);
    }
  });
  return Marionette.LayoutView.extend({
    regions: {
      headerregion: ".queryformheaderview",
      formregion: ".queryformview",
      footerregion: ".queryformfooterview"
    },
    template: formTemplate,
    constructor: function QueryFormView() {
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.listenTo(this, "dom:refresh", this._refreshPanelView);
      this.listenTo(this, "query:form:search", this._search);
      this.listenTo(this, "query:form:close", this._close);
      this.listenTo(this, "query:form:validate", this._validate);
      this.listenTo(this, "query:form:clear", this._onClear);
      this.listenTo(this, "show:query:panel", this.enableResizePanel);
      var resizeFn = _.bind(this.reLayoutPanels, this);
      $(window).on("resize", resizeFn);
    },
    behaviors: {
      TabablesBehavior: {
        behaviorClass: QueryFormTabableBehavior,
        recursiveNavigation: true,
        containTabFocus: true
      }
    },
    reLayoutPanels: function() {
      var $results = $(".csui-search-results-body");
      if ($results.length) {
        var h = $results.height();
        $(".d2-query-form-view").height(h);
        $(this).css("height", h);
      }
    },
    onRender: function() {
      this.options.parent = this;
      this.createFormView().done(view => {
        this.formview = view;
        this.formregion.show(this.formview);
        this.headerview = this.getHeaderView();
        this.footerview = this.getFooterView();
        this.headerregion.show(this.headerview);
        this.footerregion.show(this.footerview);
        if (this.options.initFooter) {
          this.initFooter();
        }
      });
    },
    getMinimumResizeWidth: function() {
      return 300;
    },
    getMaximumResizeWidth: function() {
      return 400;
    },
    initFooter: function() {
      this.listenToOnce(this.formview, "render:forms", function() {
        this.footerview.disableButtons();
      });
    },
    onShow: function() {
      this.enableResizePanel();
    },
    enableResizePanel: function() {
      var me = this, minResize = me.getMinimumResizeWidth(), maxResize = me.getMaximumResizeWidth(), facetDragHandler, $leftPanel = $("." + me.getLeftPanelClass());
      if ($leftPanel.length > 0) {
        facetDragHandler = "." + me.getLeftPanelClass() + " .ui-resizable-handle";
        $leftPanel.resizable({
          alsoResize: $(".d2-query-form-main-view"),
          handles: i18n && i18n.settings.rtl ? "w" : "e",
          maxWidth: maxResize,
          minWidth: minResize,
          stop: function() {
            me.options.refresh();
          },
          resize: function() {
            me.onQueryFormResize();
          }
        });
        eventUtils.enableTouchEventsByClass(facetDragHandler);
      }
    },
    onQueryFormResize: function() {
      this.footerview.trigger("footer:adjust:button");
    },
    createFormView: function() {
      var deferred = $.Deferred();
      this.options.data?.ensureFetched().done(() => {
        deferred.resolve(new D2QueryFormPanelView(this.options));
      });
      return deferred.promise();
    },
    getHeaderView: function() {
      return new D2QueryFormHeaderView(this.options);
    },
    getFooterView: function() {
      return new D2QueryFormFooterView(this.options);
    },
    getLeftPanelClass: function() {
      return "csui-search-left-panel";
    },
    _close: function() {
      this.options.close();
    },
    isValidForm: function() {
      if (this.formview) {
        return this.formview.validate();
      } else {
        return true;
      }
    },
    _search: function() {
      this.formview.validateAllForms(true, false).done(_.bind(function(isValid) {
        if (isValid) {
          var data = this.formview.getFormValues();
          this.options.search(data);
        } else {
          this.footerview.triggerMethod("query:form:validate", false);
        }
      }, this));
    },
    _refreshPanelView: function() {
      this.reLayoutPanels();
      if (this.formview) {
        this.formview.triggerMethod("dom:refresh");
      }
    },
    _validate: function(isValid) {
      this.footerview.triggerMethod("query:form:validate", isValid);
    },
    _onClear: function() {
      this.formview.triggerMethod("query:form:clear");
    }
  });
});