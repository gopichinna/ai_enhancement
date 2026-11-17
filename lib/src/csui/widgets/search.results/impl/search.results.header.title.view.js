/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/marionette", "hbs!csui/widgets/search.results/impl/search.results.header.title", "i18n!csui/widgets/search.results/nls/lang", "i18n!csui/widgets/search.results/impl/nls/lang", "css!csui/widgets/search.results/impl/search.results" ], function(module, _, Marionette, template, publicLang, lang) {
  "use strict";
  let config = module.config();
  _.defaults(config, {
    enableSaveSearchInHeader: false
  });
  var TitleView = Marionette.ItemView.extend({
    template: template,
    templateHelpers: function() {
      return {
        enableSaveSearchInHeader: config.enableSaveSearchInHeader
      };
    },
    constructor: function TitleView(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    ui: {
      resultTitle: "#resultsTitle",
      titleText: "#titleText",
      customSearchTitle: "#customSearchTitle",
      headerCount: "#headerCount",
      searchHeaderCountLive: "#searchHeaderCountLive"
    },
    _assignTotalItemElem: function() {
      this.count = this.options.count;
      var countTxtAria = "";
      if (this.count !== undefined) {
        var searchResultHeader = this.options.searchResultHeader;
        countTxtAria = searchResultHeader;
      } else {
        countTxtAria = lang.noSearchResultMessage;
      }
      this.ui.headerCount.empty();
      this.ui.headerCount.append(searchResultHeader);
      this.ui.headerCount[0].setAttribute("title", searchResultHeader);
      this.countTextAria = lang.searchResults + ": " + countTxtAria + ". " + lang.searchQueryKeyboardShortcut;
      this.ui.searchHeaderCountLive.text(this.countTextAria);
      return true;
    },
    _updateSearchResultsTitle: function() {
      let searchHeaderTitle = lang.searchResults + ": ";
      let tooltipText;
      let titleText = "";
      if (!!this.options.useCustomTitle && !!this.title) {
        this.ui.customSearchTitle.text(this.title);
        tooltipText = searchHeaderTitle + this.title;
      } else {
        titleText = this.options.searchHeaderTitle.replace(searchHeaderTitle, "");
        this.ui.titleText.text(titleText);
        tooltipText = searchHeaderTitle + titleText;
      }
      this.ui.resultTitle.text(searchHeaderTitle);
      this.ui.resultTitle.parent().attr("title", tooltipText);
    },
    setCustomSearchTitle: function(title) {
      this.title = '"' + title + '"';
      var resultsTitle = lang.searchResults + ": ";
      this.ui.resultTitle.parent().attr("title", resultsTitle + this.title);
    },
    onRender: function() {
      this._assignTotalItemElem();
      this._updateSearchResultsTitle();
    }
  });
  return TitleView;
});