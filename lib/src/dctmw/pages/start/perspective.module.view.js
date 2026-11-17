/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import require from "require";

import $ from "nuc/lib/jquery";

import Url from "nuc/utils/url";

import SmartTheming from "smart/themes/theming";

import ModuleBaseView from "dctmw/pages/common/module.base.view";

import Session from "dctmw/utils/authenticators/session";

import "css!dctmw/pages/start/impl/perspective.module.view";

class PerspectiveOrientedModuleView extends ModuleBaseView {
  constructor(options = {}) {
    super(options);
    this.appOptions = Object.freeze({
      ...options
    });
    this.rootContext = options.context;
    this.session = Session.get();
  }
  className() {
    return `${super.className.apply(this, arguments)} perspective-module-view`;
  }
  defaultViewState(query, path) {
    this.loading && this.loading.done(function() {
      if (this.perspectiveRouting) {
        let fragment = Url.appendQuery(!!path && path.length ? path.join("/") : "", Url.combineQueryString(query));
        fragment = fragment.replace(/\?$/, "").replace(/\/$/, "");
        this.perspectiveRouting.matchRoute(fragment);
      }
    }.bind(this));
  }
  onActivated() {
    this.isActive = true;
    this.listenToOnce(this.session, "end", this._onSessionEnd);
    if (!this.loading) {
      this.loading = $.Deferred();
      const failureHandler = error => {
        this.loading && this.loading.reject();
        delete this.loading;
        this.session.trigger("error", error);
      };
      require([ "dctmw/overrides/overrides", "dctmw/pages/start/dctm.perspective.context", "csui/widgets/navigation.header/navigation.header.controls" ], (OV, DctmPerspectiveContext) => {
        this.context = new DctmPerspectiveContext({
          context: this.rootContext,
          ...this.appOptions
        });
        const perspectiveOptions = {
          ...this.appOptions,
          context: this.context
        };
        let modOptions = {
          ...perspectiveOptions
        };
        this.initPerspectiveSetup(modOptions).done(() => {
          require([ "dctmw/pages/start/dctm.perspective.routing", "csui/utils/non-emptying.region/non-emptying.region", "csui/pages/start/impl/navigationheader/navigationheader.view", "csui/controls/perspective.panel/perspective.panel.view" ], (DctmPerspectiveRouting, NonEmptyingRegion, NavigationHeaderView, PerspectivePanelView) => {
            this.perspectiveRouting = DctmPerspectiveRouting.getInstance({
              ...modOptions,
              ...perspectiveOptions
            });
            this.perspectiveRouting.start().done(() => {
              if (this.hasNavigationHeader()) {
                this.navigationHeader = this.createApplicationHeaderView({
                  ...modOptions,
                  ...perspectiveOptions,
                  signInPageUrl: this.options.signInPageUrl
                }, NavigationHeaderView);
              }
              if (this.hasStandardPerspective()) {
                this.perspectivePanel = this.createPerpsectivePanelView({
                  ...modOptions,
                  ...perspectiveOptions
                }, PerspectivePanelView);
              }
              modOptions = {
                ...modOptions,
                ...perspectiveOptions
              };
              this.finalizePerspectiveSetup(modOptions).then(() => {
                if (this.navigationHeader) {
                  this.listenToOnce(this.navigationHeader, "render:controls", function(self) {
                    self.trigger("processbar:finished");
                  });
                  new NonEmptyingRegion({
                    el: this.el
                  }).show(this.navigationHeader);
                }
                if (this.perspectivePanel) {
                  new NonEmptyingRegion({
                    el: this.el
                  }).show(this.perspectivePanel);
                }
                return this.renderAddlPerpsectivePanels({
                  ...modOptions,
                  ...perspectiveOptions
                });
              }).done(() => {
                this.ui.loaderIcon.remove();
                this.loading.resolve();
              }).fail(failureHandler);
            }).fail(failureHandler);
          }, failureHandler);
        }).fail(failureHandler);
      }, failureHandler);
    }
  }
  onDeactivated() {
    this.isActive = false;
    this.stopListening(this.session, "end");
  }
  initPerspectiveSetup(options) {
    const dfd = $.Deferred();
    const isEmbedded = options.embedMode;
    require([ "dctmw/utils/startup", "dctmw/utils/theme/theme.config.manager" ], (startup, ThemeConfigManager) => {
      startup.beforeStartup(options).always(() => {
        if (isEmbedded === true || SmartTheming.isJATOTheme()) {
          return $.Deferred().resolve().promise();
        } else {
          return ThemeConfigManager.getUserThemeModel(options.context).fetch();
        }
      }).done(dfd.resolve).fail(dfd.reject);
    }, dfd.reject);
    return dfd.promise();
  }
  finalizePerspectiveSetup(options) {
    const dfd = $.Deferred();
    require([ "dctmw/utils/startup" ], startup => {
      startup.afterStartup(options).done(dfd.resolve).fail(dfd.reject);
    }, dfd.reject);
    return dfd.promise();
  }
  hasNavigationHeader() {
    return true;
  }
  hasStandardPerspective() {
    return true;
  }
  createApplicationHeaderView(options, DefaultHeaderViewClass) {
    return new DefaultHeaderViewClass(options);
  }
  createPerpsectivePanelView(options, DefaultPerspectivePanelViewClass) {
    return new DefaultPerspectivePanelViewClass(options);
  }
  renderAddlPerpsectivePanels() {
    return $.Deferred().resolve().promise();
  }
  _onSessionEnd() {
    this.context && this.context.reset();
  }
  onBeforeDestroy() {
    this.navigationHeader && this.navigationHeader.destroy();
    this.perspectivePanel && this.perspectivePanel.destroy();
  }
}

Object.defineProperty(PerspectiveOrientedModuleView.prototype.constructor, "name", {
  value: "PerspectiveOrientedModuleView"
});

export default PerspectiveOrientedModuleView;