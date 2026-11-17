import { css } from 'lit';

var menuCheckboxStyleSheet = css`.ot-dropdown__item .ot-checkbox{padding-block:0!important;--otc-checkbox-checked-text-font-weight:var(
    --jatx-otc-checkbox-group-checked-text-font-weight,var(--cfx-otc-checkbox-group-checked-text-font-weight,700)
  )}.ot-dropdown__item .ot-checkbox .ot-checkbox__wrapper{padding-block:var(--jatx-otc-menu-checkbox-wrapper-padding-block,1px)}.ot-dropdown__item .ot-checkbox .ot-checkbox__wrapper.ot-checkbox__text{font-size:var(--jatx-otc-menuitem-font-size,14px)!important;line-height:var(--jatx-otc-menuitem-line-height,20px)!important}:host([altStyle]) .ot-dropdown__item .ot-checkbox .ot-checkbox__wrapper .ot-checkbox__icon-container .ot-checkbox__icon--jato{background-color:transparent!important;border-color:transparent!important}:host([selectableStyle]) .ot-dropdown__item .ot-checkbox .ot-checkbox__wrapper .ot-checkbox__icon-container{display:var(--jatx-otc-menu-checkbox-icon-alt-display,flex)}:host([selectableStyle][checked]) .ot-dropdown__item{background-color:var(--jato-background-rows-selected,unset)}:host([disabled]) .ot-dropdown__item .ot-checkbox .ot-checkbox__wrapper .ot-checkbox__text{color:var(--jato-cta-content-color-primary-disabled,#999)}:host([disabled]) .ot-dropdown__item .ot-checkbox .ot-checkbox__wrapper .ot-checkbox__icon-container .ot-checkbox__icon--jato{background-color:var(--jato-control-background-primary-disabled);border-color:var(--jato-control-border-primary-disabled)}:host([disabled][checked]) .ot-dropdown__item .ot-checkbox .ot-checkbox__wrapper .ot-checkbox__icon-container .ot-checkbox__icon--jato{--jatx-otc-icon-content-color-primary:var(
    --jato-cta-content-color-primary-disabled,colors.get-color(gray-tint_3)
  )}`;

export { menuCheckboxStyleSheet as default };
//# sourceMappingURL=otcMenuCheckbox.scss.js.map
