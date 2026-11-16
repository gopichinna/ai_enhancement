/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/marionette", "d2/dialogs/mass.update/mass.update.document.validation/document.validation.item.view", "d2/utils/constants", "dctmw/utils/utils", "d2/controls/behaviors/wizard.tabable.region.behavior", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "hbs!d2/dialogs/mass.update/mass.update.document.validation/impl/document.validation.layout", "i18n!d2/commands/nls/localized.strings" ], function(_, Marionette, DocumentValidationItemView, constants, utils, WizardTabableRegionBehavior, PerfectScrollingBehavior, template, lang) {
  "use strict";
  var totalItemsCount;
  var ValidationLayoutView = Marionette.LayoutView.extend({
    className: "mass-update-document-validation",
    template: template,
    ui: {
      validationHeader: ".validation-header",
      validationMessageIcon: ".validation-header .message-icon",
      validationMessageLabel: ".validation-header .message-label"
    },
    regions: {
      partialUpdatedItemsRegion: ".partial-updated-items-view",
      errorItemsRegion: ".error-items-view"
    },
    constructor: function ValidationLayoutView(options) {
      options || (options = {});
      if (options.massUpdateData) {
        _.extend(options, options.massUpdateData);
      }
      Marionette.LayoutView.prototype.constructor.call(this, options);
      this._setupChildViews();
    },
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        suppressScrollX: true
      },
      TabableRegion: {
        behaviorClass: WizardTabableRegionBehavior
      }
    },
    _setupChildViews: function() {
      var opts = _.clone(this.options), headerMsg;
      totalItemsCount = this.options.massUpdateValidationData["massUpdateApplicableCount"] || 0;
      totalItemsCount += this.options.massUpdateValidationData["massUpdateNotApplicableCount"] || 0;
      totalItemsCount += this.options.massUpdateValidationData["massUpdatePartialCount"] || 0;
      if (this.options.failedNodes && this.options.failedNodes.length) {
        if (this.options.failedNodes.length === 1 && this.options.valideNodesCount === 0) {
          headerMsg = lang["MassUpdateValidationMessageNovalid" + this.options.langPrefix];
        } else if (this.options.failedNodes.length === totalItemsCount) {
          headerMsg = lang["MassUpdateValidationMessageAll" + this.options.langPrefix + "s"];
        } else if (this.options.failedNodes.length === 1) {
          headerMsg = lang["MassUpdateValidationMessageOne" + this.options.langPrefix];
        } else {
          headerMsg = lang["MassUpdateValidationMessageSome" + this.options.langPrefix + "s"];
        }
        opts.headerMsg = headerMsg;
        opts.errorNodes = this.options.failedNodes;
        this.failedNodesView = new DocumentValidationItemView(opts);
      }
      if (this.options.partialUpdatedNodes && this.options.partialUpdatedNodes.length) {
        if (this.options.partialUpdatedNodes.length === 1) {
          headerMsg = lang["PartialUpdateMessageOne" + this.options.langPrefix];
        } else {
          headerMsg = lang["PartialUpdateMessageSome" + this.options.langPrefix + "s"];
        }
        opts.headerMsg = headerMsg;
        opts.errorNodes = this.options.partialUpdatedNodes;
        this.partialUpdatedNodesView = new DocumentValidationItemView(opts);
      }
    },
    onShow: function() {
      this.partialUpdatedNodesView && this.partialUpdatedItemsRegion.$el.removeClass("binf-hidden");
      this.failedNodesView && this.errorItemsRegion.$el.removeClass("binf-hidden");
      if (this.partialUpdatedNodesView && !this.failedNodesView || !this.partialUpdatedNodesView && this.failedNodesView) {
        var errorNodesView = this.partialUpdatedNodesView ? this.partialUpdatedNodesView : this.failedNodesView;
        errorNodesView.ui.showMoreItems.click();
        errorNodesView.ui.showMoreItems.addClass("binf-hidden");
        errorNodesView.ui.toggleExpandCollapse.addClass("binf-hidden");
      }
    },
    onRender: function() {
      this.partialUpdatedNodesView && this.partialUpdatedItemsRegion.show(this.partialUpdatedNodesView);
      this.failedNodesView && this.errorItemsRegion.show(this.failedNodesView);
    },
    getTitle: function() {
      return lang.MassUpdateDocsValidationHeader;
    },
    getSubTitle: function() {
      var str = this.options.massUpdateOptions["update-types"] === constants.MassUpdateOptions.FOLDER_PROPERTIES ? lang.MassUpdatePropertyPageFoldersSubtitle : this.options.massUpdateOptions["update-types"] === constants.MassUpdateOptions.FILE_PROPERTIES ? lang.MassUpdatePropertyPageFilesSubtitle : lang.MassUpdatePropertyPageItemsSubtitle;
      return _.str.sformat(str, this.getTotalItemCount());
    },
    getTotalItemCount: function() {
      return totalItemsCount;
    },
    isNextHidden: function() {
      return this.options.massUpdateValidationData.validObjects && this.options.massUpdateValidationData.validObjects.length > 0 ? false : true;
    }
  });
  return ValidationLayoutView;
});