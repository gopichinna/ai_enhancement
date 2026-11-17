/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { html } from 'lit';
import { OtcWidgetHeaderTitleBase } from './otcWidgetHeaderTitleBase.js';

/**
 * The Widget Header Search Title is a widget header title for use above search results.  It contains the title text, an emphasizes search
 * term, and a subtitle.
 * @prop {string} searchTermText Defines the emphasized text displayed after the title text.
 * @prop {string} subtitleText Defines the text displayed underneath the title text.
 */
class OtcWidgetHeaderSearchTitle extends OtcWidgetHeaderTitleBase {
  static get properties() {
    return {
      ...OtcWidgetHeaderTitleBase.properties,
      searchTermText: {
        type: String,
        reflect: true,
      },
      subtitleText: {
        type: String,
        reflect: true,
      },
    };
  }

  constructor() {
    super();

    this.searchTermText = '';
    this.subtitleText = '';
  }

  render() {
    return html`<span class="ot-widget-header-search-title"><span class="ot-widget-header-search-title__title-wrapper"><h2 class="ot-widget-header-title__text">${this.titleText} <span class="ot-widget-header-search-title__search-term">${this.searchTermText}</span></h2></span><span class="ot-widget-header-search-title__subtitle">${this.subtitleText}</span></span>`;
  }
}

customElements.define('otc-widget-header-search-title', OtcWidgetHeaderSearchTitle);

export { OtcWidgetHeaderSearchTitle };
//# sourceMappingURL=otcWidgetHeaderSearchTitle.js.map
