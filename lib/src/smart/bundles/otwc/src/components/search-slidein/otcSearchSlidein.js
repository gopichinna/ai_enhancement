/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { css, html } from 'lit';
import { actionChevronSmallLeft, actionChevronSmallRight, actionCloseSmall, actionSearch } from '../../../node_modules/@jato/svgs/dist/index.esm.js';
import { OTC_ICON_BUNDLE_WC_ACTION_16, OTC_ICON_BUNDLE_WC_HEADER } from '../../utilities/render-utilities.js';
import { Console } from '../../utilities/logging-utilities.js';
import { SearchBase, MENU_EVENT_TIMEOUT, formfieldCloseIcon, formfieldSearchIcon } from '../search-base.js';
import { RTLController } from '../../controllers/rtlController.js';
import { generateUniqueNumber, waitForEvent } from '../../utilities/common-utilities.js';
import commonStyleSheet from '../../styles/common.scss.js';
import { ThemeController } from '../../controllers/themeController.js';
import '../../../lib/otc-icons/icons_otc-action_16.js';
import '../../../lib/otc-icons/icons_otc-header.js';
import { ifDefined as o } from '../../../node_modules/lit-html/directives/if-defined.js';
import { ref as n } from '../../../node_modules/lit-html/directives/ref.js';
import { classMap as e } from '../../../node_modules/lit-html/directives/class-map.js';

const TYPE_SEARCH_SLIDEIN_PREFIX = 'slidein-';

// common icon definitions
const searchIcon = `${OTC_ICON_BUNDLE_WC_HEADER}:header_search42`;
const actionCloseSearchIcon16 = `${OTC_ICON_BUNDLE_WC_ACTION_16}:action_caret_right16`;
const actionCloseSearchIconRtl16 = `${OTC_ICON_BUNDLE_WC_ACTION_16}:action_caret_left16`;

/**
 * The Search Slidein component provides an open or closed search field. Usually it is used in the Header Bar.
 * It offers a search button and, if expanded, a search input field including search options. It is placed inside the global Header Bar or
 * a surrounding `flex`-container. It offers the functionality to specify a search term, including selecting the offered search options.
 * @prop {string} ariaLabelSearchButton The `aria-label` of the search button when collapsed.
 * @prop {string} icon A string containing the icon bundle and icon name to be used instead of the default search icon,
 * e.g. otc-header:header_search42.
 * @prop {string} id A randomly generated id used to identify this element.
 * @prop {boolean} label Determines if the search term should be rendered with a label. The text for the label is specified
 * in `labelText` property.
 * @prop {string} tooltipSearchButton The tooltip of the search button when collapsed.
 * @slot unnamed Defines further content of the Header Bar.
 */
class OtcSearchSlidein extends SearchBase {
  #rtlController = new RTLController(this);

  #themeController = new ThemeController(this);

  static get styles() {
    return [
      commonStyleSheet,
      SearchBase._searchBaseStyles,
      css`otc-button#otc-search-searchbutton-id{padding:0 0}`,
    ];
  }

  static get properties() {
    const props = {
      ariaLabelSearchButton: { type: String, reflect: true },
      icon: { type: String, reflect: true },
      // eslint-disable-next-line lit/no-native-attributes
      id: { type: String, reflect: true },
      label: { type: Boolean, reflect: true },
      tooltipSearchButton: { type: String, reflect: true },
    };

    return { ...ThemeController.properties, ...SearchBase._searchBaseProperties, ...props };
  }

  constructor() {
    super();

    this._boundOutsideClickHandler = this._handleOutsideClick.bind(this);

    this.ariaLabelSearchButton = '';
    this.icon = '';
    this.label = false;
    this.tooltipSearchButton = '';

    this._size = this._getInternalSizeIdentifier(this.size, this.label);
    const uniqueNumber = generateUniqueNumber();
    this.id = `search-${uniqueNumber}-ID`;
    this._labelId = `search-${uniqueNumber}-Label`;
    this._handleAnimations = false;

    this.addEventListener('focusout', this._onContainerFocusout);
  }

  _getInternalSizeIdentifier(siz, hasLabel) {
    return TYPE_SEARCH_SLIDEIN_PREFIX + siz + (hasLabel === true ? '-label' : '');
  }

  _handleOutsideClick(event) {
    const outsideClick = typeof event.composedPath === 'function' && !event.composedPath().includes(this);
    if (outsideClick && this.expanded) {

      // Close the options menu, but keep the search field expanded.
      // When the search field is expanded, other header items may be wrapped into an overflow menu.  Clicking on the overflow button could
      // trigger this handler.  If we were to collapse the search field, there would now be room to unwrap the header items from the
      // overflow menu, which would remove the overflow menu we just tried to open.
      if (this._expandedMenu) {
        this._closeOptionsMenu();
      }
    }
    if (this.expanded) {
      // update self focused state
      this._selfIsFocused = this._checkSelfHasFocus();
    }
  }

  /**
   * Updates the slidein search field to the given state(s).
   * @param {Boolean} isActive - if search field is currently in active state
   */
  _updateSpecificSearchField(isActive) {
    if (isActive) {
      this._isActive = isActive;
    } else {
      // set inactive
      this._resetIsActive();
    }
  }

  _clickSearchHandler() {
    this.expanded = !this.expanded;
    if (!this.expanded) {
      this._resetIsActive();
      // we track the focus only for an expanded field
      this._selfIsFocused = false;
    }
  }

  connectedCallback() {
    super.connectedCallback();
    Console.log(`otcSearchSlidein: connectedCallback called... (initialRun: ${this._initialRun}, expanded: ${this.expanded})`);
    // ensure initial value matches the expanded state
    this._doHideSearchfieldBox = !this.expanded;
    // When click is outside of the searchfield component, then close the menu.
    document.addEventListener('click', this._boundOutsideClickHandler);
  }

  disconnectedCallback() {
    document.removeEventListener('click', this._boundOutsideClickHandler);
  }

  // clicks on Search button to collapse the search field
  _clickCloseSearch() {
    if (this.expanded) {
      if (this._expandedMenu) {
        // close menu immediately (so that it is not part of searchfield animation);
        // ensure that _resetIsActive() is called
        this._updateMenuOpenState(false);
      }
      this._searchButton?.click();
    }
  }

  // this is called after render
  _setInitialStates() {
    let menuOpen = false;
    const menuElements = this._rootMenuItems;
    Console.log(`otcSearchSlidein: _setInitialStates: expanded: ${this.expanded}, initialRun: ${this._initialRun}, size: ${this._size}`);

    // get initial menuOpen state from menu
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
    if (changedProperties.has('label') || changedProperties.has('size')) {
      this._size = this._getInternalSizeIdentifier(this.size, this.label);
    }

    if (changedProperties.has('expanded')) {
      if (this._initialRun === false) {
        this._handleAnimations = true;

        // the search field should be shown early to display the open animation
        if (this.expanded && this._doHideSearchfieldBox !== false) {
          this._doHideSearchfieldBox = false;
          this.requestUpdate();
        }
      }
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
      this.removeEventListener('focusout', this._handleSearchfieldFocusOut);
      if (this.noautoclose === false) {
        this.addEventListener('focusout', this._handleSearchfieldFocusOut);
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

    // remove paddings from search button
    const searchButton = this._searchButton;
    const searchButtonInternal = searchButton.shadowRoot.querySelector(this.#isOldSearchfield() ? 'button.ot-btn' : 'button.ot-btn-jato');
    searchButtonInternal.classList.add('ot-btn--remove-padding');

    // set initial states
    this._setInitialStates();
    const text = this._getTextFromInputField();
    this._toggleHideFormfields(text === '');

    // when noautoclose flag is gone, add the listener always
    // this.addEventListener('focusout', this._handleSearchfieldFocusOut);

    // Handle some key events.
    this.addEventListener('keydown', (event) => {
      Console.log(`otcSearchSlidein: keydown event: in general "this" listener: key="${event.key}"`);
      switch (event.key) {
        case 'Escape':
        case 'Esc': {
          // currently we do not distinguish between hasText or not
          if (this._expandedMenu) {
            // just close menu
            this._toggleMenu(false);
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
      this._initialRun = false;
      Console.log(`otcSearchSlidein: firstUpdated: _initialRun is now: ${this._initialRun}`);
      // set focus to search input field
      this._setFocusSearchInput();
    });
  }

  _getFieldButtonsIconsAppearance() {
    return 'dark';
  }

  /* Returns the label to render based on the given properties. */
  _getSearchtermLabel() {
    if (this.label) {
      if (this.size === 'lg' || this.size === 'md') {
        return html`<label for="${this.id}" id="${this._labelId}" class="ot-search__searchterm-label">${this.labelText}</label>`;
      }
    }
    return html``;
  }

  async _animationstartSearchHandler() {
    // This handler is not called reliably, so you cannot rely on that this code gets executed every time
    // an animation starts.
    if (this._handleAnimations) {
      if (!this.expanded) {
        try {
          if (this._expandedMenu) {
            const menuElem = this._rootMenuItems.at(0);
            if (menuElem) {
              await waitForEvent(menuElem, 'close', () => {
                this._updateMenuOpenState(false);
              }, MENU_EVENT_TIMEOUT);
            }
          }
        } catch (error) {
          Console.log(`otcSearchSlidein: _animationstartSearchHandler: Did not receive menu-"close" event: ${error.message}`);
        }
      }
    }
  }

  async _animationendSearchHandler() {
    if (this._handleAnimations) {
      // handle the event only once for each change of 'expanded' property
      this._handleAnimations = false;

      if (this.expanded) {
        // open menu
        const menuElem = this._rootMenuItems.at(0);
        if (menuElem) {
          try {
            await waitForEvent(menuElem, 'open', () => {
              // open menu
              this._toggleMenu(true);
            }, MENU_EVENT_TIMEOUT);
          } catch (error) {
            Console.log(`otcSearchSlidein: _animationendSearchHandler: Did not receive menu-"open" event: ${error.message}`);
          }
        }
        // send event
        const openEvent = new CustomEvent('open', {
          bubbles: true,
          cancelable: false,
          composed: true,
          message: 'Open search',
        });
        this.dispatchEvent(openEvent);
      } else {
        // searchfield will be closed
        try {
          if (this._expandedMenu) {
            // The animationstart event is not reliably called, so we ensure that the options menu gets closed
            // although it might already not be shown anymore
            Console.log('otcSearchSlidein: _animationendSearchHandler: Ensure closed menu.');
            const menuElem = this._rootMenuItems.at(0);
            if (menuElem) {
              await waitForEvent(menuElem, 'close', () => {
                this._updateMenuOpenState(false);
              }, MENU_EVENT_TIMEOUT);
            }
          }
        } catch (error) {
          Console.log(`otcSearchSlidein: _animationendSearchHandler: Did not receive menu-"close" event: ${error.message}`);
        }
        // hide box after animation
        this._doHideSearchfieldBox = true;
        // always focus the search button (also happens when clicked)
        this._searchButton?.focus();
        const closeEvent = new CustomEvent('close', {
          bubbles: true,
          cancelable: false,
          composed: true,
          message: 'Close search',
        });
        this.dispatchEvent(closeEvent);
      }
    }
  }

  _onFocus() {
    this._toggleMenu(true);
  }

  /**
   * API function: Set focus to inner searchterm input field or search button.
   */
  setFocus() {
    if (!this._isActive || !this._checkSelfHasFocus()) {
      if (this.expanded && this._searchTermInput) {
        // forward the focus to the input field
        this._searchTermInput.focus();
      } else if (!this.expanded && this._searchButton) {
        // forward the focus to button
        this._searchButton.focus();
      } else {
        // eslint-disable-next-line no-console
        console.warn('otcSearchSlidein: setFocus: Unable to set focus to inner input field or search button.');
      }
    }
  }

  _renderCloseButtonContainer() {
    if (this.#isOldSearchfield()) {
      return html`<div class="ot-search__close-button-container-${this._size}"><button @click="${e => this._clickSearchHandler(e)}" aria-label="${o(this._getAriaSearchButtonOpen())}" title="${this.tooltipSearchButtonOpen}"><otc-icon class="ot-search--is-search-icon" ariaLabel="${o(this._getAriaSearchButtonOpen())}" icon="${this.#rtlController.isRTL ? actionCloseSearchIconRtl16 : actionCloseSearchIcon16}" disableEffects></otc-icon></button></div>`;
    }
    return html`<div class="ot-search__close-button-container-${this._size}"><otc-button class="ot-search__close-button-size-${this._size}" @click="${e => this._clickSearchHandler(e)}" ariaLabel="${o(this._getAriaSearchButtonOpen())}" title="${this.tooltipSearchButtonOpen}" type="subtle" size="${this._getJatoButtonSize()}"><otc-icon ariaLabel="${o(this._getAriaSearchButtonOpen())}" svg="${this.#rtlController.isRTL ? actionChevronSmallLeft : actionChevronSmallRight}"></otc-icon></otc-button></div>`;
  }

  _renderInputActions() {
    if (this.#isOldSearchfield()) {
      return html`<otc-button class="ot-search__clear-button-${this._size} ot-search--is-search-icon" icononly arialabel="${this.ariaLabelClearKeywords}" title="${this.tooltipClearKeywords}" icon="${formfieldCloseIcon}" @click="${this._clickFormfieldClear}" iconAppearance="${this._getFieldButtonsIconsAppearance()}"></otc-button><otc-button class="ot-search__startsearch-button ot-search--is-search-icon" icononly ?emphasis="${this._selfIsFocused}" arialabel="${this.ariaLabelStartSearch}" title="${this.tooltipStartSearch}" icon="${formfieldSearchIcon}" @click="${this._clickFormfieldSearch}" iconAppearance="${this._getFieldButtonsIconsAppearance()}"></otc-button>`;
    }
    return html`<otc-button class="ot-search__clear-button-${this._size} ot-search--is-search-icon" arialabel="${this.ariaLabelClearKeywords}" title="${this.tooltipClearKeywords}" @click="${this._clickFormfieldClear}" type="subtle" size="${this._getJatoButtonSize()}"><otc-icon svg="${actionCloseSmall}"></otc-icon></otc-button><otc-button class="ot-search__startsearch-button ot-search--is-search-icon" ?emphasis="${this._selfIsFocused}" arialabel="${this.ariaLabelStartSearch}" title="${this.tooltipStartSearch}" @click="${this._clickFormfieldSearch}" type="subtle" size="${this._getJatoButtonSize()}"><otc-icon svg="${actionSearch}"></otc-icon></otc-button>`;
  }

  _renderSearchContainer(classes) {
    return html`<div class="ot-search__container"><div ${n(this._partRefs.searchBox)} class="${e(classes.SearchBox)}" role="search" aria-label="${this.ariaLabelSearchBox}" @animationstart="${this._animationstartSearchHandler}" @animationend="${this._animationendSearchHandler}"><div class="ot-search__box-content"><div class="ot-search__menu-wrapper"><p class="ot--is-hidden" id="ot-search-aria-input-hint-id">${this.ariaLabelInputDescription}</p><div class="ot-search__menu-container-parent-${this._size}"><div class="${e(classes.MenuContainer)}"><div class="ot-search__input-container" ${n(this._partRefs.searchInputContainer)}>${this._renderCloseButtonContainer()}<div class="ot-search__input-field-${this._size}"><div class="ot-search__input-field-query-container-${this._size}"><div class="ot-search__searchterm-label-container">${this._getSearchtermLabel()} <input ${n(this._partRefs.searchTermInput)} class="${e(classes.SearchtermField)}" id="${this.id}" .value="${this.value}" type="search" autocomplete="off" placeholder="${this.searchPlaceholder}" @click="${this._onClick}" @change="${this._onChange}" @input="${this._onInput}" @keydown="${this._onKeydown}" @focus="${this._onFocus}" aria-label="${o(this.ariaLabelInputField)}" aria-describedby="ot-search-aria-input-hint-id"></div></div><div tabindex="-1" class="ot-search__menu-surrogate" ${n(this._partRefs.searchMenuSurrogate)} @focusin="${this._onSurrogateFocusin}" @localfocus="${this._onSurrogateLocalfocus}"></div><div class="${e(classes.InputFieldActions)}">${this._renderInputActions()}</div></div></div></div></div><div tabindex="-1" class="ot-search__options-dropdown"><slot ${n(this._partRefs.searchOptionsDropdownSlot)} @slotchange="${this._handleSearchOptionsDropdownSlotChange}"></slot></div></div></div></div></div>`;
  }

  #isOldSearchfield() {
    return this._themeIsCarbonFiber;
  }

  render() {
    const classes = {};
    classes.SearchRoot = {
      'ot-search': true,
      'ot-search--is-right': this.#rtlController.isRTL,
      'ot-search--is-measure': this.measure,
      'ot-search--is-jato': !this.#isOldSearchfield(),
    };
    classes.SearchBox = {
      'ot-search__box': true,
      'ot--is-header-item': this.headerItem,
      'ot-search--input-open': this.expanded,
      'ot-search--input-close': !this.expanded,
      'ot--is-hidden': this._doHideSearchfieldBox, // hide after the close animation
    };
    classes.MenuContainer = {
      [`ot-search__menu-container-${this._size}`]: true,
      'ot-search--is-active': this._isActive,
    };
    classes.SearchtermField = {
      'ot-search__searchterm-field': true,
      'ot-search--placeholder-fade-in': this.expanded,
      'ot-search--is-active': this._isActive,
    };
    classes.SearchButton = {
      'ot--is-hidden': !this._doHideSearchfieldBox,
    };
    classes.InputFieldActions = {
      [`ot-search__input-field-actions-${this._size}`]: true,
      [`ot-search__input-field-actions-${this._size}--actions-shown`]: !this._doHideInputFieldActions,
      'ot--is-hidden': this._doHideInputFieldActions,
    };

    Console.log(`otcSearchSlidein: render: Used internal size identifier is '${this._size}'`);
    if (this.#isOldSearchfield()) {
      // we set the headerItem always to true for the search button, since there exists a selector which
      // should also work for a fully empty search field
      return html`<div class="${e(classes.SearchRoot)}" ?expanded="${this.expanded}">${this._renderSearchContainer(classes)}<otc-button ${n(this._partRefs.searchButton)} class="${e(classes.SearchButton)}" @click="${e => this._clickSearchHandler(e)}" headerItem id="otc-search-searchbutton-id" ariaLabel="${this.ariaLabelSearchButton}" title="${this.tooltipSearchButton}" icon="${this.icon.length > 0 ? this.icon : searchIcon}" ?menuOpen="${this.expanded}" iconAppearance="${this.iconAppearance}"></otc-button></div>`;
    }
    // the 'id' is also used in headerbar to find this button
    return html`<div class="${e(classes.SearchRoot)}" ?expanded="${this.expanded}">${this._renderSearchContainer(classes)}<otc-button ${n(this._partRefs.searchButton)} class="${e(classes.SearchButton)}" @click="${e => this._clickSearchHandler(e)}" id="otc-search-searchbutton-id" ariaLabel="${this.ariaLabelSearchButton}" title="${this.tooltipSearchButton}" type="subtle"><otc-icon svg="${actionSearch}"></otc-icon></otc-button></div>`;
  }
}

customElements.define('otc-search-slidein', OtcSearchSlidein);

export { OtcSearchSlidein };
//# sourceMappingURL=otcSearchSlidein.js.map
