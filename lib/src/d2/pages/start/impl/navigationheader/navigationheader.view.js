/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "d2/controls/globalmessage/globalmessage", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "csui/utils/contexts/factories/application.scope.factory", "csui/utils/contexts/factories/next.node", "d2/widgets/navigation.header/controls/search/search.view", "d2/pages/start/impl/navigationheader/navigation.header.controls", "hbs!d2/pages/start/impl/navigationheader/impl/navigationheader", "i18n!d2/pages/start/impl/nls/lang", "nuc/lib/jquery.when.all", "css!csui/pages/start/impl/navigationheader/impl/navigationheader", "css!d2/pages/start/impl/navigationheader/impl/navigationheader" ], function(require, _, $, Backbone, Marionette, GlobalMessage, LayoutViewEventsPropagationMixin, ApplicationScopeModelFactory, NextNodeModelFactory, HeaderSearchView, controls, template, lang) {
  "use strict";
  var NavigationHeaderView = Marionette.LayoutView.extend({
    template: template,
    regions: {
      messageRegion: ".csui-navbar-message",
      centerRegion: ".binf-navbar-center"
    },
    ui: {
      left: ".binf-navbar-left",
      right: ".binf-navbar-right",
      center: ".binf-navbar-center"
    },
    templateHelpers: function() {
      return {
        mainNavigationAria: lang.mainNavigationAria
      };
    },
    constructor: function NavigationHeaderView(options) {
      Marionette.LayoutView.call(this, options);
      this.propagateEventsToRegions();
      this.imitateBreadcrumbViewInteractions();
    },
    onRender: function() {
      var context = this.options.context, self = this;
      GlobalMessage.setProgresspanelMessageRegionView(this, {
        classes: "csui-global-message",
        enableMinimiseButtonOnProgressPanel: true
      });
      this._resolveComponents().done(function() {
        self.trigger("before:render:controls", self);
        controls.leftSide.each(createControls.bind(self, self.ui.left));
        controls.rightSide.each(createControls.bind(self, self.ui.right));
        self.getRegion("centerRegion").show(new HeaderSearchView({
          context: context,
          parentView: self
        }));
        self.trigger("render:controls", self);
      });
      function createControls(target, control) {
        var View = control.get("view");
        if (View) {
          var el = $("<div>").addClass(control.get("parentClassName")).appendTo(target).attr("role", "menuitem"), region = self.addRegion(_.uniqueId("csui:navigation.header.control"), {
            selector: el
          }), view = new View({
            context: context,
            parentView: self
          });
          region.show(view);
        }
      }
    },
    _resolveComponents: function() {
      if (this._controlsResolved) {
        return this._controlsResolved;
      }
      function resolveControl(name) {
        var deferred = $.Deferred();
        require([ name ], deferred.resolve, deferred.reject);
        return deferred.promise();
      }
      var allComponents = controls.leftSide.models.concat(controls.rightSide.models), promises = allComponents.map(function(control) {
        return resolveControl(control.id);
      }), deferred = $.Deferred();
      $.whenAll.apply($, promises).always(function(views) {
        views.forEach(function(view, index) {
          allComponents[index].set("view", view);
        });
        deferred.resolve();
      });
      this._controlsResolved = deferred.promise();
      return this._controlsResolved;
    },
    imitateBreadcrumbViewInteractions: function() {
      var applicationScope = this.options.context.getModel(ApplicationScopeModelFactory), nextNode = this.options.context.getModel(NextNodeModelFactory);
      this.listenTo(applicationScope, "change:id", function(model, id) {
        if (id !== "node" || nextNode.get("id") === undefined) {
          this.triggerMethod("change:breadcrumbs", {
            isBreadcrumbsEmpty: true
          });
        }
      });
    }
  });
  _.extend(NavigationHeaderView.prototype, LayoutViewEventsPropagationMixin);
  return NavigationHeaderView;
});