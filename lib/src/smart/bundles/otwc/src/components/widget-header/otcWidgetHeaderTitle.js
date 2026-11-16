/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { html } from 'lit';
import { OtcWidgetHeaderTitleBase } from './otcWidgetHeaderTitleBase.js';
import { getSVGForIcon } from '../../utilities/render-utilities.js';

/**
 * The Widget Header Title component is the most basic type of widget header title.  It contains the title text and title icon.
 * @prop {string} titleIcon A string containing the icon bundle and icon name, e.g. header:header_user42
 * @prop {string} titleIconAriaLabel The aria-label of the title icon.
 */
class OtcWidgetHeaderTitle extends OtcWidgetHeaderTitleBase {
  static get properties() {
    return {
      ...OtcWidgetHeaderTitleBase.properties,
      titleIcon: {
        type: String,
        reflect: true,
      },
      titleIconAriaLabel: {
        type: String,
        reflect: true,
      },
    };
  }

  constructor() {
    super();

    this.titleIcon = '';
    this.titleIconAriaLabel = '';
  }

  #getIconTemplate() {
    return getSVGForIcon(this.titleIcon, null, null, this.titleIconAriaLabel);
  }

  render() {
    return html`<span class="ot-widget-header-title"><span class="ot-widget-header-title__icon">${this.#getIconTemplate()}</span><h2 class="ot-widget-header-title__text">${this.titleText}</h2></span>`;
  }
}

customElements.define('otc-widget-header-title', OtcWidgetHeaderTitle);

export { OtcWidgetHeaderTitle };
//# sourceMappingURL=otcWidgetHeaderTitle.js.map
