/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/utils/base", "hbs!d2/dialogs/new.file/create/impl/switchview/impl/tiles.view", "i18n!d2/dialogs/new.file/create/impl/nls/lang" ], function(_, $, Backbone, Marionette, base, thumbnailHeaderTemplate, lang) {
  "use strict";
  var LayoutSwitchView = Marionette.LayoutView.extend({
    className: "d2-layout-swtich",
    regions: {},
    behaviors: {},
    ui: {
      switchViewLink: "a.switch-view-link",
      toggleIcon: "a.switch-view-link span.icon"
    },
    events: {
      "click @ui.switchViewLink": "onClick"
    },
    template: thumbnailHeaderTemplate,
    templateHelpers: function() {
      return {
        isThumbnail: this.options.isThumbnail,
        title: this.options.isThumbnail ? lang.listView : lang.thumbnailView
      };
    },
    constructor: function TemplateHeaderView(options) {
      options || (options = {});
      Marionette.LayoutView.prototype.constructor.call(this, options);
    },
    onClick: function(event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.options.isThumbnail = !this.options.isThumbnail;
      this.options.parentView.trigger("reloadTiles");
      this.render();
      this.ui.switchViewLink.trigger("focus");
    }
  });
  return LayoutSwitchView;
});