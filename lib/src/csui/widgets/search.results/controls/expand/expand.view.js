/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/marionette3", "smart/themes/theming", "csui/themes/csui.jato.action.icons", "hbs!csui/widgets/search.results/controls/expand/impl/expand" ], function(Marionette, theming, JatoIcons, template) {
  "use strict";
  const ExpandView = Marionette.View.extend({
    template: template,
    templateContext: function() {
      return {
        isJATO: theming.isJATOTheme(),
        iconSVG: JatoIcons.actionChevronLargeDown,
        iconName: "smart_action:action_caret_down32"
      };
    },
    ui: {
      expandJatoIcon: ".expand-jato-icon",
      btnExpand: ".expand-btn"
    },
    events: {
      "click otc-button": "onClick"
    },
    constructor: function ExpandView(options = {}) {
      Marionette.View.call(this, options);
    },
    onClick: function() {
      const btn = this.el.querySelector("otc-button");
      if (this.options.originatingView._isExpanded) {
        btn.classList.remove("standard-search-expandArrowUp");
        btn.classList.add("standard-search-expandArrowDown");
        !theming.isJATOTheme() && this.ui.btnExpand.attr("icon", "smart_action:action_caret_down32");
        this.ui.expandJatoIcon?.attr("svg", JatoIcons.actionChevronLargeDown);
      } else {
        btn.classList.remove("standard-search-expandArrowDown");
        btn.classList.add("standard-search-expandArrowUp");
        !theming.isJATOTheme() && this.ui.btnExpand.attr("icon", "smart_action:action_caret_up32");
        this.ui.expandJatoIcon?.attr("svg", JatoIcons.actionChevronLargeUp);
      }
    }
  });
  return ExpandView;
});