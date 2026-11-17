/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/marionette", "smart/utils/accessibility", "csui/controls/form/pub.sub", "d2/utils/constants", "d2/widgets/miniviewer/node.preview.view", "css!d2/widgets/miniviewer/impl/miniviewer" ], function(_, Marionette, Accessibility, PubSub, constants, NodePreviewView) {
  "use strict";
  var NodeMiniViewer = NodePreviewView.extend({
    className: function() {
      var zuper = NodeMiniViewer.__super__, className = "d2-miniviewer";
      var clazz = _.isString(zuper.className) ? zuper.className : _.isFunction(zuper.className) ? zuper.className.call(this, this.options) : "";
      className += " " + clazz;
      if (this.options && this.options.className) {
        className += " " + _.result(this.options, "className");
      }
      return className;
    },
    constructor: function NodeMiniViewer(options) {
      options = options || {};
      if (options.el) {
        this.elHost = options.el;
        delete options.el;
      }
      options.isEmbeddedPreview = true;
      NodePreviewView.prototype.constructor.call(this, options);
      this._isMinimized = false;
      this.listenTo(this, "widget:minimize", this._onWidgetMinimize).listenTo(this, "widget:restore", this._onWidgetRestore).listenTo(this, "viewer:close", this._onViewerClose);
    },
    onRender: function() {
      if (!this.hostRegion) {
        if (this.elHost instanceof Marionette.Region) {
          this.hostRegion = this.elHost;
        } else {
          this.hostRegion = new Marionette.Region({
            el: this.elHost
          });
        }
        this.hostRegion.show(this);
      }
    },
    onResolutionChange: function(resolutionData) {
      if (resolutionData.viewPortWidth <= constants.Resolution.MEDIUM) {
        if (resolutionData.viewPortWidth < constants.Resolution.LOW) {
          return true;
        }
        return resolutionData.showSideBar === true || this._userHasMinimized === true;
      } else {
        return this._userHasMinimized === true;
      }
    },
    onAfterExpand: function() {
      var $elViewer = this.viewer && this.viewer.$el;
      $elViewer && $elViewer.css({
        width: ""
      });
      this._isMinimized = false;
      this._triggerWidgetEvents("restored");
      if (this._needToReloadOnExpand === true) {
        this._needToReloadOnExpand = false;
        this.model.trigger("sync");
      }
    },
    onBeforeCollapse: function() {
      this._needToReloadOnExpand = this.isLoadingViewer !== false;
      var $elViewer = this.viewer && this.viewer.$el;
      $elViewer && $elViewer.css({
        width: $elViewer.width()
      });
    },
    onAfterCollapse: function() {
      this._isMinimized = true;
      this._triggerWidgetEvents("minimized");
    },
    _onWidgetMinimize: function() {
      if (!this._isMinimized) {
        this._userHasMinimized = true;
        if (window.innerWidth > constants.Resolution.LOW) {
          PubSub.trigger("change:panel:layout");
        } else {
          PubSub.trigger("change:panel:layout", true);
        }
      }
    },
    _onWidgetRestore: function() {
      if (this._isMinimized) {
        if (window.innerWidth < constants.Resolution.LOW || Accessibility.isAccessibleMode()) {
          this._onViewerExpand(null, false);
        } else {
          this._userHasMinimized = false;
          if (window.innerWidth >= constants.Resolution.MEDIUM) {
            PubSub.trigger("change:panel:layout");
          } else {
            PubSub.trigger("change:panel:layout", false);
          }
        }
      }
    },
    _onViewerClose: function(e) {
      e && e.preventDefault();
      this._onWidgetMinimize();
    },
    _triggerWidgetEvents: function(partialEventName) {
      this.trigger("widget:" + partialEventName, this);
    }
  });
  return NodeMiniViewer;
});