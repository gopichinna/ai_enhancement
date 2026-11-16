import { css, html } from 'lit';
import commonStyleSheet from '../../styles/common.scss.js';
import { ElementBase } from '../element-base.js';

/**
 * The User Card component is used to display user information.
 * @slot unnamed The user information.
 */
class OtcUserCard extends ElementBase {
  static get styles() {
    return [
      commonStyleSheet,
      css`:host{width:100%}`,
    ];
  }

  render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get('otc-usercard')) {
  customElements.define('otc-usercard', OtcUserCard);
}

export { OtcUserCard };
//# sourceMappingURL=otcUserCard.js.map
