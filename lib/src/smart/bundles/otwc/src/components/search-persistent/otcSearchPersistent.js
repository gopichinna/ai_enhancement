/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { html } from 'lit';
import { actionSearch, actionCloseSmall } from '../../../node_modules/@jato/svgs/dist/index.esm.js';
import { OTC_ICON_BUNDLE_WC_UTILITY } from '../../utilities/render-utilities.js';
import { Console } from '../../utilities/logging-utilities.js';
import { RTLController } from '../../controllers/rtlController.js';
import { SearchBase, formfieldCloseIcon, formfieldSearchIcon } from '../search-base.js';
import { ThemeController } from '../../controllers/themeController.js';
import { FocusUtilities } from '../../utilities/focus-utilities.js';
import commonStyleSheet from '../../styles/common.scss.js';
import '../../../lib/otc-icons/icons_otc-action.js';
import '../../../lib/otc-icons/icons_otc-utility.js';
import { ifDefined as o } from '../../../node_modules/lit-html/directives/if-defined.js';
import { classMap as e } from '../../../node_modules/lit-html/directives/class-map.js';
import { ref as n } from '../../../node_modules/lit-html/directives/ref.js';

const TYPE_SEARCH_PERSISTENT_PREFIX = 'persist-';

const alwaysOpenSearchIcon = `${OTC_ICON_BUNDLE_WC_UTILITY}:utility_search12`;

/**
 * The Search Persistent component provides an always open search field. Usually it is used in the Header Bar.
 * The always open search input field can have optional search options. It is placed inside the global Header Bar or a
 * surrounding `flex`-container.  It offers the functionality to specify a search term, including selecting the offered search options.
 * @slot unnamed Defines further content of the Header Bar.
 */
class OtcSearchPersistent extends SearchBase {
  #rtlController = new RTLController(this);

  #themeController = new ThemeController(this);

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

    return { ...ThemeController.properties, ...SearchBase._searchBaseProperties, ...props };
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

    // without this listener a click onto a saved query (= link) does not set the SF to non-active;
    // in case of outside click, the focusout event occurs before the click event is handled
    this.addEventListener('focusout', this._onContainerFocusout);
  }

  _getInternalSizeIdentifier(siz) {
    return TYPE_SEARCH_PERSISTENT_PREFIX + siz;
  }

  // closes menu and sets searchfield not active
  _clickCloseSearch() {
    // show icon and set searchfield not active
    this._updateSpecificSearchField(false);
    // close menu immediately (so that it is not part of searchfield animation)
    this._updateMenuOpenState(false);

    // remove focus from element
    let nextElement = this.nextElementSibling;
    if (nextElement) {
      // find next possible element
      while (!!nextElement && FocusUtilities.isHidden(nextElement)) {
        if (nextElement.nextElementSibling) {
          nextElement = nextElement.nextElementSibling;
        }
      }
      // move focus ideally to next sibling
      if (nextElement) {
        FocusUtilities.focusElement(nextElement, this);
      } else {
        this.blur();
      }
    }
  }

  /**
   * Updates the alwaysOpen search field to the given state.
   * @param {Boolean} isActive - if persistent search field is currently in active state
   */
  _updateSpecificSearchField(isActive) {
    if (!this._isAlwaysOpen) {
      return;
    }
    const inputContainer = this._searchInputContainer;
    if (isActive) {
      // remove listener for alwaysOpen mode on whole searchfield container,
      // the events are handled/triggered by the "normal" input field
      inputContainer.removeEventListener('click', this._boundClickAlwaysOpenHandler);
      // the _isActive flag is evaluated in render; it is also modified in _resetIsActive
      this._isActive = true;
      this._inputPlaceholderText = this.searchPlaceholder;
      this._selfIsFocused = true;
    } else {
      // add listener for alwaysOpen mode on whole searchfield container
      inputContainer.addEventListener('click', this._boundClickAlwaysOpenHandler);
      this._isActive = false;
      this._inputPlaceholderText = this.labelText;
      this._selfIsFocused = false;
    }
  }

  _handleOutsideClick(event) {
    const outsideClick = typeof event.composedPath === 'function' && !event.composedPath().includes(this);
    if (outsideClick && this._isActive) {
      const qStr = this._getTextFromInputField();
      if (qStr.length > 0) {
        // the menu may be already closed by focusout at this place
        if (this._expandedMenu) {
          // just close the menu
          this._closeOptionsMenu();
        }
        // update self focused state
        this._selfIsFocused = this._checkSelfHasFocus();
      } else {
        // close the menu
        this._closeOptionsMenu();
        // set not active
        this._updateSpecificSearchField(false);
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
    // consider displaying the formfields correctly for programmatically set value of input field
    // and avoid maximum call stack error
    if (changedProperties.has('value') && (changedProperties.get('value') !== this.value)) {
      if (this._doHideInputFieldActions !== (this.value === '')) {
        this._toggleHideFormfields(this.value === '');
      }
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
    this._updateSpecificSearchField(text !== '');

    // when noautoclose flag is gone, add the listener always
    // this.addEventListener('focusout', this._handleSearchfieldFocusOut);

    // Handle some key events.
    this.addEventListener('keydown', (event) => {
      Console.log(`otcSearchPersistent: keydown event: in general "this" listener: key="${event.key}"`);
      switch (event.key) {
        case 'Escape':
        case 'Esc': {
          // currently we do not distinguish between hasText or not
          if (this._expandedMenu) {
            // just close menu
            this._toggleMenu(false);
            // after _toggleMenu the _isActive state is reset, but for search persistent we must
            // keep the active state for not-closeable search field
            this._updateSpecificSearchField(true);

            // the ESC key should not clear the searchterm
            event.preventDefault();
          } else {
            // close searchfield
            this._clickCloseSearch();
            event.preventDefault();
          }
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

    this._updateSpecificSearchField(true);

    // input field should get focus
    this._toggleMenu(true);
    this._retriggerClick();
  }

  /**
   * API function: Set focus to inner searchterm input field.
   */
  setFocus() {
    if (!this._isActive || !this._checkSelfHasFocus()) {
      // set active
      this._updateSpecificSearchField(true);

      // input field should get focus and menu should open
      this._toggleMenu(true);
    }
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
    this._updateSpecificSearchField(true);

    this._toggleMenu(true);
  }

  #isOldSearchfield() {
    return this._themeIsCarbonFiber;
  }

  _getDecorativeIcon() {
    if (this.#isOldSearchfield()) {
      return html`<otc-icon class="ot-search__decorative-icon-${this._size}" ariaLabel="${o(this._getAriaSearchButtonOpen())}" title="${this.tooltipSearchButtonOpen}" icon="${alwaysOpenSearchIcon}" iconAppearance="${this.inputFieldTransparent ? 'light' : 'dark'}" disableEffects></otc-icon>`;
    }
    return html`<otc-icon class="ot-search__decorative-icon-${this._size}" ariaLabel="${o(this._getAriaSearchButtonOpen())}" title="${this.tooltipSearchButtonOpen}" svg="${actionSearch}" disableEffects></otc-icon>`;
  }

  _renderInputActions() {
    if (this.#isOldSearchfield()) {
      return html`<otc-button class="ot-search__clear-button-${this._size} ot-search--is-search-icon" icononly arialabel="${this.ariaLabelClearKeywords}" title="${this.tooltipClearKeywords}" icon="${formfieldCloseIcon}" @click="${this._clickFormfieldClear}" iconAppearance="${this._getFieldButtonsIconsAppearance()}"></otc-button><otc-button class="ot-search__startsearch-button ot-search--is-search-icon" icononly ?emphasis="${this._selfIsFocused}" arialabel="${this.ariaLabelStartSearch}" title="${this.tooltipStartSearch}" icon="${formfieldSearchIcon}" @click="${this._clickFormfieldSearch}" iconAppearance="${this._getFieldButtonsIconsAppearance()}"></otc-button>`;
    }
    return html`<otc-button class="ot-search__clear-button-${this._size} ot-search--is-search-icon" arialabel="${this.ariaLabelClearKeywords}" title="${this.tooltipClearKeywords}" @click="${this._clickFormfieldClear}" type="subtle" size="${this._getJatoButtonSize()}"><otc-icon svg="${actionCloseSmall}"></otc-icon></otc-button><otc-button class="ot-search__startsearch-button ot-search--is-search-icon" ?emphasis="${this._selfIsFocused}" arialabel="${this.ariaLabelStartSearch}" title="${this.tooltipStartSearch}" @click="${this._clickFormfieldSearch}" type="subtle" size="${this._getJatoButtonSize()}"><otc-icon svg="${actionSearch}"></otc-icon></otc-button>`;
  }

  render() {
    // show loupe only when inactive and with assigned placeholder text
    const showLoupe = !this._isActive && !this._selfIsFocused && this.value.trim() === '';

    const classesSearchRoot = {
      'ot-search': true,
      'ot-search--is-right': this.#rtlController.isRTL,
      'ot-search--is-measure': this.measure,
      'ot-search--is-jato': !this.#isOldSearchfield(),
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
      'ot-search--has-decorative-icon': showLoupe,
      ...classesPersistentState,
    };

    const classesCloseButtonContainer = {
      'ot-search--is-persistent': true,
      [`ot-search__close-button-container-${this._size}`]: true,
      'ot--is-hidden': !showLoupe,
    };

    const classesSearchtermField = {
      'ot-search__searchterm-field': true,
      'ot-search--placeholder-fade-in': this.expanded,
    };

    const classesInputFieldActions = {
      [`ot-search__input-field-actions-${this._size}`]: true,
      [`ot-search__input-field-actions-${this._size}--actions-shown`]: !this._doHideInputFieldActions,
      'ot--is-hidden': this._doHideInputFieldActions,
    };

    return html`<div class="${e(classesSearchRoot)}" ?expanded="${this.expanded}"><div class="ot-search__container"><div ${n(this._partRefs.searchBox)} class="${e(classesSearchBox)}" role="search" aria-label="${this.ariaLabelSearchBox}"><div class="ot-search__box-content"><div class="ot-search__menu-wrapper"><p class="ot--is-hidden" id="ot-search-aria-input-hint-id">${this.ariaLabelInputDescription}</p><div class="ot-search__menu-container-parent-${this._size}"><div class="${e(classesMenuContainer)}"><div class="ot-search__input-container" ${n(this._partRefs.searchInputContainer)}><div class="${e(classesCloseButtonContainer)}">${this._getDecorativeIcon()}</div><div class="ot-search--is-persistent ot-search__input-field-${this._size}"><div class="${e(classesInputFieldQueryContainer)}"><div class="ot-search__searchterm-label-container"><input ${n(this._partRefs.searchTermInput)} class="${e(classesSearchtermField)}" id="ot-search-input-id" .value="${this.value}" type="search" autocomplete="off" placeholder="${this._inputPlaceholderText}" @click="${this._onClick}" @change="${this._onChange}" @input="${this._onInput}" @keydown="${this._onKeydown}" @focus="${this._onFocus}" aria-label="${o(this.ariaLabelInputField)}" aria-describedby="ot-search-aria-input-hint-id"></div></div><div tabindex="-1" class="ot-search__menu-surrogate" ${n(this._partRefs.searchMenuSurrogate)} @focusin="${this._onSurrogateFocusin}" @localfocus="${this._onSurrogateLocalfocus}"></div><div class="${e(classesInputFieldActions)}">${this._renderInputActions()}</div></div></div></div></div><div tabindex="-1" class="ot-search__options-dropdown"><slot ${n(this._partRefs.searchOptionsDropdownSlot)} @slotchange="${this._handleSearchOptionsDropdownSlotChange}"></slot></div></div></div></div></div></div>`;
  }
}

customElements.define('otc-search-persistent', OtcSearchPersistent);

export { OtcSearchPersistent };
//# sourceMappingURL=otcSearchPersistent.js.map
