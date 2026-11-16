/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/jquery", "csui/controls/tab.panel/behaviors/tab.contents.keyboard.behavior" ], function(module, $, TabContentKeyboardBehavior) {
  TabContentKeyboardBehavior.prototype.refreshTabableElements = function(view) {
    var currentView = view.options.wizard ? view.options.wizard.currentView : null;
    this.tabableElements = view.options.searchTabContentForTabableElements ? !!currentView && !!currentView.slidingList && currentView.slidingList.length > 0 ? currentView.slidingList[currentView.slidingList.length - 1].find(view.options.tabContentAccSelectors).filter(":visible") : view.$el.find(view.options.tabContentAccSelectors).filter(":visible").filter(function() {
      return !($(this).css("visibility") === "hidden" || $(this).css("display") === "none");
    }) : [];
    var i;
    for (i = this.tabableElements.length - 1; i >= 0; i--) {
      if ($(this.tabableElements[i]).hasClass("radio-item") && $(this.tabableElements[i]).attr("name") === $(this.tabableElements[i - 1]).attr("name")) {
        this.tabableElements.splice(i, 1);
      }
      if ($(this.tabableElements[i]).hasClass("checkbox-item") && $(this.tabableElements[i]).parent().parent().parent().attr("id") === $(this.tabableElements[i - 1]).parent().parent().parent().attr("id")) {
        this.tabableElements.splice(i, 1);
      }
      if (view.closestTabable && view.closestTabable($(this.tabableElements[i])) === false) {
        this.tabableElements.splice(i, 1);
      }
    }
    this.view.currentTabPosition = -1;
    this.alreadyRefreshedTabableElements = true;
    setTimeout(function() {
      view._setFirstAndLastFocusable && view._setFirstAndLastFocusable();
    }, 50);
  };
});