import { html } from 'lit';
import { OTC_ICON_BUNDLE_WC_UTILITY } from '../../utilities/render-utilities.js';
import { Console } from '../../utilities/logging-utilities.js';
import { isChild } from '../../utilities/common-utilities.js';
import { RTLController } from '../../controllers/rtlController.js';
import { SearchBase, formfieldCloseIcon, formfieldSearchIcon } from '../search-base.js';
import commonStyleSheet from '../../styles/common.scss.js';
import '../../../lib/otc-icons/icons_otc-action.js';
import '../../../lib/otc-icons/icons_otc-utility.js';
import { classMap as e } from '../../../node_modules/lit-html/directives/class-map.js';
import { ref as n } from '../../../node_modules/lit-html/directives/ref.js';
import { ifDefined as o } from '../../../node_modules/lit-html/directives/if-defined.js';

const TYPE_SEARCH_PERSISTENT_PREFIX = 'persist-';

const alwaysOpenSearchIcon = `${OTC_ICON_BUNDLE_WC_UTILITY}:utility_search12`;

/**
 * The Search Persistent component is a sub-component of the Header Bar.
 * It offers n always open search input field including search options. It is placed inside the global Header Bar or a
 * surrounding `flex`-container.  It offers the functionality to specify a search term, including selecting the offered search options.
 * @slot unnamed Defines further content of the Header Bar.
 */
class OtcSearchPersistent extends SearchBase {
  #rtlController = new RTLController(this);

  static get styles() {
    return [
      commonStyleSheet,
      SearchBase._searchBaseStyles,
    ];
  }

  static get properties() {
    const props = {
      inputFieldTransparent: { type: Boolean, reflect: true },

      _inputPlaceholderText: { state: true },
    };

    return { ...SearchBase._searchBaseProperties, ...props };
  }

  constructor() {
    super();

    this._isAlwaysOpen = true;

    this._boundOutsideClickHandler = this._handleOutsideClick.bind(this);
    this._boundClickAlwaysOpenHandler = this._clickAlwaysOpenHandler.bind(this);

    this.inputFieldTransparent = false;
    this._size = this._getInternalSizeIdentifier(this.size);

    this._hideSearchButton = true;
    this._inputPlaceholderText = this.labelText;
  }

  _getInternalSizeIdentifier(siz) {
    return TYPE_SEARCH_PERSISTENT_PREFIX + siz;
  }

  // closes menu and sets searchfield not active
  _clickCloseSearch() {
    // show icon and set searchfield not active
    this._updateAlwaysOpenField(false);
    // close menu immediately (so that it is not part of searchfield animation)
    this._updateMenuOpenState(false);
    // remove focus from element
    this.blur();
  }

  /**
   * Updates the alwaysOpen search field to the given state.
   * @param {Boolean} isActive - if persistent search field is currently in active state
   */
  _updateAlwaysOpenField(isActive) {
    Console.log(`otcSearchPersistent: _updateAlwaysOpenField: Entering with isActive '${isActive}'`);
    if (!this._isAlwaysOpen) {
      Console.log('otcSearchPersistent: _updateAlwaysOpenField: The Search Field is not used in "persistent" mode.');
      return;
    }
    const inputContainer = this._searchInputContainer;
    const loupeElem = inputContainer.querySelector(`.ot-search__close-button-container-${this._size}.ot-search--is-persistent`);
    const searchTermInput = this._searchTermInput;
    const inputQueryContainer = inputContainer.querySelector(`.ot-search__input-field-query-container-${this._size}`);
    if (isActive) {
      // remove listener for alwaysOpen mode on whole searchfield container,
      // the events are handled/triggered by the "normal" input field
      inputContainer.removeEventListener('click', this._boundClickAlwaysOpenHandler);

      Console.log('otcSearchPersistent: Setting is-active state for input field');
      this._isActive = true;
      this._inputPlaceholderText = this.searchPlaceholder;

      // hide loupe
      inputQueryContainer.classList.remove('ot-search--has-decorative-icon');
      loupeElem.classList.add('ot--is-hidden');
    } else {
      // add listener for alwaysOpen mode on whole searchfield container
      inputContainer.addEventListener('click', this._boundClickAlwaysOpenHandler);

      Console.log('otcSearchPersistent: Removing is-active state for input field');
      this._isActive = false;
      this._inputPlaceholderText = this.labelText;

      const text = ''.concat(searchTermInput.value);
      if (text.trim() === '') {
        // show loupe and set decorative icon present
        inputQueryContainer.classList.add('ot-search--has-decorative-icon');
        loupeElem.classList.remove('ot--is-hidden');
      }
    }
  }

  _handleOutsideClick(event) {
    const outsideClick = typeof event.composedPath === 'function' && !event.composedPath().includes(this);
    if (outsideClick && this._isActive) {
      Console.log('otcSearchPersistent: Detected outsideClick...');
      const qStr = this._getTextFromInputField();
      if (qStr.length > 0) {
        // the menu may be already closed by focusout at this place
        if (this._expandedMenu) {
          // just close the menu
          this._closeOptionsMenu();
        }
      } else {
        // close the menu
        this._closeOptionsMenu();
        // set not active
        this._updateAlwaysOpenField(false);
      }
    }
  }

  connectedCallback() {
    super.connectedCallback();
    Console.log(`otcSearchPersistent: connectedCallback called... (initialRun: ${this._initialRun}, expanded: ${this.expanded})`);
    // ensure initial value matches the expanded state
    this._doHideSearchfieldBox = !this.expanded;
    // When click is outside of the searchfield component, then close the menu/search field.
    document.addEventListener('click', this._boundOutsideClickHandler);
  }

  disconnectedCallback() {
    document.removeEventListener('click', this._boundOutsideClickHandler);
  }

  // this is called after render
  _setInitialStates() {
    let menuOpen = false;
    const menuElements = this._rootMenuItems;
    Console.log(`otcSearchSlidein: _setInitialStates: expanded: ${this.expanded}, initialRun: ${this._initialRun}`);

    // alwaysOpen implies expanded
    if (this._isAlwaysOpen) {
      this.expanded = true;
      // ensure menu is closed (force close)
      // We only modify _expandedMenu directly here instead of using _setExpandedMenuState() function,
      // because it forces the _closeOptionsMenu() to close the menu. The _setExpandedMenuState() function
      // is called quite at the end of this function.
      this._expandedMenu = true;
      this._closeOptionsMenu();
      Console.log(`otcSearchSlidein: _setInitialStates: alwaysOpen is true, using expanded: ${this.expanded}`);
    }

    menuElements.every((element) => {
      if (element.isOpen) {
        menuOpen = true;
        return false;
      }
      return true;
    });
    // init props
    this._setExpandedMenuState(menuOpen);
    Console.log(`otcSearchSlidein: _setInitialStates: searchOptions menu is ${this._expandedMenu ? 'open'
      : 'NOT open'} (expanded: ${this.expanded}), found in summary ${menuElements.length} root menu items.`);
  }

  willUpdate(changedProperties) {
    if (changedProperties.has('size')) {
      this._size = this._getInternalSizeIdentifier(this.size);
    }
  }

  updated(changedProperties) {
    super.updated(changedProperties);
    if (changedProperties.has('noautoclose')) {
      if (this.noautoclose === false) {
        this.addEventListener('focusout', this._handleSearchfieldFocusOut);
      } else {
        this.removeEventListener('focusout', this._handleSearchfieldFocusOut);
      }
    }
  }

  /**
   * After the DOM has been updated the first time (after render)
   *
   * @param changedProperties
   */
  firstUpdated(changedProperties) {
    super.firstUpdated(changedProperties);

    // set initial states
    this._setInitialStates();
    const text = this._getTextFromInputField();
    this._toggleHideFormfields(text === '');
    this._updateAlwaysOpenField(text !== '');

    // add listener to display/hide formfields
    const searchTermInput = this._searchTermInput;
    if (searchTermInput) {
      searchTermInput.addEventListener('input', (event) => {
        Console.log('otcSearchPersistent: searchInputField: input event: updateFormfields.');
        const hasText = (event.target.value !== '');
        if (hasText) {
          this._toggleHideFormfields(false);
        } else {
          this._toggleHideFormfields(true);
        }
        // open menu (if you change input the menu should open)
        this._toggleMenu(true);
        // the 'input' event should bubble
      });

      // add eventlistener for keydown (Enter-key only) for the input-field
      searchTermInput.addEventListener('keydown', (event) => {
        Console.log('otcSearchPersistent: keydown event: in input field');
        if (event.key === 'Enter' && this.expanded) {
          Console.log('otcSearchPersistent: keydown event: detected "Enter", submitting search.');
          event.preventDefault();
          this._clickStartSearchButton();
        }
      });

      searchTermInput.addEventListener('click', () => {
        Console.log('otcSearchPersistent: input field: got "click" event, opening menu.');
        // open menu, user clicked into search  field
        this._toggleMenu(true);
      });
    }

    // add listener to open menu when input field gets focus
    this.addEventListener('keyup', (event) => {
      // handles Tab and shift-Tab
      if (event.key === 'Tab') {
        Console.log('otcSearchPersistent: inputFields: got "Tab"');
        if (searchTermInput && searchTermInput.matches(':focus')) {
          Console.log('otcSearchPersistent: inputFields: detected "focus" by "Tab" key, setting active and opening menu.');
          this._updateAlwaysOpenField(true);

          this._toggleMenu(true);
        }
      }
    });

    // when noautoclose flag is gone, add the listener always
    // this.addEventListener('focusout', this._handleSearchfieldFocusOut);

    // add listeners to handle focus for menu
    this._initMenuSurrogate();

    // Handle some key events. When Enter key is pressed, then execute the search request.
    this.addEventListener('keydown', (event) => {
      Console.log(`otcSearchPersistent: keydown event: in general "this" listener: key="${event.key}"`);
      switch (event.key) {
        case 'Escape':
        case 'Esc': {
          // close menu
          this._clickCloseSearch();
          event.preventDefault();
          break;
        }
        case 'Tab':
          if (this._expandedMenu) {
            // enable surrogate focus redirect
            this._focusinActive = true;
          }
          break;
        case 'Enter':
        case ' ': {
          // selecting most menuitems will close the menu,
          // so update the menu state
          const menuOpen = this._menuGetCurrentOpenState();
          if (this._expandedMenu !== menuOpen) {
            this._expandedMenu = menuOpen;
            this._menuSetCurrentOpenState(this._expandedMenu);
          }
          break;
        }
      }
    });

    this.updateComplete.then(() => {
      // enable animations
      this._initialRun = false;
    });
  }

  _clickAlwaysOpenHandler() {
    Console.log('otcSearchPersistent: _clickAlwaysOpenHandler: clicked');

    this._updateAlwaysOpenField(true);

    // input field should get focus
    this._toggleMenu(true);

    Console.log('otcSearchPersistent: _clickAlwaysOpenHandler: retriggering click');
    this._retriggerClick();
    Console.log('otcSearchPersistent: _clickAlwaysOpenHandler: finished clicked handler');
  }

  _handleSearchfieldFocusOut(event) {
    Console.log('otcSearchPersistent: handling "focusout" event.');
    Console.log('otcSearchPersistent: checking if "relatedTarget" is part of search field.');
    if (!event.relatedTarget || !isChild(this, event.relatedTarget)) {
      Console.log('otcSearchPersistent: closing based on "focusout" event the menu');
      this._updateMenuOpenState(false);
      // set inactive
      this._updateAlwaysOpenField(false);
    }
  }

  // sets the field to active; the element must be focusable so this handler is used in the
  // "Start Search" button which is the rightmost input element of the search field
  _handleGetFocus() {
    Console.log('otcSearchPersistent: setting active based on "focus" event');
    // set active
    this._updateAlwaysOpenField(true);
  }

  _getFieldButtonsIconsAppearance() {
    if (this._isAlwaysOpen && this.inputFieldTransparent) {
      if (this._isActive) {
        // searchfield has a white background when active
        return 'dark';
      }
      return 'light';
    }
    return 'dark';
  }

  _onFocus() {
    // if has focus replace the labelText by searchPlaceholder
    this._inputPlaceholderText = this.searchPlaceholder;
  }

  _onBlur(event) {
    // change the text only if we leave the whole input area
    if (!event.relatedTarget || !isChild(this, event.relatedTarget)) {
      // if focus lost show labelText again
      this._inputPlaceholderText = this.labelText;
    }
  }

  render() {
    const classesSearchRoot = {
      'ot-search': true,
      'ot-search--is-right': this.#rtlController.isRTL,
      'ot-search--is-measure': this.measure,
    };

    const classesSearchBox = {
      'ot-search__box': true,
      'ot--is-header-item': this.headerItem,
    };

    const classesPersistentState = {
      'ot-search--is-persistent': true,
      'ot-search--is-active': this._isActive,
      'ot-search--is-transparent': this.inputFieldTransparent,
      'ot-search--is-semitransparent': !this.inputFieldTransparent,
    };

    const classesMenuContainer = {
      [`ot-search__menu-container-${this._size}`]: true,
      ...classesPersistentState,
    };

    const classesInputFieldQueryContainer = {
      [`ot-search__input-field-query-container-${this._size}`]: true,
      ...classesPersistentState,
    };

    const classesSearchtermField = {
      'ot-search__searchterm-field': true,
      'ot-search--placeholder-fade-in': this.expanded,
    };

    return html`<div class="${e(classesSearchRoot)}" ?expanded="${this.expanded}"><div class="ot-search__container"><div ${n(this._partRefs.searchBox)} class="${e(classesSearchBox)}" role="dialog" aria-label="${this.ariaLabelSearchBox}"><div class="ot-search__box-content"><div class="ot-search__menu-wrapper"><p class="ot--is-hidden" id="ot-search-aria-input-hint-id">${this.ariaLabelInputDescription}</p><div class="ot-search__menu-container-parent-${this._size}"><div class="${e(classesMenuContainer)}"><div class="ot-search__input-container" ${n(this._partRefs.searchInputContainer)}><div class="ot-search--is-persistent ot-search__close-button-container-${this._size}"><otc-icon class="ot-search__decorative-icon-${this._size}" ariaLabel="${o(this._getAriaSearchButtonOpen())}" title="${this.tooltipSearchButtonOpen}" icon="${alwaysOpenSearchIcon}" iconAppearance="${this.inputFieldTransparent ? 'light' : 'dark'}" disableEffects></otc-icon></div><div class="ot-search--is-persistent ot-search__input-field-${this._size}"><div class="${e(classesInputFieldQueryContainer)}"><div class="ot-search__searchterm-label-container"><input ${n(this._partRefs.searchTermInput)} class="${e(classesSearchtermField)}" id="ot-search-input-id" .value="${this.value}" type="search" autocomplete="off" placeholder="${this._inputPlaceholderText}" @change="${this._onChange}" @input="${this._onInput}" @focus="${this._onFocus}" @blur="${this._onBlur}" aria-label="${o(this.ariaLabelInputField)}" aria-describedby="ot-search-aria-input-hint-id"></div></div><div tabindex="-1" class="ot-search__menu-surrogate" ${n(this._partRefs.searchMenuSurrogate)}></div><div class="ot-search__input-field-actions-${this._size}"><otc-button class="ot-search__clear-button-${this._size} ot-search--is-search-icon" icononly arialabel="${this.ariaLabelClearKeywords}" title="${this.tooltipClearKeywords}" icon="${formfieldCloseIcon}" @click="${this._clickFormfieldClear}" iconAppearance="${this._getFieldButtonsIconsAppearance()}"></otc-button><otc-button class="ot-search__startsearch-button" icononly emphasis arialabel="${this.ariaLabelStartSearch}" title="${this.tooltipStartSearch}" icon="${formfieldSearchIcon}" @click="${this._clickFormfieldSearch}" @focus="${this._handleGetFocus}" iconAppearance="${this._getFieldButtonsIconsAppearance()}"></otc-button></div></div></div></div></div><div tabindex="-1" class="ot-search__options-dropdown"><slot ${n(this._partRefs.searchOptionsDropdownSlot)} @slotchange="${this._handleSearchOptionsDropdownSlotChange}"></slot></div></div></div></div></div></div>`;
  }
}

customElements.define('otc-search-persistent', OtcSearchPersistent);

export { OtcSearchPersistent };
//# sourceMappingURL=otcSearchPersistent.js.map
