import { OtcMenuCheckbox } from './otcMenuCheckbox.js';
import menuRadioStyles from './otcMenuRadio.scss.js';

/**
 * The Menu Radio component represents a dropdown menu radio item.
 * It must be contained within an `otc-menugroup` component for proper radio functionality.
 * @prop {boolean} checked The state of the menu radio item.
 * @slot unnamed Defines the text of the menu radio item.
 * @fires change Fired when the state of the radio has changed.
 * @fires input Fired when the state of the radio has changed.
 */
class OtcMenuRadio extends OtcMenuCheckbox {
  static get styles() {
    return [
      ...OtcMenuCheckbox.styles,
      menuRadioStyles,
    ];
  }

  constructor() {
    super();

    // The menu radio always uses alt-styling.
    this.altStyle = true;
  }

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('click', this.#handleClick, true);
    this.addEventListener('keydown', this.#handleKeydown, true);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this.removeEventListener('keydown', this.#handleKeydown, true);
    this.removeEventListener('click', this.#handleClick, true);
  }

  updated(changedProperties) {
    super.updated(changedProperties);

    // If this item has just been checked, reset the checked property on all other items in the group.
    if (changedProperties.has('checked') && this.checked) {
      // Uncheck all other items in the group.
      this.#uncheckOtherItems();
    }
  }

  #shouldAllowDeselection() {
    const parentMenuGroup = this.#parentMenuGroup;
    return parentMenuGroup && parentMenuGroup.allowDeselection;
  }

  #handleClick(event) {
    // If our menu group does not allow deselection, stop the event from propagating to the base class where it would be unchecked.
    if (this.checked && !this.#shouldAllowDeselection()) {
      event.stopPropagation();
    }
  }

  #handleKeydown(event) {
    switch (event.key) {
      case 'Enter':
      case 'Spacebar':
      case ' ':
        // If our menu group does not allow deselection, stop the event from propagating to the base class where it would be unchecked.
        if (this.checked && !this.#shouldAllowDeselection()) {
          event.stopPropagation();
        }
        break;

      // no default
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
    return this._getItemTemplate('menuitemradio', 'radio');
  }
}

customElements.define('otc-menuradio', OtcMenuRadio);

export { OtcMenuRadio };
//# sourceMappingURL=otcMenuRadio.js.map
