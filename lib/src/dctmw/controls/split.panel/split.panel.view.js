/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "smart/utils/accessibility", "csui/controls/form/pub.sub", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "dctmw/utils/constants", "dctmw/utils/user.preference.storage", "i18n", "hbs!dctmw/controls/split.panel/impl/split.panel", "css!dctmw/controls/split.panel/impl/split.panel", "csui/lib/jquery.ui/js/jquery-ui" ], function(_, $, Backbone, Marionette, Accessibility, PubSub, LayoutViewEventsPropagationMixin, constants, userPreference, i18n, template) {
  "use strict";
  var Types = Object.freeze({
    TWO_WAY: "two_way",
    THREE_WAY: "three_way"
  }), Panes = Object.freeze({
    PRIMARY: "Primary",
    SECONDARY: "Secondary",
    TERTIARY: "Tertiary"
  });
  var SplitPanelView = Marionette.LayoutView.extend({
    className: function() {
      var clazz = "d2-split-panel-container";
      if (this.type === Types.THREE_WAY) {
        clazz += " three-way";
      }
      return clazz;
    },
    template: template,
    regions: {
      rgnPrimaryPane: ".primary-pane-content",
      rgnSecondaryPane: ".secondary-pane-content",
      rgnTertiaryPane: ".tertiary-pane-content"
    },
    ui: {
      primaryPane: ".primary-pane",
      secondaryPane: ".secondary-pane",
      tertiaryPane: ".tertiary-pane"
    },
    constructor: function SplitPanelView(options) {
      options = options || {};
      this.type = _.contains(_.values(Types), options.type) ? options.type : Types.TWO_WAY;
      this.orientation = _.contains([ "horizontal", "vertical" ], options.orientation) ? options.orientation : "horizontal";
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.propagateEventsToRegions();
      $(window).on("resize." + this.cid, {
        view: this
      }, this._onWindowResize);
      this.listenTo(PubSub, "change:panel:layout", this._updateViews);
    },
    templateHelpers: function() {
      return {
        orientation: this.orientation,
        useFlex: false,
        useTertiary: this.type === Types.THREE_WAY
      };
    },
    onRender: function() {
      this.$el.addClass(this.className);
      var me = this, options = {
        handles: i18n && i18n.settings.rtl ? "w" : "e",
        minWidth: 240,
        start: function() {
          me.$el.addClass("d2-resizing");
        },
        stop: function() {
          me.$el.removeClass("d2-resizing");
          me.triggerMethod("dom:refresh");
        }
      };
      this.ui.primaryPane.resizable(options);
      this.ui.tertiaryPane.length && this.ui.tertiaryPane.resizable(_.defaults({
        handles: i18n && i18n.settings.rtl ? "e" : "w"
      }, options));
    },
    _onWindowResize: function(event) {
      if (event && event.data && event.data.view) {
        var self = event.data.view;
        if (self.resizeTimer) {
          clearTimeout(self.resizeTimer);
        }
        self.resizeTimer = setTimeout(function() {
          self.getLocalStorageKey() && userPreference.saveLocalStorePreference(userPreference.StorageTypes.PRIMARY_PANE_WIDTH, self.getLocalStorageKey(), self.ui.primaryPane.width());
          self._updateViews();
        }, 200);
      }
    },
    _updateViews: function(toggleState) {
      var me = this, viewPortWidth = window.innerWidth, splitterState = "enable", showSideBar = _.isUndefined(toggleState) ? _.isUndefined(this.resolutionState && this.resolutionState.showSideBar) ? true : this.resolutionState.showSideBar : toggleState, resolutionCLasses = [ "d2-lowest-resolution-split-panel", "d2-low-resolution-split-panel", "d2-medium-resolution-split-panel", "d2-above-medium-resolution-split-panel", "d2-high-resolution-split-panel", "d2-highest-resolution-split-panel" ], getAllResolutionClassesExcept = function(className) {
        return _.without(resolutionCLasses, className).join(" ");
      }, setResolutionClass = function(className) {
        me.$el.addClass(className).removeClass(getAllResolutionClassesExcept(className));
      };
      if (viewPortWidth <= constants.Resolution.LOWEST) {
        splitterState = "disable";
        setResolutionClass("d2-lowest-resolution-split-panel");
        showSideBar = _.isUndefined(toggleState) ? _.isUndefined(this.resolutionState && this.resolutionState.showSideBar) ? false : this.resolutionState.showSideBar : toggleState;
      } else if (viewPortWidth > constants.Resolution.LOWEST && viewPortWidth <= constants.Resolution.LOW) {
        splitterState = "disable";
        setResolutionClass("d2-low-resolution-split-panel");
        showSideBar = _.isUndefined(toggleState) ? _.isUndefined(this.resolutionState && this.resolutionState.showSideBar) ? false : this.resolutionState.showSideBar : toggleState;
      } else if (viewPortWidth > constants.Resolution.LOW && viewPortWidth <= constants.Resolution.MEDIUM) {
        setResolutionClass("d2-medium-resolution-split-panel");
        showSideBar = _.isUndefined(toggleState) ? _.isUndefined(this.resolutionState && this.resolutionState.showSideBar) ? true : this.resolutionState.showSideBar : toggleState;
      } else if (viewPortWidth > constants.Resolution.MEDIUM && viewPortWidth < constants.Resolution.HIGH) {
        showSideBar = true;
        setResolutionClass("d2-above-medium-resolution-split-panel");
      } else if (viewPortWidth >= constants.Resolution.HIGH && viewPortWidth < constants.Resolution.HIGHEST) {
        showSideBar = true;
        setResolutionClass("d2-high-resolution-split-panel");
      } else {
        showSideBar = true;
        setResolutionClass("d2-highest-resolution-split-panel");
      }
      this.ui.primaryPane.resizable(splitterState);
      this.ui.tertiaryPane.resizable(splitterState);
      this.resolutionState = {
        viewPortWidth: viewPortWidth,
        showSideBar: showSideBar
      };
      var splitPanelConfig = {
        primary: {
          hide: false,
          direction: i18n.settings.rtl ? "right" : "left",
          panel: this.ui.primaryPane,
          region: this.rgnPrimaryPane
        },
        secondary: {
          hide: false,
          direction: i18n.settings.rtl ? "right" : "left",
          panel: this.ui.secondaryPane,
          region: this.rgnSecondaryPane
        },
        tertiaryPane: {
          hide: false,
          direction: i18n.settings.rtl ? "left" : "right",
          panel: this.ui.tertiaryPane,
          region: this.rgnTertiaryPane
        }
      };
      splitPanelConfig.primary.hide = this.rgnPrimaryPane.currentView && this.rgnPrimaryPane.currentView.triggerMethod("resolution:change", this.resolutionState);
      splitPanelConfig.secondary.hide = this.rgnSecondaryPane.currentView && this.rgnSecondaryPane.currentView.triggerMethod("resolution:change", this.resolutionState);
      splitPanelConfig.tertiaryPane.hide = this.rgnTertiaryPane.currentView ? this.rgnTertiaryPane.currentView.triggerMethod("resolution:change", this.resolutionState) : true;
      _.each(splitPanelConfig, function(panelConfig, index) {
        if (panelConfig.hide) {
          this.collapsePanel(panelConfig.panel, panelConfig.direction, panelConfig.region);
        } else {
          if (!Accessibility.isAccessibleMode() || Accessibility.isAccessibleMode() && index !== "tertiaryPane") {
            this.expandPanel(panelConfig.panel, panelConfig.direction, panelConfig.region);
          }
        }
      }, this);
      if (this.getLocalStorageKey()) {
        var primPaneWidth = userPreference.getLocalStorePreference(userPreference.StorageTypes.PRIMARY_PANE_WIDTH, this.getLocalStorageKey());
        if (primPaneWidth) {
          this.ui.primaryPane.css("width", primPaneWidth);
        }
      }
    },
    getLocalStorageKey: function() {
      return this.rgnPrimaryPane.currentView && this.rgnPrimaryPane.currentView.getWidgetTypeId && this.rgnPrimaryPane.currentView.getWidgetTypeId();
    },
    collapsePanel: function(panel, direction, region) {
      if (region.collapsed) {
        return;
      }
      var width = panel.width();
      region.currentView && region.currentView.triggerMethod("before:collapse");
      panel.data("restoreWidth", width);
      panel.css({
        "flex-basis": width
      });
      panel.css("min-width", 0);
      panel.animate({
        "flex-basis": 0
      }, {
        duration: 300,
        complete: function() {
          region.collapsed = true;
          region.currentView && region.currentView.triggerMethod("after:collapse");
          $(window).trigger("resize.tableview");
        }
      });
    },
    expandPanel: function(panel, direction, region) {
      if (!region.collapsed) {
        return;
      }
      var width = panel.data("restoreWidth");
      region.currentView && region.currentView.triggerMethod("before:expand");
      panel.css({
        "flex-basis": 0
      });
      panel.animate({
        "flex-basis": width
      }, {
        duration: 300,
        complete: function() {
          region.collapsed = false;
          panel.css("min-width", "");
          panel.css({
            "flex-basis": "auto"
          });
          region.currentView && region.currentView.triggerMethod("after:expand");
          $(window).trigger("resize.tableview");
        }
      });
    },
    showPanelViews: function(primaryPaneView, secondaryPaneView, tertiaryPaneView) {
      if (primaryPaneView instanceof Marionette.View) {
        this.rgnPrimaryPane.show(primaryPaneView);
        this.rgnPrimaryPane.collapsed = false;
      }
      if (secondaryPaneView instanceof Marionette.View) {
        this.rgnSecondaryPane.show(secondaryPaneView);
        this.rgnSecondaryPane.collapsed = false;
      }
      if (tertiaryPaneView instanceof Marionette.View && this.ui.tertiaryPane.length) {
        this.rgnTertiaryPane.show(tertiaryPaneView);
        this.rgnTertiaryPane.collapsed = false;
      }
      this._updateViews();
    },
    getHostElementForContentInPane: function(paneName) {
      if (paneName) {
        var selector = "." + paneName.toLowerCase() + "-pane-content";
        return this.$el.find(selector);
      }
      return null;
    },
    getHostRegionForContentInPane: function(paneName) {
      return this["rgn" + paneName + "Pane"];
    },
    _destroyResizer: function($el) {
      $el && $el.length && $el.resizable("instance") && $el.resizable("destroy");
    },
    onBeforeDestroy: function() {
      $(window).off("resize." + this.cid);
      this._destroyResizer(this.ui.primaryPane);
      this._destroyResizer(this.ui.tertiaryPane);
    }
  }, {
    TYPES: Types,
    PANES: Panes
  });
  _.extend(SplitPanelView.prototype, LayoutViewEventsPropagationMixin);
  return SplitPanelView;
});