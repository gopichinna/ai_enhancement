/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "dctmw/controls/behaviors/visibility.detection.behavior" ], function(_, $, Backbone, VisibilityDetectionBehavior) {
  "use strict";
  var DeferredDataLoadBehavior = VisibilityDetectionBehavior.extend({
    constructor: function DeferredDataLoadBehavior() {
      VisibilityDetectionBehavior.prototype.constructor.apply(this, arguments);
      this.dataSource = this.getBehaviorOption("dataSource");
      if (!this.dataSource) {
        this.dataSource = this.view.model || this.view.collection;
      }
      if (_.isFunction(this.dataSource.fetch) && this.dataSource.fetch.name !== "deferredLoadOverride") {
        var origFetch = this.dataSource.fetch, self = this;
        this.dataSource.fetch = function deferredLoadOverride(options) {
          if (options && options.restoreOrigFetch === true) {
            self.dataSource.fetch = origFetch;
            return self.dataSource.fetch(options);
          } else {
            return $.Deferred().resolve().promise();
          }
        };
      }
    },
    onVisibilityChanged: function(isVisible) {
      VisibilityDetectionBehavior.prototype.onVisibilityChanged.call(this, isVisible);
      if (isVisible === true) {
        this.dataSource && _.isFunction(this.dataSource.ensureFetched) && this.dataSource.ensureFetched({
          restoreOrigFetch: true
        }).always(function() {
          if (this.viewBlockerApplied === true) {
            delete this.viewBlockerApplied;
            this.view.unblockActions && this.view.unblockActions();
          }
        }.bind(this));
      }
    },
    onShow: function() {
      if (this.dataSource instanceof Backbone.Collection && this.dataSource.fetch.name === "deferredLoadOverride") {
        this.viewBlockerApplied = true;
        this.view.blockActions && this.view.blockActions();
      }
    }
  });
  return DeferredDataLoadBehavior;
});