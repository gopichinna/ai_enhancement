/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { css } from 'lit';

var toolbarItemStyles = css`:host{align-items:center;display:flex}:host([disabled]){pointer-events:none}.ot-toolbar-item-wrapper{align-items:center;display:flex}.ot-toolbar-item-wrapper otc-button:hover{--ot-badge-color:var(
    --jato-tabs-navigation-content-color-counter-text-color-hover
  );--ot-badge-background-color:var(
    --jato-tabs-navigation-content-color-counter-background-color-hover
  )}.ot-toolbar-item-wrapper otc-button:active{--ot-badge-color:var(
    --jato-tabs-navigation-content-color-counter-text-color-active
  );--ot-badge-background-color:var(
    --jato-tabs-navigation-content-color-counter-background-color-active
  )}:host(:hover) otc-button{--jatx-otc-icon-content-color-primary:var(
    --jatx-otc-icon-content-color-primary-hover
  );--jatx-otc-icon-content-color-secondary-neutral:var(
    --jatx-otc-icon-content-color-secondary-hover
  );--jatx-otc-icon-content-color-tertiary:var(
    --jatx-otc-icon-content-color-tertiary-hover
  )}:host(:active) otc-button,:host(:hover:active) otc-button{--jatx-otc-icon-content-color-primary:var(
    --jatx-otc-icon-content-color-primary
  );--jatx-otc-icon-content-color-secondary-neutral:var(
    --jatx-otc-icon-content-color-secondary-active
  )}`;

export { toolbarItemStyles as default };
//# sourceMappingURL=otcToolbarItem.scss.js.map
