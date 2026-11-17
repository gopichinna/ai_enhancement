/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "csui/controls/tab.panel/behaviors/tab.contents.keyboard.behavior", "dctmw/utils/utils", "d2/utils/form.utils", "hbs!d2/widgets/metadata/error.panel/error.panel", "i18n!d2/widgets/metadata/impl/nls/lang", "css!d2/widgets/metadata/error.panel/error.panel" ], function($, _, Marionette, PerfectScrollingBehavior, TabContentsKeyboardBehavior, utils, formUtils, template, lang) {
  "use strict";
  return Marionette.ItemView.extend({
    className: "d2-metadata-errors",
    behaviors: {
      TabContentKeyboardBehavior: {
        behaviorClass: TabContentsKeyboardBehavior
      },
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: ".error-list",
        suppressScrollX: true
      }
    },
    template: template,
    ui: {
      header: ".header"
    },
    events: {
      "click @ui.header": "_headerClick",
      "click .error-text": "_itemClick"
    },
    templateHelpers: function() {
      var errs = this.errorList;
      return {
        header: _.str.sformat(errs.length > 1 ? lang.errorPanelHeaderPlural : lang.errorPanelHeaderSingular, errs.length),
        state: this.state,
        errorList: errs,
        showMobileContainer: utils.isMobile()
      };
    },
    onRender: function() {
      this.triggerMethod("refresh:tabable:elements", this);
      this.triggerMethod("relayout");
    },
    constructor: function MetadataErrorsView(options) {
      this.errorList = options.errorList || [];
      this.tabContent = options.tabContent;
      this.state = "expand";
      options.searchTabContentForTabableElements = true;
      options.tabContentAccSelectors = "a[href]";
      Marionette.ItemView.prototype.constructor.call(this, options);
      this.listenTo(this, "show", function() {
        if (this.options.wizard) {
          this.ui.header.attr("title", lang.errorPanelHeaderCollapse);
        }
      }, this);
    },
    updateErrorList: function(errorList) {
      var me = this;
      me.errorList = errorList;
      setTimeout(function() {
        if (me.isDestroyed !== true && !me._isDestroyed) {
          me.render();
        }
      }, 300);
    },
    _headerClick: function() {
      if (this.options.wizard) {
        if (this.state === "collapse") {
          this.state = "expand";
          this.$el.find(".error-list").removeClass("binf-hidden");
          this.ui.header.attr("title", lang.errorPanelHeaderCollapse);
          this.$el.find(".icon-expand").removeClass("icon-expand").addClass("icon-collapse");
        } else {
          this.state = "collapse";
          this.$el.find(".error-list").addClass("binf-hidden");
          this.ui.header.attr("title", lang.errorPanelHeaderExpand);
          this.$el.find(".icon-collapse").removeClass("icon-collapse").addClass("icon-expand");
        }
        this.triggerMethod("relayout");
      }
    },
    _itemClick: function(ev) {
      ev.preventDefault();
      ev.stopPropagation();
      var fieldCId = $(ev.target).closest(".error-text").attr("data-id");
      var error = _.find(this.errorList, function(err) {
        return err.fieldView.cid === fieldCId;
      });
      if (!error) {
        return;
      }
      formUtils.setFocusOnConfiguredElement(error.fieldView);
    }
  });
});