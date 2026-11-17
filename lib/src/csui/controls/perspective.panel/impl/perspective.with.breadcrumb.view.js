/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/marionette", "csui/utils/namedsessionstorage", "csui/utils/contexts/factories/user", "csui/utils/contexts/factories/application.scope.factory", "csui/controls/breadcrumbspanel/breadcrumbspanel.view", "csui/utils/contexts/factories/ancestors", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "csui/utils/commonconfig.util", "hbs!csui/controls/perspective.panel/impl/perspective.with.breadcrumb" ], function(_, Marionette, NamedSessionStorage, UserModelFactory, ApplicationScopeModelFactory, BreadcrumbsPanelView, AncestorCollectionFactory, LayoutViewEventsPropagationMixin, CommonConfigUtil, template) {
  "use strict";
  const enableSideBar = CommonConfigUtil.enableSideBar();
  var PerspectiveWithBreadcrumbView = Marionette.LayoutView.extend({
    className: "cs-perspective-with-breadcrumb-view",
    template: template,
    templateHelpers: function() {
      return {
        enableSideBar: enableSideBar && this.options.perspectiveView?.options?.perspectiveMode,
        editperspectiveMode: this.options.perspectiveView?.options?.perspectiveMode === "edit"
      };
    },
    regions: {
      sidebarRegion: ".csui-sidebar",
      breadcrumbRegion: ".csui-perspective-breadcrumb",
      perspectiveRegion: ".csui-perspective-view"
    },
    constructor: function PerspectiveWithBreadcrumbView(options) {
      options || (options = {});
      this.perspectiveView = options.perspectiveView;
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.propagateEventsToRegions();
      this._supportMaximizeWidget = this.perspectiveView._supportMaximizeWidget;
      this._supportMaximizeWidgetOnDisplay = this.perspectiveView._supportMaximizeWidgetOnDisplay;
      if (_.isFunction(this.perspectiveView.serializePerspective)) {
        this.serializePerspective = function(perspectiveModel) {
          return this.perspectiveView.serializePerspective.apply(this.perspectiveView, arguments);
        };
      }
      if (_.isFunction(this.perspectiveView.swapLayout)) {
        this.swapLayout = function(perspectiveModel) {
          return this.perspectiveView.swapLayout.apply(this.perspectiveView, arguments);
        };
      }
      this.widgetsResolved = this.perspectiveView.widgetsResolved;
      var perspectiveType = this.options.context.perspective.get("type");
      var perspectiveMarginClass;
      switch (perspectiveType) {
       case "left-center-right":
       case "sidepanel-right":
       case "sidepanel-left":
       case "tabbed":
        perspectiveMarginClass = "cs_perspective_no_left_right_margin";
        break;

       default:
        perspectiveMarginClass = "cs_perspective_with_left_right_margin";
      }
      this.$el.addClass(perspectiveMarginClass);
      this.user = this.options.context.getModel(UserModelFactory);
      var context = this.options.context, viewStateModel = context && context.viewStateModel;
      if (viewStateModel && viewStateModel.get(viewStateModel.CONSTANTS.BREADCRUMB) === undefined) {
        this.listenTo(this.user, "change", this.updateUserPreferences);
      }
      this.applicationScope = this.options.context.getModel(ApplicationScopeModelFactory);
      this.listenTo(this.applicationScope, "change:breadcrumbsVisible", this._showOrHideBreadcrumbs);
      if (enableSideBar && !this.sidebarView) {
        let that = this;
        require([ "csui/perspective.manage/sidebar/pman.sidebar.container.view" ], function(PManSideBarContainerView) {
          that.sidebarView = new PManSideBarContainerView(Object.assign(that.options, {
            context: that.options.context,
            targetView: "edit",
            perspectiveType: that.perspectiveView?.options?.type
          }));
        });
      }
    },
    onRender: function() {
      var ancestors = this.options.context.getCollection(AncestorCollectionFactory);
      var breadcrumbsAvailable = ancestors.isFetchable();
      this.applicationScope.set("breadcrumbsAvailable", breadcrumbsAvailable);
      if (breadcrumbsAvailable) {
        var breadcrumbsPanel = new BreadcrumbsPanelView({
          context: this.options.context
        });
        this.breadcrumbRegion.show(breadcrumbsPanel);
      }
      this.perspectiveRegion.show(this.perspectiveView);
      const mode = this.options.perspectiveView?.options?.perspectiveMode;
      if (enableSideBar && (mode === "edit" || mode === "personalize")) {
        this.el.classList.remove("cs_perspective_with_left_right_margin");
        this.el.classList.add("cs_perspective_no_left_right_margin");
        mode === "edit" && this.sidebarView && this.sidebarRegion.show(this.sidebarView);
      }
    },
    onDomRefresh: function() {
      var context = this.options.context, viewStateModel = context && context.viewStateModel;
      if (viewStateModel && viewStateModel.get(viewStateModel.CONSTANTS.BREADCRUMB) !== undefined) {
        this._setBreadcrumbsVisibility(viewStateModel.get(viewStateModel.CONSTANTS.BREADCRUMB));
        return;
      }
      this.updateUserPreferences();
    },
    updateUserPreferences: function() {
      var userId = this.user.get("id");
      this.userPreferences = userId ? new NamedSessionStorage("userPreferences:" + userId) : undefined;
      if (this._isRendered && this.userPreferences) {
        this._setBreadcrumbsVisibility(true);
      } else {
        this._setBreadcrumbsVisibility(false);
      }
    },
    _showOrHideBreadcrumbs: function(args1, args2) {
      var breadcrumbsVisible = this.applicationScope.get("breadcrumbsVisible");
      this._setBreadcrumbsVisibility(breadcrumbsVisible);
    },
    _setBreadcrumbsVisibility: function(visible) {
      var breadcrumbsAvailable = this.applicationScope.get("breadcrumbsAvailable");
      if (visible && breadcrumbsAvailable) {
        this.$el.addClass("csui-breadcrumbs-visible");
        this.perspectiveView.$el.addClass("csui-breadcrumbs-visible");
      } else {
        this.$el.removeClass("csui-breadcrumbs-visible");
        this.perspectiveView.$el.removeClass("csui-breadcrumbs-visible");
      }
      if (this.userPreferences) {
        this.userPreferences.set("breadcrumbs-visible", visible);
        if (this.applicationScope.get("hiddenByExtension") && this.applicationScope.get("previousBreadcrumbVisibility") !== undefined) {
          this.userPreferences.set("previousBreadcrumbVisibility", this.applicationScope.get("previousBreadcrumbVisibility"));
        }
        if (this.applicationScope.get("hiddenByExtension") && this.applicationScope.get("previousBreadcrumbVisibility") === undefined) {
          this.applicationScope.set("previousBreadcrumbVisibility", this.userPreferences.get("previousBreadcrumbVisibility"));
        }
      }
      this.applicationScope.set("breadcrumbsVisible", visible);
    }
  });
  _.extend(PerspectiveWithBreadcrumbView.prototype, LayoutViewEventsPropagationMixin);
  return PerspectiveWithBreadcrumbView;
});