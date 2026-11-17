/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { css, html } from 'lit';
import { ElementBase } from '../element-base.js';

class OtcButtonGroup extends ElementBase {
  static get styles() {
    return [
      css`::slotted(otc-button:not(:first-child)){margin-left:1rem}::slotted(otc-button){margin-top:.5rem;margin-bottom:.5rem}.ot-btn-group{margin-block-end:1em;display:flex;flex-wrap:wrap;padding-block:0;padding-inline:.5rem}`,
    ];
  }

  render() {
    return html`<div role="group" class="ot-btn-group"><slot></slot></div>`;
  }
}

if (!customElements.get('otc-buttongroup')) {
  customElements.define('otc-buttongroup', OtcButtonGroup);
}

export { OtcButtonGroup };
//# sourceMappingURL=otcButtonGroup.js.map
