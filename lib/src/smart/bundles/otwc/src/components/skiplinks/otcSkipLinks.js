/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { html } from 'lit';
import { ElementBase } from '../element-base.js';
import commonStyleSheet from '../../styles/common.scss.js';

/**
 * The Skip Links component is a text element used for keyboard based navigation. Skip links only appear when tabbed to, they are not
 * intended for mouse users. They usually are added to a page to be the first tab stop and thus offer functionalities such as "Skip to
 * content" or access to "a11y user settings".
 * The targets of the skip links would be sections such as the main tag or active elements. Some browsers require a tabindex=-1 value
 * on non-interactive elements such as the main tag or some div to properly move focus along. Also the focused elements should show the
 * skipped-to focus so the movement is clear to the end user.
 * @slot unnamed Defines the `otc-link` elements that are contained in the group.
 */
class OtcSkipLinks extends ElementBase {
  static get styles() {
    return [
      commonStyleSheet,
    ];
  }

  render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get('otc-skiplinks')) {
  customElements.define('otc-skiplinks', OtcSkipLinks);
}

export { OtcSkipLinks };
//# sourceMappingURL=otcSkipLinks.js.map
