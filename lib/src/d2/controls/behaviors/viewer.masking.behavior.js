/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "css!d2/controls/behaviors/impl/viewer.masking.behavior" ], function(_, $, Marionette) {
  "use strict";
  var ViewerMaskingBehavior = Marionette.Behavior.extend({
    constructor: function ViewerMaskingBehavior(options, view) {
      Marionette.Behavior.prototype.constructor.apply(this, arguments);
      this.view = view;
      this.maskDivTemplate = $('<div class="d2-page-mask" />');
      this.maskingDivs = null;
      _.defaults(view, {
        isAppliedMask: function() {
          if (this.maskingDivs) {
            return true;
          }
          return false;
        }.bind(this)
      });
      this._registerEventHandlers();
    },
    _registerEventHandlers: function() {
      var self = this;
      this.listenTo(this.view, "apply:mask", function() {
        self.applyMask();
      });
      this.listenTo(this.view, "remove:mask", function() {
        self.removeMask();
      });
    },
    applyMask: function() {
      var me = this;
      if (!this.maskingDivs) {
        $("body").find(".cs-perspective-panel").addClass("d2-dirty-markup");
        this.maskingDivs = $();
        var navbarClass = $("body").find(".d2-navbar").length > 0 ? "d2-navbar" : "binf-navbar-default";
        if (this.view.isEmbeddedPreview) {
          var psWidth = $("body").find(".d2-split-panel-content.primary-pane").width() + $("body").find(".d2-split-panel-content.secondary-pane").width();
          this.maskingDivs = this.maskingDivs.add(this.maskDivTemplate.clone().prependTo($("body").find(".d2-task-documents-widget .d2-task-documents-title-container")));
          this.maskingDivs = this.maskingDivs.add(this.maskDivTemplate.clone().prependTo($("body").find(".d2-split-panel-content.primary-pane")));
          this.maskingDivs = this.maskingDivs.add(this.maskDivTemplate.clone().css("width", psWidth + "px").prependTo($("body").find(".d2-split-panel-content.secondary-pane")));
          this.maskingDivs = this.maskingDivs.add(this.maskDivTemplate.clone().prependTo($("body").find(".breadcrumb-inner")));
          this.maskingDivs = this.maskingDivs.add(this.maskDivTemplate.clone().prependTo($("body").find("." + navbarClass)));
          this.maskingDivs = this.maskingDivs.add(this.maskDivTemplate.clone().prependTo($("body").find(".metadata-navigation .metadata-sidebar")));
          this.maskingDivs = this.maskingDivs.add(this.maskDivTemplate.clone().prependTo($("body").find(".metadata-content .cs-metadata")));
        } else {
          this.maskingDivs = this.maskingDivs.add(this.maskDivTemplate.clone().prependTo($("body").find(".cs-perspective-panel")));
          this.maskingDivs = this.maskingDivs.add(this.maskDivTemplate.clone().prependTo($("body").find("." + navbarClass)));
        }
        $("body").find("div.binf-widgets").children().each(function() {
          if (this.id !== "csui-icon-preload" && !$(this).hasClass("d2-doc-preview") && !$(this).hasClass("csui-full-page-modal")) {
            me.maskingDivs = me.maskingDivs.add(me.maskDivTemplate.clone().prependTo(this));
          }
        });
      }
    },
    removeMask: function() {
      this.maskingDivs && this.maskingDivs.remove();
      $("body").find(".cs-perspective-panel").removeClass("d2-dirty-markup");
      this.maskingDivs = undefined;
    }
  });
  return ViewerMaskingBehavior;
});