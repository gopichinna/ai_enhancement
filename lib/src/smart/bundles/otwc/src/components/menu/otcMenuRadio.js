/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { OtcMenuCheckbox } from './otcMenuCheckbox.js';

/**
 * The Menu Radio component represents a dropdown menu radio item.
 * It must be contained within an `otc-menugroup` component for proper radio functionality.
 * @prop {boolean} checked The state of the menu radio item.
 * @slot unnamed Defines the text of the menu radio item.
 */
class OtcMenuRadio extends OtcMenuCheckbox {
  updated(changedProperties) {
    super.updated(changedProperties);

    // If this item has just been checked, reset the checked property on all other items in the group.
    if (changedProperties.has('checked') && this.checked) {
      // Uncheck all other items in the group.
      this.#uncheckOtherItems();
    }
  }

  // Override the `otc-menucheckbox` handler.
  _handleClick() {
    if (!this.checked) {
      // Set this item to checked.
      this.checked = true;

      // Dispatch a change event with the current state of this item.
      this._dispatchChangeEvent(this.checked);
    } else {
      // The item is already checked.  By default, we do not want to uncheck an already checked radio item.  This follows the behavior of
      // native radio items.  Once a radio item is checked, you can only uncheck it by switching the checked state of another radio item in
      // the group.  You should not be able to uncheck all radio items in a group after you have selected one.
      //
      // However, this ability was requested (SVF-5745).  We have added a property called `allowDeselection` to `otc-menugroup`.  When this
      // property is enabled, we will allow deselection of previously selected radio items.
      const parentMenuGroup = this.#parentMenuGroup;
      if (parentMenuGroup?.allowDeselection) {
        this.checked = false;

        // Dispatch a change event with the current state of this item.
        this._dispatchChangeEvent(this.checked);
      }
    }
  }

  // Find the parent menu group and uncheck all of its child menu radio items, except for this one.
  #uncheckOtherItems() {
    const otherItems = Array.from(this.#parentMenuGroup?.children);
    otherItems.filter(child => ((child !== this) && (child.tagName === 'OTC-MENURADIO'))).forEach((item) => {
      item.updateComplete?.then(() => {
        item.checked = false;
      });
    });
  }

  get #parentMenuGroup() {
    return this.closest('otc-menugroup');
  }

  // Override the `otc-menucheckbox` render method.
  render() {
    return this._getItemTemplate(
      'menuradio-dropdownitem',
      'menuitemradio',
      'ot-radio',
      'menuradio-input',
      'radio',
      'ot-radio--readonly', // otc-menuradio always uses the 'alternate' style
      'ot-radio__wrapper',
      'ot-radio__icon',
      'ot-radio__text',
    );
  }
}

customElements.define('otc-menuradio', OtcMenuRadio);

export { OtcMenuRadio };
//# sourceMappingURL=otcMenuRadio.js.map
