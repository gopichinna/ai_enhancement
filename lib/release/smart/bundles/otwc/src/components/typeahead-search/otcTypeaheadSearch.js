import { LitElement, html } from 'lit';
import { actionSearch } from '../../../node_modules/@jato/svgs/dist/index.esm.js';
import { OTC_ICON_BUNDLE_WC_ACTION } from '../../utilities/render-utilities.js';
import commonStyleSheet from '../../styles/common.scss.js';
import iconStyleSheet from '../../styles/icons.scss.js';
import typeaheadSearchStyleSheet from './otcTypeaheadSearch.scss.js';
import { ElementBase } from '../element-base.js';
import { ThemeController } from '../../controllers/themeController.js';
import { Console } from '../../utilities/logging-utilities.js';
import '../../../lib/otc-icons/icons_otc-action.js';
import { createRef as e, ref as n } from '../../../node_modules/lit-html/directives/ref.js';
import { classMap as e$1 } from '../../../node_modules/lit-html/directives/class-map.js';

/**
 * The Typeahead Search component provides a button to open a provided `otc-input` element of type `search` and allows the user to enter
 * and edit text values for searching or filtering.
 * @prop {string} ariaLabel The `aria-label` of the typeahead search open button.
 * @prop {boolean} disabled The disabled state of the typeahead search field.
 * @prop {string} iconSearch For **CarbonFiber** theme: It's a string containing the icon bundle and icon name,
 * e.g. `action:action_preview32`.<br><br> For **JATO** theme: It's a string containing the SVG markup of the icon.
 * @prop {boolean} isOpen The state, if the typeahead search field is opened or not.
 * @prop {string} searchButtonSize To let the search button being displayed in a different size, use this property with one of the
 * values `small`, `regular` or `large`. If not set, the default is `regular`.<br>Only supported with **JATO** theme. For **CF** you
 * should use a different icon `iconSearch` with your preferred size.
 * @prop {string} title The `tooltip` of the typeahead search open button.
 * @cssprop [--otc-typeahead-search-justify=flex-start] The justification of the typeahead search field in the flex container.
 * @fires action-icon-clicked **DEPRECATED:** Fired when the action icon button is clicked.
 * @fires actionIconClicked Fired when the action icon button is clicked.
 * @fires change Fired when the input operation has finished by pressing Enter or on focusout.
 * @fires close Fired when the typeahead search field is fully closed.
 * @fires closing Fired when the close input search field button is clicked.
 * @fires input Fired when the value of the input changes at each keystroke and when a suggestion item has been selected.
 * @fires open Fired when the typeahead search field is fully opened.
 * @fires opening Fired when the open typeahead search field button is clicked.
 * @fires value-changed **DEPRECATED:** Fired every time value of the input has changed, including programmatically.
 * @fires valueChanged Fired every time value of the input has changed, including programmatically.
 * @slot unnamed Default slot which should contain the `otc-input` of type `search` to use.
 */
class OtcTypeaheadSearch extends ElementBase {
  #themeController = new ThemeController(this);

  #boundButtonClickHandler = this._handleButtonClick.bind(this);

  #boundCloseEventHandler = this._handleCloseEvent.bind(this);

  #boundKeydownEventHandler = this._handleKeydownEvent.bind(this);

  // Used internally to access elements in the shadow root.
  #partRefs = {
    defaultSlot: e(),
  };

  static get shadowRootOptions() {
    return {
      ...LitElement.shadowRootOptions,
      // If the user clicks somewhere to the shadow DOM, focus the inner
      // interactive element and enable CSS pseudo-classes detecting the focused
      // state on the host element too.
      delegatesFocus: true,
    };
  }

  static get styles() {
    return [
      commonStyleSheet,
      iconStyleSheet,
      typeaheadSearchStyleSheet,
    ];
  }

  static get properties() {
    const props = {
      ariaLabel: { type: String, reflect: true },
      disabled: { type: Boolean, reflect: true },
      iconSearch: { type: String, reflect: true },
      isOpen: { type: Boolean, reflect: true },
      searchButtonSize: { type: String, reflect: true },
      title: { type: String, reflect: true },
    };

    return { ...ThemeController.properties, ...props };
  }

  constructor() {
    super();

    this.ariaLabel = '';
    this.disabled = false;
    this.iconSearch = '';
    this.isOpen = false;
    this.searchButtonSize = 'regular';
    this.title = '';

    // not reflected variables
    this._showOpenButton = !this.isOpen;
  }

  /**
   * @returns The otc-input field.
   */
  get inputField() {
    return this.querySelector('otc-input');
  }

  /**
   * @returns The open typeahead search button. Only used to set focus.
   */
  get openSearchButton() {
    return this.shadowRoot?.querySelector('otc-button');
  }

  /**
   * @returns The input field from the shadowDOM of the otc-input field. Only used to set focus.
   */
  get innerInputField() {
    return this.inputField?.shadowRoot.querySelector('input[type="search"]');
  }

  connectedCallback() {
    super.connectedCallback();

    // Add a click handler so that we can listen for the escape key to close the search field.
    this.addEventListener('keydown', this.#boundKeydownEventHandler);
    this.addEventListener('close', this.#boundCloseEventHandler);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    // Remove any handlers that were added in connectedCallback().
    this.removeEventListener('keydown', this.#boundKeydownEventHandler);
    this.removeEventListener('close', this.#boundCloseEventHandler);
  }

  get #defaultSlotElements() {
    return this.#partRefs.defaultSlot.value?.assignedElements({ flatten: true });
  }

  get #inputField() {
    // alternative: return this.querySelector('otc-input[type="search"]');
    return this.#defaultSlotElements.find(el => el.tagName === 'OTC-INPUT');
  }

  _handleCloseEvent() {
    this._showOpenButton = true;
    this.requestUpdate(); // reflect the above change
  }

  _handleButtonClick(event) {
    // If the typeahead search is disabled, then ignore the event and stop it from propagating.
    if (this.disabled) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    if (!this.isOpen) {
      // just send an 'opening' event to signal that isOpen can be set to true
      const openingEvent = new CustomEvent('opening', { bubbles: true, composed: true });
      this.dispatchEvent(openingEvent);
      // open the input field, this can be done directly here or better let the implementor do it
      // to behave identical to closing
    }
  }

  _handleCloseInput(event) {
    // If the typeahead search is disabled, then ignore the event and stop it from propagating.
    if (this.disabled) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    if (!this.isOpen) {
      return;
    }
    const inputEl = this.#inputField;
    if (inputEl) {
      // just inform about a requested close by pressing close button on input field or by sending an explicit
      // 'closing' event yourself
      const closeButton = inputEl.shadowRoot.querySelector('otc-button.ot-input-search__close-icon');
      closeButton?.click();
    }
  }

  _handleKeydownEvent(event) {
    if (this.disabled) {
      return;
    }
    switch (event.key) {
      case 'Escape':
      case 'Esc':
        if (!this.disabled && this.isOpen) {
          // check phase of ESC handling
          const inputEl = this.#inputField;
          if (inputEl) {
            if (inputEl.value !== '') ; else {
              event.preventDefault();
              // Initiate to close the search
              this._handleCloseInput(event);
            }
          }
        }
        break;

      // no default
    }
  }

  #isOldTypeaheadSearch() {
    return this._themeIsCarbonFiber;
  }

  willUpdate(changedProperties) {
    // do also for very first update
    if (changedProperties.has('isOpen') && changedProperties.get('isOpen') !== this.isOpen) {
      // show the input field early, so that the animations can be assigned in subsequent rendering
      if (this.isOpen) this._showOpenButton = false;
    }
  }

  async updated(changedProperties) {
    super.updated(changedProperties);

    if (changedProperties.has('isOpen') && changedProperties.get('isOpen') !== this.isOpen) {
      // propagate the 'isOpen' state to the input search field
      const inputEl = this.#inputField;
      if (inputEl) {
        if (inputEl.isOpen !== this.isOpen) { // the isOpen comparison here is important
          Console.log('otcTypeaheadSearch: updated: setting inputEl.isOpen to: ', this.isOpen);
          await inputEl.updateComplete;
          inputEl.isOpen = this.isOpen;
        }
      }
    }
  }

  render() {
    const typeaheadSearchClasses = {
      'otc-typeahead-search__slidein': true,
      'otc-filter--is-active': this.isOpen,
    };
    const typeaheadSearchOpenButtonClasses = {
      'otc-typeahead-search__slidein-search-button': true,
      'ot--is-hidden': !this._showOpenButton,
    };
    // do not style the slot, but just hide/show it
    const defaultSlotClasses = {
      'ot--is-hidden': this._showOpenButton,
    };

    if (this.#isOldTypeaheadSearch()) {
      // Carbonfiber
      const icon = this.iconSearch ? this.iconSearch : `${OTC_ICON_BUNDLE_WC_ACTION}:action_search32`;
      return html`<div class="${e$1(typeaheadSearchClasses)}" role="none"><otc-button class="${e$1(typeaheadSearchOpenButtonClasses)}" ?disabled="${this.disabled}" id="otc-typeahead-search-open-button-id" ariaLabel="${this.ariaLabel}" title="${this.title}" @click="${e => this.#boundButtonClickHandler(e)}" icon="${icon}"></otc-button><slot ${n(this.#partRefs.defaultSlot)} class="${e$1(defaultSlotClasses)}"></slot></div>`;
    }
    // Jato
    const searchIcon = this.iconSearch ? this.iconSearch : actionSearch;
    return html`<div class="${e$1(typeaheadSearchClasses)}" role="none"><otc-button class="${e$1(typeaheadSearchOpenButtonClasses)}" ?disabled="${this.disabled}" id="otc-typeahead-search-open-button-id" ariaLabel="${this.ariaLabel}" size="${this.searchButtonSize}" title="${this.title}" @click="${e => this.#boundButtonClickHandler(e)}" type="subtle"><otc-icon svg="${searchIcon}"></otc-icon></otc-button><slot ${n(this.#partRefs.defaultSlot)} class="${e$1(defaultSlotClasses)}"></slot></div>`;
  }
}

customElements.define('otc-typeahead-search', OtcTypeaheadSearch);

export { OtcTypeaheadSearch };
//# sourceMappingURL=otcTypeaheadSearch.js.map
