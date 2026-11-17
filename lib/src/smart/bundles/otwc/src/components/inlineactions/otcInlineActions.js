/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { html } from 'lit';
import { ElementBase } from '../element-base.js';
import commonStyleSheet from '../../styles/common.scss.js';
import styleSheet from './otcInlineAction.scss.js';

/**
 * The Inline Actions component is used to create an inline actions menu.
 * Inline actions use progressive disclosure to offer access to just a few frequently used actions.
 * This technique exposes actions only when needed, and avoids cluttering the screen with options.
 * Inline actions are not available on touch-only devices since the inline action bar is triggered by a mouse over. Touch-only devices
 * will have a persistent approach (i.e. persistent actions within table toolbar or a persistent edit icon on a metadata form field).
 * @slot unnamed Defines the `otc-inline-action-items` contained in the inline actions menu.
 */
class OtcInlineActions extends ElementBase {
  static get styles() {
    return [
      commonStyleSheet,
      styleSheet,
    ];
  }

  render() {
    return html`<div class="ot-inline-actions"><div class="ot-inline-actions__list" role="list"><slot></slot></div></div>`;
  }
}

if (!customElements.get('otc-inline-actions')) {
  customElements.define('otc-inline-actions', OtcInlineActions);
}

export { OtcInlineActions };
//# sourceMappingURL=otcInlineActions.js.map
