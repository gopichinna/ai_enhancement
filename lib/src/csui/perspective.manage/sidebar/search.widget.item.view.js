/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/backbone", "csui/lib/handlebars", "csui/perspective.manage/impl/widget.item.view", "smart/themes/theming", "csui/themes/csui.jato.action.icons", "i18n!csui/perspective.manage/impl/nls/lang", "hbs!csui/perspective.manage/sidebar/impl/search.widget.item", "css!csui/perspective.manage/sidebar/impl/search.widget.item" ], function(Backbone, Handlebars, WidgetItemView, theming, jatoActionIcons, Lang, SearchWidgetItemTemplate) {
  "use strict";
  Handlebars.registerHelper("splitTitle", function(title, query) {
    if (query.length) {
      let html = "";
      let remainingQuery = query;
      const words = title.split(" ");
      const isExactWordMatch = words.some(el => el.toLowerCase().includes(remainingQuery));
      let isMultiWordMatchFound = false;
      function constructWordHtml(word, query, isHighlight) {
        let wordHtml = "";
        const wordLower = word.toLowerCase();
        const queryIndex = wordLower.indexOf(query);
        if (isHighlight && queryIndex !== -1) {
          wordHtml += `<span>${word.substring(0, queryIndex)}</span>`;
          wordHtml += `<span class="csui-search-bold-character">${word.substring(queryIndex, queryIndex + query.length)}</span>`;
          wordHtml += `<span>${word.substring(queryIndex + query.length)}</span>`;
        } else {
          wordHtml += `<span>${word}</span>`;
        }
        return wordHtml;
      }
      words.forEach(function(word, index) {
        let wordHtml = "";
        if (remainingQuery.length === 0) {
          wordHtml += `<span>${word}</span>`;
        } else {
          const wordLower = word.toLowerCase();
          const queryIndex = wordLower.indexOf(remainingQuery);
          if (queryIndex !== -1) {
            wordHtml = constructWordHtml(word, remainingQuery, true);
            remainingQuery = "";
          } else {
            const wordIndex = remainingQuery.indexOf(wordLower);
            if (wordIndex !== -1) {
              isMultiWordMatchFound = true;
              const matchedQuery = remainingQuery.substring(0, word.length);
              wordHtml = constructWordHtml(word, matchedQuery, true);
              remainingQuery = remainingQuery.substring(word.length);
            } else if (!isExactWordMatch && !isMultiWordMatchFound) {
              let currentIndex = 0;
              let partialMatchFound = false;
              for (let i = 0; i < wordLower.length; i++) {
                if (wordLower[i] === remainingQuery[currentIndex] && (wordLower[i + 1] === remainingQuery[currentIndex + 1] || i === wordLower.length - 1)) {
                  currentIndex++;
                  partialMatchFound = true;
                }
              }
              if (partialMatchFound) {
                const matchedQuery = remainingQuery.substring(0, currentIndex);
                wordHtml = constructWordHtml(word, matchedQuery, true);
                remainingQuery = remainingQuery.substring(currentIndex);
              } else {
                wordHtml = constructWordHtml(word, "", false);
              }
            } else {
              wordHtml = constructWordHtml(word, "", false);
            }
          }
        }
        if (index < words.length - 1) {
          wordHtml += " ";
        }
        html += wordHtml;
      });
      return new Handlebars.SafeString(html);
    }
  });
  const SearchWidgetItemView = WidgetItemView.extend({
    constructor: function SearchWidgetItemView(options) {
      options || (options = {});
      WidgetItemView.prototype.constructor.apply(this, arguments);
    },
    className: "csui-widget-module-group",
    template: SearchWidgetItemTemplate,
    templateHelpers: function() {
      let widgetCollection = new Backbone.Collection(this.model.attributes.widgets);
      let disableTitle = Lang.disableTitle;
      let idx = 0;
      let widgetGroupTitle = this.model.get("title");
      widgetCollection.models.forEach(function(model) {
        model.set({
          draggable: !!model.get("canDragAndDrop"),
          disableTitle: disableTitle,
          dataAttr: model.get("id").replace(/\//g, "-"),
          allowMultiple: !!model.get("allowMultiple"),
          index: idx++,
          widgetGroupTitle: widgetGroupTitle,
          isJato: theming.isJATOTheme(),
          jatoDragHandleIcon: jatoActionIcons.actionDragHandle
        }, {
          silent: true
        });
      });
      return {
        widgets: widgetCollection.models,
        query: this.options?.query || ""
      };
    }
  });
  return SearchWidgetItemView;
});