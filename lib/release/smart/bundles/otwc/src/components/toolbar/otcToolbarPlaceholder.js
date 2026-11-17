import { html } from 'lit';
import { ElementBase } from '../element-base.js';
import { animatedMoreSVG } from '../../utilities/render-utilities.js';
import commonStyleSheet from '../../styles/common.scss.js';
import toolbarItemStyles from './otcToolbarItem.scss.js';
import placeholderStyles from './otcToolbarPlaceholder.scss.js';
import { ThemeController } from '../../controllers/themeController.js';
import { classMap as e } from '../../../node_modules/lit-html/directives/class-map.js';

/**
 * The toolbar placeholder item can be used inside otc-toolbar to display an animated three dot icon.
 * @prop {string} ariaLabel Defines the aria label associated with the toolbar placeholder item.
 * @prop {string} size The size of button. Possible values are `small, regular, large`. If not specified, the default is 'regular'.
 */
class OtcToolbarPlaceholder extends ElementBase {
  #themeController = new ThemeController(this);

  #overflowSlotName = 'otc-overflow-slot';

  #mutationObserver = new MutationObserver(this.#handleMutation.bind(this));

  static get styles() {
    return [
      commonStyleSheet,
      toolbarItemStyles,
      placeholderStyles,
    ];
  }

  static get properties() {
    const props = {
      ariaLabel: {
        type: String,
        reflect: true,
      },
      size: {
        type: String,
        reflect: true,
      },
    };
    return { ...ThemeController.properties, ...super.properties, ...props };
  }

  constructor() {
    super();

    this.ariaLabel = '';
    this.size = 'regular';
  }

  connectedCallback() {
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'none');
    }
    super.connectedCallback();
    // Observe changes to our `slot` attribute and child nodes.
    this.#mutationObserver.observe(this, { attributes: true, attributeFilter: ['slot'], childList: true });
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this.#mutationObserver.disconnect();
  }

  #handleMutation() {
    this.requestUpdate();
  }

  #getMenuItemTemplate() {
    return html`<otc-menuplaceholder simple></otc-menuplaceholder>`;
  }

  render() {
    // If we are in the toolbar overflow slot or are a child of another toolbar item, then we should render as a menu item.
    if (this.slot === this.#overflowSlotName) {
      return this.#getMenuItemTemplate();
    }

    const classes = {
      'otc-toolbar-placeholder': true,
      'otc-toolbar-placeholder--is-small': this.size === 'small',
      'otc-toolbar-placeholder--is-large': this.size === 'large',
    };

    let size = 32;
    if (!this._themeIsCarbonFiber) {
      switch (this.size) {
        case 'small':
          size = 24;
          break;
        case 'large':
          size = 40;
          break;
        default:
          size = 32;
      }
    }

    return html`<div class="${e(classes)}"><otc-icon size="${size}" arialabel="${this.ariaLabel}" type="secondary" disableEffects svg="${animatedMoreSVG}"></otc-icon></div>`;
  }
}

customElements.define('otc-toolbarplaceholder', OtcToolbarPlaceholder);

export { OtcToolbarPlaceholder };
//# sourceMappingURL=otcToolbarPlaceholder.js.map
