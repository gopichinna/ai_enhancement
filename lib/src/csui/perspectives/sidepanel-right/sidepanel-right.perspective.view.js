/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/backbone", "csui/lib/jquery", "csui/lib/marionette", "csui/perspectives/mixins/perspective.edit.mixin", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "csui/perspectives/banner-content-sidebar/banner-content-sidebar.perspective.view", "hbs!csui/perspectives/sidepanel-right/impl/sidepanel-right", "css!csui/perspectives/banner-content-sidebar/impl/banner-content-sidebar" ], function(module, _, Backbone, $, Marionette, PerspectiveEditMixin, LayoutViewEventsPropagationMixin, BannerContentSidebarView, perspectiveTemplate) {
  var SidepanelRightPerspectiveView = BannerContentSidebarView.extend({
    template: perspectiveTemplate,
    templateHelpers: function() {
      var showBanner;
      if (this.options.perspectiveMode === "edit" || this.options.perspectiveMode === "personalize" && !!this.options.banner.length) {
        showBanner = true;
      } else {
        showBanner = !!this.options.banner.length && this.options.banner[0].hidden !== true ? true : false;
      }
      return {
        showBanner: showBanner,
        sidebarRight: true,
        sidebarLeft: false
      };
    },
    constructor: function SidepanelRightPerspectiveView(options) {
      options || (options = {});
      options = $.extend(true, {}, options);
      this.perspectiveType = "sidepanel-right";
      options.context.perspective.type = this.perspectiveType;
      BannerContentSidebarView.prototype.constructor.call(this, options);
      var self = this;
      this.listenTo(this, "expand:view", function() {
        if (self.headerView) {
          if (self.headerView.$el.parent().hasClass("binf-hidden")) {
            self.headerView.$el.parent().removeClass("binf-hidden");
          } else {
            self.headerView.$el.parent().addClass("binf-hidden");
          }
        }
        if (self.contentView.$el.has(".csui-expand-view").length) {
          self.contentView.$el.parent().addClass("csui-expanded-view");
          self.sidebarView.$el.parent().removeClass("csui-expanded-view").addClass("binf-hidden");
        } else if (self.sidebarView.$el.has(".csui-expand-view").length) {
          self.sidebarView.$el.parent().addClass("csui-expanded-view");
          self.contentView.$el.parent().removeClass("csui-expanded-view").addClass("binf-hidden");
        } else {
          self.sidebarView.$el.parent().removeClass("csui-expanded-view binf-hidden");
          self.contentView.$el.parent().removeClass("csui-expanded-view binf-hidden");
        }
      });
    }
  });
  _.extend(SidepanelRightPerspectiveView.prototype, LayoutViewEventsPropagationMixin);
  PerspectiveEditMixin.mixin(SidepanelRightPerspectiveView.prototype);
  return SidepanelRightPerspectiveView;
});