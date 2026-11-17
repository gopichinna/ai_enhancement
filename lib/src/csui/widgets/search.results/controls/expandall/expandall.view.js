/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/marionette", "hbs!csui/widgets/search.results/controls/expandall/impl/expandall", "i18n!csui/widgets/search.results/impl/nls/lang", "smart/themes/theming", "csui/themes/csui.jato.action.icons", "css!csui/widgets/search.results/controls/expandall/impl/expandall" ], function($, Marionette, template, lang, theming, JatoIcons) {
  var expandAllView = Marionette.ItemView.extend({
    template: template,
    templateHelpers: function() {
      var messages = {
        expandAll: lang.expandAll
      };
      return {
        messages: messages,
        isJATO: theming.isJATOTheme(),
        iconSVG: JatoIcons.actionChevronLargeDown,
        iconName: "smart_action:action_caret_down32"
      };
    },
    events: {
      "click @ui.expandAllSelector": "expandAll"
    },
    ui: {
      expandAllSelector: ".csui-search-header-expand-all",
      expandJatoIcon: ".expand-jato-icon",
      expandAllLabelText: ".csui-search-expandall-text"
    },
    expandAll: function(event) {
      event.preventDefault();
      if (this.collection.length === 0) return;
      if (this._isExpanded) {
        this._isExpanded = false;
        this.ui.expandAllLabelText.html(lang.expandAll);
        this.ui.expandAllLabelText.attr("title", lang.expandAll);
        $(".csui-expand-all").addClass("csui-collapse-all");
        if (theming.isJATOTheme()) {
          this.ui.expandJatoIcon.attr("svg", JatoIcons.actionChevronLargeDown);
        } else {
          this.ui.expandAllSelector.attr("icon", "smart_action:action_caret_down32");
        }
        this.ui.expandAllSelector.attr("title", lang.expandAll).attr("arialabel", lang.expandAll);
        this.options.view.$el.find("." + this.options._eleCollapse).trigger("click");
      } else {
        this._isExpanded = true;
        this.ui.expandAllLabelText.html(lang.collapseAll);
        this.ui.expandAllLabelText.attr("title", lang.collapseAll);
        $(".csui-expand-all").removeClass("csui-collapse-all");
        if (theming.isJATOTheme()) {
          this.ui.expandJatoIcon.attr("svg", JatoIcons.actionChevronLargeUp);
        } else {
          this.ui.expandAllSelector.attr("icon", "smart_action:action_caret_up32");
        }
        this.ui.expandAllSelector.attr("title", lang.collapseAll).attr("arialabel", lang.collapseAll);
        this.options.view.$el.find("." + this.options._eleExpand).trigger("click");
      }
      if (this.options.view.options.layoutView) {
        this.options.view.options.layoutView.updateScrollbar();
      }
    },
    pageChange: function() {
      this._isExpanded = false;
      this.ui.expandAllLabelText.html(lang.expandAll);
      this.ui.expandAllLabelText.attr("title", lang.expandAll);
      if (theming.isJATOTheme()) {
        this.ui.expandJatoIcon.attr("svg", JatoIcons.actionChevronLargeDown);
      } else {
        this.ui.expandAllSelector.attr("title", lang.expandAll).attr("aria-label", lang.expandAll).attr("icon", "smart_action:action_caret_down32");
      }
    }
  });
  return expandAllView;
});