/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { css, html } from 'lit';
import { ElementBase } from '../element-base.js';
import commonStyleSheet from '../../styles/common.scss.js';
import iconStyleSheet from '../../styles/icons.scss.js';
import headerStyleSheet from '../headerbar/otcHeaderbar.scss.js';
import { b64Encode, b64Decode, ICON_BUNDLE_ACTION, ICON_BUNDLE_HEADER } from '../../utilities/render-utilities.js';
import { Console } from '../../utilities/logging-utilities.js';
import { waitForEvent } from '../../utilities/common-utilities.js';
import { classMap as e } from '../../../node_modules/lit-html/directives/class-map.js';

// common icon definitions
const searchIcon = `${ICON_BUNDLE_HEADER}:header_search42`;
const searchIconOpen = `${ICON_BUNDLE_HEADER}:header_search_open42`;
const formfieldCloseIcon = `${ICON_BUNDLE_ACTION}:action_close_min32`;
const formfieldSearchIcon = `${ICON_BUNDLE_ACTION}:action_search32`;

const SEARCH_REGION_ARIA = 'Global content search';
const SEARCH_PLACEHOLDER = 'Search';
const SELECTOR_SEARCH_BUTTON = '.ot-searchfield > otc-button';
const SELECTOR_SEARCHFIELD_BOX = '.ot-searchfield__box';
const MENU_EVENT_TIMEOUT = 500;

class OtcSearchField extends ElementBase {
  // the CSS styles
  static get styles() {
    return [
      commonStyleSheet,
      iconStyleSheet,
      headerStyleSheet,
      css`:host{width:100%;display:flex;justify-content:flex-end}`,
    ];
  }

  static get properties() {
    return {
      headerItem: { type: Boolean, reflect: true },
      searchPlaceholder: { type: String, reflect: true },
      ariaLabel: { type: String, reflect: true },
      ariaLabelSearchButton: { type: String, reflect: true },
      ariaLabelSearchButtonOpen: { type: String, reflect: true },
      ariaLabelClearKeywords: { type: String, reflect: true },
      ariaLabelStartSearch: { type: String, reflect: true },
      expanded: { type: Boolean, reflect: true },
      iconAppearance: { type: String, reflect: true },
      tooltipSearchButton: { type: String, reflect: true },
      tooltipSearchButtonOpen: { type: String, reflect: true },
      tooltipClearKeywords: { type: String, reflect: true },
      tooltipStartSearch: { type: String, reflect: true },
      _doHideSearchfieldBox: { type: Boolean, state: true },
      _doCloseSearchAnimation: { type: Boolean, state: true },
    };
  }

  constructor() {
    super();

    this._boundOutsideClickHandler = this._handleOutsideClick.bind(this);

    this.headerItem = true;
    this.searchPlaceholder = SEARCH_PLACEHOLDER;
    this.ariaLabel = SEARCH_REGION_ARIA;
    this.ariaLabelSearchButton = '';
    this.ariaLabelSearchButtonOpen = '';
    this.ariaLabelClearKeywords = '';
    this.ariaLabelStartSearch = '';
    this.iconAppearance = '';
    this.tooltipSearchButton = '';
    this.tooltipSearchButtonOpen = '';
    this.tooltipClearKeywords = '';
    this.tooltipStartSearch = '';
    this.expanded = false;
    this._expandedMenu = false;
    this._menuElements = [];
    this._doHideSearchfieldBox = !this.expanded;
    this._doCloseSearchAnimation = !this.expanded;
    this._initialRun = true;
  }

  _updateMenuOpenState(isMenuOpen) {
    Console.log(`otcSearchField: _updateMenuOpenState: menu isOpen: ${isMenuOpen} (internal state: ${this._expandedMenu})`);
    if (this._expandedMenu !== isMenuOpen) {
      this._expandedMenu = isMenuOpen;
      if (this._menuElements) {
        this._menuElements.forEach((menuElem) => {
          menuElem.isOpen = isMenuOpen;
        });
      }
    }
  }

  _setFocusSearchInput() {
    if (this.expanded) {
      const inputField = this.shadowRoot.querySelector('input.ot-searchfield__input-field');
      if (inputField) {
        inputField.focus();
      }
    }
  }

  // isMenuOpen specifies the wanted menu state
  _toggleMenu(isMenuOpen) {
    this._updateMenuOpenState(isMenuOpen);
    // if we don't wait until menu is there it will steal our focus
    this.updateComplete.then(() => {
      this._setFocusSearchInput();
    });
  }

  // toggles the searchfield based on the current this.expanded state
  async _toggleSearchfieldExpanded() {
    const searchfieldBox = this.shadowRoot.querySelector(SELECTOR_SEARCHFIELD_BOX);
    const handlerOptions = {
      capture: false,
      once: true,
      passive: false,
    };
    const currentExpanded = this.expanded; // state before flipping

    // set states before changing expanded flag
    if (!currentExpanded) {
      // searchfield will be opened
      this._doHideSearchfieldBox = false;
      this._doCloseSearchAnimation = false;

      searchfieldBox.addEventListener('animationend', async () => {
        // open menu
        const [menuElem] = this._menuElements;
        if (menuElem) {
          try {
            await waitForEvent(menuElem, 'open', () => {
              // open menu
              this._toggleMenu(true);
            }, MENU_EVENT_TIMEOUT);
          } catch (error) {
            Console.log(`otcSearchField: _toggleSearchfieldExpanded: Did not receive menu-"open" event: ${error.message}`);
          }
        }
        // send event
        const openEvent = new CustomEvent('open', {
          bubbles: true,
          cancelable: false,
          composed: true,
          message: 'Open searchfield',
        });
        this.dispatchEvent(openEvent);
      }, handlerOptions);
    } else {
      // searchfield will be closed
      // close menu before searchfield animation (so that it is not part of searchfield animation)
      try {
        if (this._expandedMenu) {
          const [menuElem] = this._menuElements;
          if (menuElem) {
            await waitForEvent(menuElem, 'close', async () => {
              this._updateMenuOpenState(false);
              await this.updateComplete;
            }, MENU_EVENT_TIMEOUT);
          }
        }
      } catch (error) {
        Console.log(`otcSearchField: _toggleSearchfieldExpanded: Did not receive menu-"close" event: ${error.message}`);
      }

      // close searchfield
      this._doCloseSearchAnimation = true;
      searchfieldBox.addEventListener('animationend', () => {
        this._doHideSearchfieldBox = true;
        // focus the search button
        this.shadowRoot.querySelector(SELECTOR_SEARCH_BUTTON).focus();
        const closeEvent = new CustomEvent('close', {
          bubbles: true,
          cancelable: false,
          composed: true,
          message: 'Close searchfield',
        });
        this.dispatchEvent(closeEvent);
      }, handlerOptions);
    }

    // toggle the expanded flag
    this.expanded = !this.expanded;
    Console.log(`otcSearchField: _toggleSearchfieldExpanded: New value of "expanded": ${this.expanded}`);
    // This is necessary to immediately reflect the this.expanded change above, a render is necessary
    this.requestUpdate();

    await this.updateComplete;
  }

  // function to present the search field initially opened/closed without animations
  setInitialState(expanded) {
    this._initialRun = true; // skip animations
    // set the flags to your needs
    this._doCloseSearchAnimation = expanded;
    this._doHideSearchfieldBox = !expanded;
    this.expanded = expanded; // change the state
    this.updateComplete.then(() => {
      this._initialRun = false;
    });
  }

  async _clickSearchHandler() {
    await this._toggleSearchfieldExpanded();
  }

  // clicks on Search button to collapse the search field
  _clickCloseSearch() {
    if (this.expanded) {
      const searchButton = this.shadowRoot.querySelector(SELECTOR_SEARCH_BUTTON);
      searchButton.click();
    }
  }

  // clicks on startSearch span/button
  _clickStartSearchButton() {
    if (this.expanded) {
      const startSearch = this.shadowRoot.querySelector('otc-button.formfield-search');
      startSearch.click();
    }
  }

  // get selection in searchWithin
  _optionsHandleWithin(element, options) {
    const searchOptions = options;
    // only searchWithin has currently otc-menucheckbox items
    if (element.tagName === 'OTC-MENUCHECKBOX') {
      if (element.checked) {
        searchOptions.searchWithin = searchOptions.searchWithin || [];
        const entry = {
          name: element.id,
          checked: element.checked,
        };
        searchOptions.searchWithin.push(entry);
      }
    }
    return searchOptions;
  }

  _slotWorker(slotElem, options, startLevel) {
    let searchOptions = options;
    if (slotElem) {
      const menuElements = slotElem.assignedElements({ flatten: true });
      menuElements.forEach((element) => {
        Console.log(`otcSearchField: menu slot (${startLevel}): tagName: ${element.tagName}`);
        if (element.tagName && element.tagName.indexOf('MENU') >= 0) {
          searchOptions = this._optionsHandleWithin(element, searchOptions);

          if (element.slot && element.slot.assignedElements) {
            searchOptions = this._slotWorker(element.slot, searchOptions, startLevel + 1);
          }

          if (element.children && element.children.length > 0) {
            let elem;
            for (let i = 0; i < element.children.length; i += 1) {
              elem = element.children[i];
              Console.log(`otcSearchField: menu slot (${startLevel}) child: tagName: ${elem.tagName}, id: ${elem.id}`);
              searchOptions = this._optionsHandleWithin(elem, searchOptions);

              if (elem.slot && elem.slot.assignedElements) {
                searchOptions = this._slotWorker(elem.slot, searchOptions, startLevel + 1);
              }
            }
          }
        }
      });
    }
    return searchOptions;
  }

  _getSearchOptionsTopSlotElements() {
    let ret = [];
    const optionsDiv = this.shadowRoot.querySelector('div.ot-searchfield__options-dropdown');
    if (optionsDiv) {
      ret = optionsDiv.querySelectorAll('slot');
    }
    return ret;
  }

  // retrieves the currently selected searchOptions
  _getCurrentSearchOptions() {
    let searchOptions = {};
    const slotElems = this._getSearchOptionsTopSlotElements();
    slotElems.forEach((element) => {
      searchOptions = this._slotWorker(element, searchOptions, 0);
    });
    return searchOptions;
  }

  _getTextFromInputField() {
    let ret = '';
    if (this.expanded) {
      const searchInput = this.shadowRoot.querySelector('input.ot-searchfield__input-field');
      if (searchInput) {
        ret = searchInput.value;
      }
    }
    return ret;
  }

  _submitSearch() {
    const searchOptions = this._getCurrentSearchOptions();
    const searchString = this._getTextFromInputField();
    let searchStringEnc = '';
    if (searchString.length > 0) {
      searchStringEnc = b64Encode(searchString);
    }
    Console.log(`otcSearchField: _submitSearch: b64 decoded string: '${b64Decode(searchStringEnc)}'`);
    // close searchOptions
    this._closeOptionsMenu();

    // create event and send options in event_data
    const searchEvent = new CustomEvent('search', {
      bubbles: true,
      cancelable: false,
      composed: true,
      detail: {
        options: {
          searchWithin: searchOptions.searchWithin,
        },
        searchstring: searchStringEnc,
        message: 'Submit search',
      },
    });
    this.dispatchEvent(searchEvent);
  }

  _closeOptionsMenu() {
    if (this.expanded && this._expandedMenu) {
      const slotElems = this._getSearchOptionsTopSlotElements();
      slotElems.forEach((slotElem) => {
        const menuElements = slotElem.assignedElements({ flatten: true });
        menuElements.forEach((element) => {
          Console.log(`otcSearchField: _closeOptionsMenu: current tagName: ${element.tagName}`);
          if (element.tagName && element.tagName === 'OTC-MENU') {
            element.isOpen = false;
            this._expandedMenu = false;
          }
        });
      });
    }
  }

  _getRootMenuItems() {
    const resultElements = [];
    const slotElems = this._getSearchOptionsTopSlotElements();
    slotElems.forEach((slotElem) => {
      if (slotElem) {
        const menuElements = slotElem.assignedElements({ flatten: true });
        menuElements.forEach((element) => {
          if (element.tagName && element.tagName === 'OTC-MENU') {
            resultElements.push(element);
          }
        });
      }
    });
    return resultElements;
  }

  // this is called after render
  _setInitialStates() {
    let menuOpen = false;
    const menuElements = this._getRootMenuItems();
    Console.log(`otcSearchfield: _setInitialStates: expanded: ${this.expanded}`);

    menuElements.every((element) => {
      if (element.isOpen) {
        menuOpen = true;
        return false;
      }
      return true;
    });
    // init props
    this._expandedMenu = menuOpen;
    this._menuElements = menuElements;
    Console.log(`otcSearchField: _setInitialStates: searchOptions menu is ${this._expandedMenu ? 'open'
      : 'NOT open'} (expanded: ${this.expanded}), found in summary ${this._menuElements.length} root menu items.`);
  }

  _toggleHideFormfields(doHide) {
    const inputActionsElem = this.shadowRoot.querySelector('.ot-searchfield .ot-searchfield__input-field-actions');
    if (inputActionsElem) {
      if (doHide) {
        inputActionsElem.classList.add('ot--is-visibility-hidden');
      } else {
        inputActionsElem.classList.remove('ot--is-visibility-hidden');
      }
    }
  }

  _handleOutsideClick(event) {
    const outsideClick = typeof event.composedPath === 'function' && !event.composedPath().includes(this);
    if (outsideClick && this.expanded) {
      const qStr = this._getTextFromInputField();
      if (qStr.length > 0 && this._expandedMenu) {
        // just close the menu
        this._closeOptionsMenu();
      } else {
        // close whole search field
        this._toggleSearchfieldExpanded();
      }
    }
  }

  connectedCallback() {
    super.connectedCallback();
    Console.log(`otc-searchfield: connectedCallback called... (initialRun: ${this._initialRun}, expanded: ${this.expanded})`);
    if (this._initialRun) {
      this._doCloseSearchAnimation = this.expanded;
      this._doHideSearchfieldBox = !this.expanded;
    }

    // When click is outside of the searchfield component, then close the menu/search field.
    document.addEventListener('click', this._boundOutsideClickHandler);
  }

  disconnectedCallback() {
    document.removeEventListener('click', this._boundOutsideClickHandler);
  }

  /**
   * After the DOM has been updated the first time (after render)
   *
   * @param changedProperties
   */
  firstUpdated(changedProperties) {
    super.firstUpdated(changedProperties);

    // detect if otc-menu is used with isOpen=true
    this._setInitialStates();
    const text = this._getTextFromInputField();
    if (text === '') {
      this._toggleHideFormfields(true);
    } else {
      this._toggleHideFormfields(false);
    }

    // add listener to display/hide formfields
    const searchInputElem = this.shadowRoot.querySelector('input.ot-searchfield__input-field');
    if (searchInputElem) {
      searchInputElem.addEventListener('input', (event) => {
        const hasText = (event.target.value !== '');
        if (hasText) {
          this._toggleHideFormfields(false);
        } else {
          this._toggleHideFormfields(true);
        }
        // open menu (if you change input the menu should open)
        this._toggleMenu(true);
      });

      // add eventlistener for keydown (Enter-key only) for the input-field
      searchInputElem.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && this.expanded) {
          event.preventDefault();
          this._clickStartSearchButton();
        }
      });

      searchInputElem.addEventListener('click', () => {
        // open menu, user clicked into search  field
        this._toggleMenu(true);
      });
    }

    // Handle some key events. When Enter key is pressed, then execute the search request.
    this.addEventListener('keydown', (event) => {
      Console.log(`otcSearchField: keydown event: in general "this" listener: key="${event.key}"`);
      switch (event.key) {
        case 'Escape':
        case 'Esc': {
          this._clickCloseSearch();
          event.preventDefault();
          break;
        }
      }
    });

    // enable animations
    this._initialRun = false;

    // set focus to search input field
    this._setFocusSearchInput();
  }

  // public function for clearing search term
  clearSearchTerm() {
    const inputElem = this.shadowRoot.querySelector('input.ot-searchfield__input-field');
    if (inputElem) {
      inputElem.value = '';
      this._toggleHideFormfields(true);
    }
  }

  _clickFormfieldClear() {
    this.clearSearchTerm();
    // set focus to search input field
    this._setFocusSearchInput();
    // open menu
    this._toggleMenu(true);
  }

  _clickFormfieldSearch() {
    this._submitSearch();
    // set focus to search input field
    this._setFocusSearchInput();
  }

  render() {
    const classesSearchBox = {
      'ot-searchfield__box': true,
      'ot--is-header-item': this.headerItem,
      'ot-searchfield__container': true,
      'ot-searchfield--input-open': this.expanded && !this._initialRun,
      'ot-searchfield--input-close': this._doCloseSearchAnimation && !this._initialRun,
      'ot-searchfield__box--is-hidden': this._doHideSearchfieldBox,
    };
    return html`<div class="ot-searchfield"><div class="ot-searchfield__container"><div class="${e(classesSearchBox)}" role="search" aria-label="${this.ariaLabel}"><div class="ot-searchfield__box-content"><div class="ot-searchfield__menu-wrapper"><div class="ot-searchfield__menu-boxsize-parent"><div class="ot-searchfield__menu-container"><div class="ot-searchfield__input-container"><div class="ot-searchfield__input-field-wrapper"><input class="ot-searchfield__input-field ot-searchfield-input-enter" type="search" autocomplete="off" name="q" placeholder="${this.searchPlaceholder}"></div><div class="ot-searchfield__input-field-actions"><otc-button class="formfield-clear" arialabel="${this.ariaLabelClearKeywords}" title="${this.tooltipClearKeywords}" icon="${formfieldCloseIcon}" @click="${this._clickFormfieldClear}"></otc-button><span class="ot-vertical-separator"></span><otc-button class="formfield-search" arialabel="${this.ariaLabelStartSearch}" title="${this.tooltipStartSearch}" icon="${formfieldSearchIcon}" @click="${this._clickFormfieldSearch}"></otc-button></div></div></div><div class="ot-searchfield__options-dropdown"><slot></slot></div></div></div></div></div></div><otc-button @click="${this._clickSearchHandler}" ?headerItem="${this.headerItem}" id="headerbarSearchButtonID" ariaLabel="${this.expanded ? this.ariaLabelSearchButtonOpen : this.ariaLabelSearchButton}" title="${this.expanded ? this.tooltipSearchButtonOpen : this.tooltipSearchButton}" icon="${this.expanded ? searchIconOpen : searchIcon}" ?menuOpen="${this.expanded}" iconAppearance="${this.iconAppearance}"></otc-button></div>`;
  }
}

if (!customElements.get('otc-search-field')) {
  customElements.define('otc-search-field', OtcSearchField);
}

export { OtcSearchField };
//# sourceMappingURL=otcSearchField.js.map
