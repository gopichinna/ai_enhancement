/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "smart/utils/smart.base", "hbs!smart/controls/breadcrumbs/impl/breadcrumb", "i18n!smart/controls/breadcrumbs/impl/nls/lang", "smart/themes/theming", "smart/themes/jato.icons/smart.jato.action.icons", "smart/utils/otwc.loader", "smart/themes/carbonfiber/ot-icons/icons_smart_action_16", "smart/themes/carbonfiber/ot-icons/icons_smart_action" ], function(_, $, Marionette, smartBase, template, lang, theming, jatoIcons) {
  "use strict";
  var BreadcrumbItemView = Marionette.ItemView.extend({
    tagName: "li",
    template: template,
    modelEvents: {
      change: "render"
    },
    events: {
      "click a.csui-breadcrumb": "onClickLink",
      "click otc-link.csui-breadcrumb": "onClickLink",
      "click otc-menuitem.csui-breadcrumb": "onClickLink"
    },
    onClickLink: function(e) {
      if (smartBase.isControlClick(e)) {} else {
        e.preventDefault();
        var model = this.model;
        if (model.get("id") === "home") {
          this.triggerMethod("click:home:ancestor", model);
        } else {
          if (model.get("subcrumbs").length > 0) {
            var id = $(e.target).data("id");
            model = this._getModel(id);
          }
          this.triggerMethod("click:ancestor", model);
        }
      }
    },
    className: function() {
      var cname, subCrumbs = this.model.get("subcrumbs");
      if (this.options.isLastChild) {
        cname = "binf-active";
      } else if (subCrumbs && subCrumbs.length > 0) {
        cname = "binf-dropdown";
      } else {
        cname = "tail";
      }
      return cname;
    },
    getAncestorUrl: function(crumb) {
      return crumb.get("hrefSrc") || "#";
    },
    getDisplayName: function() {
      return this.model.get("displayName") || this.model.get("name_formatted") || this.model.get("name");
    },
    templateHelpers: function() {
      var options = this.options, cid = this.cid, subCrumbs = _.map(this.model.get("subcrumbs"), _.bind(function(crumb) {
        return _.extend(crumb.toJSON(), {
          url: this.getAncestorUrl(crumb)
        });
      }, this)), theme = this.options.theme, moreIconTheme = this.options.theme === "light" ? "dark" : "light", styleObj = "", honorCustomizations = this.options?.honorCustomizations ?? false;
      if (honorCustomizations && this.options.textColor) {
        styleObj = `style= "color: ${this.options.textColor}"`;
      }
      return {
        isJATO: theming.isJATOTheme(),
        moreSVGContent: jatoIcons.actionMoreHorizontal,
        homeSVFContent: jatoIcons.actionHome,
        inactive: this.model.get("inactive") || options.isLastChild,
        hasSubCrumbs: subCrumbs.length > 0,
        subcrumbs: subCrumbs,
        btnId: cid,
        name: this.getDisplayName(),
        url: this.getAncestorUrl(this.model),
        subcrumbTooltip: lang.subcrumbTooltip,
        subcrumbAria: lang.subcrumbAria,
        isHome: this.model.get("id") === "home",
        bcMoreBtnTheme: moreIconTheme,
        homeIconName: "csui_smart_mime_home" + (theme === "dark" ? "_li" : ""),
        styleObj: styleObj,
        honorCustomizations: honorCustomizations
      };
    },
    onRender: function() {},
    constructor: function BreadcrumbItemView(options = {}) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      if (!this.model.has("subcrumbs")) {
        this.model.set("subcrumbs", [], {
          silent: true
        });
      }
    },
    _getModel: function(id) {
      var subCrumbs = this.model.get("subcrumbs"), model = subCrumbs?.find(subCrumb => subCrumb.get("id") === id);
      return model;
    }
  });
  return BreadcrumbItemView;
});