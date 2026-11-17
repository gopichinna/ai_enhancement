import { css } from 'lit';

var selectStyles = css`:host([disabled]){--otc-input-disabled-cursor:default}:host([disabled]) .ot-select--combobox-wrapper{pointer-events:none}:host([disabled]) .ot-select--combobox-wrapper .ot-select--combobox-button otc-icon{--otc-icon-content-color-tertiary:var(
    --jato-cta-content-color-tertiary-disabled,#999
  )}:host([caretRightSpacingLarge]) .ot-select--combobox-wrapper .ot-select--combobox-input{--otc-input-padding-inline-end:40px}:host([caretRightSpacingLarge]) .ot-select--combobox-wrapper .ot-select--combobox-button{margin-inline-start:-32px}.ot-select--combobox-wrapper{display:flex;height:32px}.ot-select--combobox-wrapper .ot-select--combobox-input{--otc-input-padding-inline-end:32px;width:100%}.ot-select--combobox-wrapper .ot-select--combobox-button{align-self:center;background-color:transparent;border:none;cursor:pointer;height:16px;margin-inline-start:-24px;padding:0;width:16px;z-index:1000}.ot-select--combobox-wrapper .ot-select--combobox-button otc-icon{pointer-events:none;--otc-icon-content-color-tertiary:var(
    --jato-cta-content-color-tertiary,#333
  )}.ot-select--combobox-wrapper:has(~.ot-select--menu-wrapper otc-menu[isopen]) .ot-select--combobox-input{--otc-input-box-shadow:var(
    --jatx-const-transparent,#2e3d98
  );--otc-input-border-focus-neutral:var(
    --jato-input-border-focus-neutral,#2e3d98
  )}.ot-select--menu-wrapper{--jatx-otc-menu-border-radius:0 0 var(--jato-radii-lrg,0) var(--jato-radii-lrg,0);contain:layout;width:100%;z-index:1001}`;

export { selectStyles as default };
//# sourceMappingURL=otcSelect.scss.js.map
