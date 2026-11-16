import { css, html } from 'lit';
import { OTC_ICON_BUNDLE_WC_HEADER, OTC_ICON_BUNDLE_WC_ACTION_16 } from '../../utilities/render-utilities.js';
import { Console } from '../../utilities/logging-utilities.js';
import { SearchBase, MENU_EVENT_TIMEOUT, formfieldCloseIcon, formfieldSearchIcon } from '../search-base.js';
import { RTLController } from '../../controllers/rtlController.js';
import { generateUniqueNumber, isChild, waitForEvent } from '../../utilities/common-utilities.js';
import commonStyleSheet from '../../styles/common.scss.js';
import '../../../lib/otc-icons/icons_otc-action_16.js';
import '../../../lib/otc-icons/icons_otc-header.js';
import { ref as n } from '../../../node_modules/lit-html/directives/ref.js';
import { classMap as e } from '../../../node_modules/lit-html/directives/class-map.js';
import { ifDefined as o } from '../../../node_modules/lit-html/directives/if-defined.js';

const TYPE_SEARCH_SLIDEIN_PREFIX = 'slidein-';

// common icon definitions
const searchIcon = `${OTC_ICON_BUNDLE_WC_HEADER}:header_search42`;
const actionCloseSearchIcon16 = `${OTC_ICON_BUNDLE_WC_ACTION_16}:action_caret_right16`;
const actionCloseSearchIconRtl16 = `${OTC_ICON_BUNDLE_WC_ACTION_16}:action_caret_left16`;

/**
 * The Search Slidein component is a sub-component of the Header Bar.
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

    return { ...SearchBase._searchBaseProperties, ...props };
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
  }

  _getInternalSizeIdentifier(siz, hasLabel) {
    return TYPE_SEARCH_SLIDEIN_PREFIX + siz + (hasLabel === true ? '-label' : '');
  }

  _handleOutsideClick(event) {
    const outsideClick = typeof event.composedPath === 'function' && !event.composedPath().includes(this);
    if (outsideClick && this.expanded) {
      Console.log('otcSearchSlidein: Detected outsideClick...');

      // Close the options menu, but keep the search field expanded.
      // When the search field is expanded, other header items may be wrapped into an overflow menu.  Clicking on the overflow button could
      // trigger this handler.  If we were to collapse the search field, there would now be room to unwrap the header items from the
      // overflow menu, which would remove the overflow menu we just tried to open.
      if (this._expandedMenu) {
        this._closeOptionsMenu();
      }
    }
  }

  _clickSearchHandler() {
    Console.log('otcSearchSlidein: _clickSearchHandler: clicked');
    this.expanded = !this.expanded;
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
  }

  async updated(changedProperties) {
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

    // remove paddings from search button
    const searchButton = this._searchButton;
    const searchButtonInternal = searchButton.shadowRoot.querySelector('button.ot-btn');
    searchButtonInternal.classList.add('ot-btn--remove-padding');

    // set initial states
    this._setInitialStates();
    const text = this._getTextFromInputField();
    this._toggleHideFormfields(text === '');

    // add listener to display/hide formfields
    const searchTermInput = this._searchTermInput;
    if (searchTermInput) {
      searchTermInput.addEventListener('input', (event) => {
        Console.log(`otcSearchSlidein: searchInputField: input event: updateFormfields, event-text is '${event.target.value}'`);
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

      // add eventlistener for keydown (e.g. Enter-key) for the input-field
      searchTermInput.addEventListener('keydown', (event) => {
        Console.log(`otcSearchSlidein: keydown event: in input field key='${event.key}'`);
        if (event.key === 'Enter' && this.expanded) {
          Console.log('otcSearchSlidein: keydown event: detected "Enter", submitting search.');
          event.preventDefault();
          this._clickStartSearchButton();
        }
      });

      searchTermInput.addEventListener('click', () => {
        Console.log('otcSearchSlidein: input field: got "click" event, opening menu.');
        // open menu, user clicked into search  field
        this._toggleMenu(true);
      });
    }

    // add listener to open menu when input field gets focus
    this.addEventListener('keyup', (event) => {
      // handles Tab and shift-Tab
      if (event.key === 'Tab') {
        Console.log('otcSearchSlidein: inputFields: got "Tab"');
        if (searchTermInput && searchTermInput.matches(':focus')) {
          Console.log('otcSearchSlidein: inputFields: detected "focus" by "Tab" key, opening menu.');
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

  _handleSearchfieldFocusOut(event) {
    Console.log('otcSearchSlidein: handling "focusout" event.');
    Console.log('otcSearchSlidein: checking if "relatedTarget" is part of search field.');
    if (!event.relatedTarget || !isChild(this, event.relatedTarget)) {
      Console.log('otcSearchSlidein: closing based on "focusout" event the menu');
      this._updateMenuOpenState(false);
    }
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
        // close menu before searchfield animation (so that it is not part of searchfield animation)
        Console.log('otcSearchSlidein: _animationstartSearchHandler: Closing the menu...');
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
        // searchfield will be opened
        Console.log('otcSearchSlidein: _animationendSearchHandler: Animation "open" ended');
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

        Console.log('otcSearchSlidein: _animationendSearchHandler: Sending searchfield "open" event');
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
        // close searchfield
        Console.log('otcSearchSlidein: _animationendSearchHandler: Animation "close" ended');
        // hide box after animation
        this._doHideSearchfieldBox = true;
        // focus the search button (also happens when clicked)
        // this._searchButton.focus();
        // send event
        Console.log('otcSearchSlidein: _animationendSearchHandler: Sending searchfield "close" event');
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

  _renderSearchContainer(classes) {
    return html`<div class="ot-search__container"><div ${n(this._partRefs.searchBox)} class="${e(classes.SearchBox)}" role="dialog" aria-label="${this.ariaLabelSearchBox}" @animationstart="${this._animationstartSearchHandler}" @animationend="${this._animationendSearchHandler}"><div class="ot-search__box-content"><div class="ot-search__menu-wrapper"><p class="ot--is-hidden" id="ot-search-aria-input-hint-id">${this.ariaLabelInputDescription}</p><div class="ot-search__menu-container-parent-${this._size}"><div class="ot-search__menu-container-${this._size}"><div class="ot-search__input-container" ${n(this._partRefs.searchInputContainer)}><div class="ot-search__close-button-container-${this._size}"><button @click="${e => this._clickSearchHandler(e)}" aria-label="${o(this._getAriaSearchButtonOpen())}" title="${this.tooltipSearchButtonOpen}"><otc-icon class="ot-search--is-search-icon" ariaLabel="${o(this._getAriaSearchButtonOpen())}" icon="${this.#rtlController.isRTL ? actionCloseSearchIconRtl16 : actionCloseSearchIcon16}" disableEffects></otc-icon></button></div><div class="ot-search__input-field-${this._size}"><div class="ot-search__input-field-query-container-${this._size}"><div class="ot-search__searchterm-label-container">${this._getSearchtermLabel()} <input ${n(this._partRefs.searchTermInput)} class="${e(classes.SearchtermField)}" id="${this.id}" .value="${this.value}" type="search" autocomplete="off" placeholder="${this.searchPlaceholder}" @change="${this._onChange}" @input="${this._onInput}" aria-label="${o(this.ariaLabelInputField)}" aria-describedby="ot-search-aria-input-hint-id"></div></div><div tabindex="-1" class="ot-search__menu-surrogate" ${n(this._partRefs.searchMenuSurrogate)}></div><div class="ot-search__input-field-actions-${this._size}"><otc-button class="ot-search__clear-button-${this._size} ot-search--is-search-icon" icononly arialabel="${this.ariaLabelClearKeywords}" title="${this.tooltipClearKeywords}" icon="${formfieldCloseIcon}" @click="${this._clickFormfieldClear}" iconAppearance="${this._getFieldButtonsIconsAppearance()}"></otc-button><otc-button class="ot-search__startsearch-button" icononly emphasis arialabel="${this.ariaLabelStartSearch}" title="${this.tooltipStartSearch}" icon="${formfieldSearchIcon}" @click="${this._clickFormfieldSearch}" iconAppearance="${this._getFieldButtonsIconsAppearance()}"></otc-button></div></div></div></div></div><div tabindex="-1" class="ot-search__options-dropdown"><slot ${n(this._partRefs.searchOptionsDropdownSlot)} @slotchange="${this._handleSearchOptionsDropdownSlotChange}"></slot></div></div></div></div></div>`;
  }

  render() {
    const classes = {};
    classes.SearchRoot = {
      'ot-search': true,
      'ot-search--is-right': this.#rtlController.isRTL,
      'ot-search--is-measure': this.measure,
    };
    classes.SearchBox = {
      'ot-search__box': true,
      'ot--is-header-item': this.headerItem,
      'ot-search--input-open': this.expanded,
      'ot-search--input-close': !this.expanded,
      'ot--is-hidden': this._doHideSearchfieldBox, // hide after the close animation
    };
    classes.SearchtermField = {
      'ot-search__searchterm-field': true,
      'ot-search--placeholder-fade-in': this.expanded,
    };
    classes.SearchButton = {
      'ot--is-hidden': !this._doHideSearchfieldBox,
    };

    Console.log(`otcSearchSlidein: render: Used internal size identifier is '${this._size}'`);
    // we set the headerItem always to true for the search button, since there exists a selector which
    // should also work for a fully empty search field
    return html`<div class="${e(classes.SearchRoot)}" ?expanded="${this.expanded}">${this._renderSearchContainer(classes)}<otc-button ${n(this._partRefs.searchButton)} class="${e(classes.SearchButton)}" @click="${e => this._clickSearchHandler(e)}" headerItem id="otc-search-searchbutton-id" ariaLabel="${this.ariaLabelSearchButton}" title="${this.tooltipSearchButton}" icon="${this.icon.length > 0 ? this.icon : searchIcon}" ?menuOpen="${this.expanded}" iconAppearance="${this.iconAppearance}"></otc-button></div>`;
  }
}

customElements.define('otc-search-slidein', OtcSearchSlidein);

export { OtcSearchSlidein };
//# sourceMappingURL=otcSearchSlidein.js.map
