/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "smart/behaviors/collection.state/collection.state.view", "smart/themes/theming", "smart/themes/jato.icons/smart.jato.illustrations", "i18n!smart/controls/list/list.state/impl/nls/lang", "hbs!smart/controls/list/list.state/impl/list.state", "css!smart/controls/list/list.state/impl/list.state" ], function(_, $, CollectionStateView, theming, jatoIllustrations, lang, template) {
  const isJato = () => theming.isJATOTheme();
  var EmptyListView = CollectionStateView.extend({
    constructor: function EmptyListView(options = {}) {
      CollectionStateView.prototype.constructor.apply(this, arguments);
    },
    className: "cs-emptylist-container " + CollectionStateView.prototype.className,
    template: template,
    serializeData: function() {
      let data = CollectionStateView.prototype.serializeData.apply(this, arguments);
      let emptyListPlaceholderIcon = this.options.emptyJatoIllustration ?? jatoIllustrations.illustrationsGenericListSmall;
      const defaultText = this.options?.text || lang.emptyViewDefaultText;
      let text = data ? data.state === "loading" ? "" : data.message || defaultText : defaultText;
      let messages = {
        isJATOTheme: isJato(),
        text: text,
        emptyListPlaceholderIcon: emptyListPlaceholderIcon
      };
      return messages;
    }
  });
  return EmptyListView;
});