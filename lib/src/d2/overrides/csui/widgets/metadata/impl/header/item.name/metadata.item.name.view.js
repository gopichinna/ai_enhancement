/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "csui/controls/form/pub.sub" ], function(require, _, PubSub) {
  "use strict";
  require([ "csui/widgets/metadata/impl/header/item.name/metadata.item.name.view", "i18n!csui/widgets/metadata/impl/nls/lang" ], function(MetadataItemNameView, csMetaLang) {
    var proto = MetadataItemNameView.prototype, originalToggleSideBar = proto.toggleSideBar, originalApplyToggle = proto._applyToggle, originalRender = proto.onRender;
    MetadataItemNameView.prototype.toggleSideBar = function(event) {
      originalToggleSideBar.apply(this, arguments);
      if (!!event && (event.keyCode === 13 || event.keyCode === 32 || event.type === "click")) {
        var parentWrapper = this.leftBar.closest(".metadata-navigation");
        if (parentWrapper.length === 0) {
          if (this.ui.toggleIcon.is(":visible")) {
            if (this.ui.toggleIcon.hasClass("csui-metadata-listview-expand-icon")) {
              this.ui.toggleIcon.addClass("csui-metadata-listview-collapse-icon").removeClass("csui-metadata-listview-expand-icon");
              this.ui.toggleIcon.attr({
                title: csMetaLang.collapse,
                "aria-label": csMetaLang.collapse
              });
              PubSub.trigger("change:panel:layout", true);
            } else {
              this.ui.toggleIcon.addClass("csui-metadata-listview-expand-icon").removeClass("csui-metadata-listview-collapse-icon");
              this.ui.toggleIcon.attr({
                title: csMetaLang.expand,
                "aria-label": csMetaLang.expand
              });
              PubSub.trigger("change:panel:layout", false);
            }
          }
        }
      }
    };
    MetadataItemNameView.prototype._applyToggle = function(showSideBar) {
      originalApplyToggle.apply(this, arguments);
      if (!_.isUndefined(showSideBar)) {
        this.showSideBar = showSideBar;
        if (showSideBar) {
          this.ui.toggleIcon.addClass("csui-metadata-listview-collapse-icon").removeClass("csui-metadata-listview-expand-icon");
          this.ui.toggleIcon.attr({
            title: csMetaLang.collapse,
            "aria-label": csMetaLang.collapse
          });
          this.ui.backEle.hide();
        } else {
          this.ui.toggleIcon.addClass("csui-metadata-listview-expand-icon").removeClass("csui-metadata-listview-collapse-icon");
          this.ui.toggleIcon.attr({
            title: csMetaLang.expand,
            "aria-label": csMetaLang.expand
          });
          this.ui.backEle.show();
          this.ui.backEle.attr("tabindex", "0");
        }
        this.ui.toggleIcon.attr("tabindex", "0");
      }
    };
    MetadataItemNameView.prototype.onRender = function() {
      originalRender.apply(this, arguments);
      if (!_.isUndefined(this.showSideBar)) {
        this._applyToggle(this.showSideBar);
      }
    };
  });
});