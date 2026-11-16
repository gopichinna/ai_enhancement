/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/backbone", "csui/lib/handlebars", "csui/perspective.manage/impl/widget.item.view", "i18n!csui/perspective.manage/impl/nls/lang", "hbs!csui/perspective.manage/sidebar/impl/search.widget.item", "css!csui/perspective.manage/sidebar/impl/search.widget.item" ], function(Backbone, Handlebars, WidgetItemView, Lang, SearchWidgetItemTemplate) {
  "use strict";
  Handlebars.registerHelper("splitTitle", function(title, query) {
    if (query.length) {
      let html = "";
      let remainingQuery = query;
      const words = title.split(" ");
      words.forEach(function(word, index) {
        let wordHtml = "";
        if (remainingQuery.length === 0) {
          wordHtml += `<span>${word}</span>`;
        } else {
          const wordLower = word.toLowerCase();
          const queryIndex = wordLower.indexOf(remainingQuery);
          if (queryIndex !== -1) {
            wordHtml += `<span>${word.substring(0, queryIndex)}</span>`;
            wordHtml += `<span class="csui-search-bold-character">${word.substring(queryIndex, queryIndex + remainingQuery.length)}</span>`;
            wordHtml += `<span>${word.substring(queryIndex + remainingQuery.length)}</span>`;
          } else {
            const wordIndex = query.indexOf(wordLower);
            if (wordIndex !== -1) {
              const matchedQuery = remainingQuery.substring(0, word.length);
              const matchedQueryIndex = wordLower.indexOf(matchedQuery);
              if (matchedQueryIndex !== -1) {
                wordHtml += `<span>${word.substring(0, matchedQueryIndex)}</span>`;
                wordHtml += `<span class="csui-search-bold-character">${word.substring(matchedQueryIndex, matchedQueryIndex + remainingQuery.length)}</span>`;
                wordHtml += `<span>${word.substring(matchedQueryIndex + remainingQuery.length, word.length)}</span>`;
              }
              remainingQuery = remainingQuery.substring(word.length);
            } else {
              wordHtml += `<span>${word}</span>`;
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
          widgetGroupTitle: widgetGroupTitle
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