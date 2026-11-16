import { ElementBase } from './element-base.js';
import iconStyleSheet from '../styles/icons.scss.js';
import searchStyles from './search.scss.js';
import { OTC_ICON_BUNDLE_WC_ACTION } from '../utilities/render-utilities.js';
import { Console } from '../utilities/logging-utilities.js';
import { FocusUtilities } from '../utilities/focus-utilities.js';
import '../../lib/otc-icons/icons_otc-action.js';
import { createRef as e } from '../../node_modules/lit-html/directives/ref.js';

// common icon definitions
const formfieldSearchIcon = `${OTC_ICON_BUNDLE_WC_ACTION}:action_search32`;
const formfieldCloseIcon = `${OTC_ICON_BUNDLE_WC_ACTION}:action_close_min32`;

const MENU_EVENT_TIMEOUT = 500;

const menuItemsToIgnore = ['OTC-MENUDIVIDER'];

const SEARCH_PLACEHOLDER = 'Search';
const DEFAULT_ARIA_LABEL_SEARCH_BOX = 'Content search';
const DEFAULT_ARIA_LABEL_INPUT_FIELD = 'Search terms';
const DEFAULT_ARIA_DESCRIPTION_INPUT_FIELD = 'Enter your search terms, an options menu may exist';

/**
 * @prop {string} ariaLabelClearKeywords The `aria-label` of the ClearKeywords button.
 * @prop {string} ariaLabelSearchButtonOpen The `aria-label` of the Search button.
 * @prop {string} ariaLabelStartSearch The `aria-label` of the StartSearch button.
 * @prop {string} ariaLabelSearchBox The `aria-label` of the whole search box.
 * @prop {string} ariaLabelInputDescription The description of the search term input field. It should contain a hint about the options menu.
 * @prop {string} ariaLabelInputField The `aria-label` of the search term input field.
 * @prop {boolean} expanded Defines whether the Search Slidein is rendered expanded. If not expanded only the Search
 * button is displayed, but the Search Slidein is hidden by default. If set to `true` the Search Slidein gets rendered in open state.
 * @prop {boolean} headerItem Defines whether the search field is used in the Header Bar. **Note:** Currently only the usage in a Header
 * Bar is supported so the default value is `true`.
 * @prop {string} iconAppearance Specifies the icon appearance (theme) of the button. Currently supported (by icon category):
 *   + header: default, dark, light
 *   + action: dark (default), light
 *   + action_small: dark (default), light, blue, red
 * @prop {string} labelText Defines the label for the search term.
 * @prop {boolean} measure Enables special mode for measuring the size of the web component.
 * @prop {string} searchPlaceholder The placeholder for the search input field.
 * @prop {string} size Defines the rendered size of the search field.
 * @prop {string} tooltipClearKeywords The tooltip of the ClearKeywords button
 * @prop {string} tooltipSearchButtonOpen The tooltip of the Search button
 * @prop {string} tooltipStartSearch The tooltip of the StartSearch button
 * @prop {string} value The value of the search term.
 * @fires change Fired when the input operation has finished by submitting search or by pressing clear keywords or on focusout.
 * @fires click Fired when clicking the brand banner, an action icon or inside the searchfield with the mouse/tap. Doing the same through
 * keyboard navigation may also result in a `click` event. **Note:** The event will not be fired if the `disabled` property is set
 * to `true`.
 * @fires input Fired when the value of the input changes at each keystroke.
 * @fires search Fired when the search query is submitted by clicking on the Search button or pressing enter key. The custom event contains
 * an `event.detail` property which contains an `options` and a `searchstring` object. For each selectable menuitem in the search options
 * you must provide an `id` attribute on the menuitem with an unique internal id. The search options use the `id` attribute to identify
 * the selection.
 * The `detail.options` in the search event contains for each selected item:
 *   + itemid: the given unique internal id of the menuitem
 *   + checked: true
 *   + name: deprecated, contains also the given internal id; replaced by itemid
 * **Note:** The event will not be fired if the `disabled` property is set to `true`.
 * @fires open Fired when the Search Slidein is opened. **Note:** The event will not be fired if the `disabled` property is set to `true`.
 * @fires close Fired when the Search Slidein is closed by clicking outside of the Search Slidein. **Note:** The event will not be fired if
 * the `disabled` property is set to `true`.
 */
class SearchBase extends ElementBase {
  // Used internally to access elements in the shadow root.
  _partRefs = {
    searchBox: e(),
    searchButton: e(),
    searchInputContainer: e(),
    searchMenuSurrogate: e(),
    searchOptionsDropdownSlot: e(),
    searchTermInput: e(),
  };

  static get _searchBaseStyles() {
    return [
      iconStyleSheet,
      searchStyles,
    ];
  }

  static get _searchBaseProperties() {
    return {
      ariaLabelClearKeywords: { type: String, reflect: true },
      ariaLabelSearchButtonOpen: { type: String, reflect: true },
      ariaLabelStartSearch: { type: String, reflect: true },
      ariaLabelSearchBox: { type: String, reflect: true },
      ariaLabelInputDescription: { type: String, reflect: true },
      ariaLabelInputField: { type: String, reflect: true },
      expanded: { type: Boolean, reflect: true },
      headerItem: { type: Boolean, reflect: true },
      iconAppearance: { type: String, reflect: true },
      labelText: { type: String, reflect: true },
      measure: { type: Boolean, reflect: true },
      searchPlaceholder: { type: String, reflect: true },
      size: { type: String, reflect: true },
      tooltipClearKeywords: { type: String, reflect: true },
      tooltipSearchButtonOpen: { type: String, reflect: true },
      tooltipStartSearch: { type: String, reflect: true },
      noautoclose: { type: Boolean, reflect: true },
      value: { type: String, reflect: true },
      _doHideSearchfieldBox: { state: true },
      _isActive: { state: true },
    };
  }

  constructor() {
    super();

    this.ariaLabelClearKeywords = '';
    this.ariaLabelSearchButtonOpen = '';
    this.ariaLabelStartSearch = '';
    this.ariaLabelSearchBox = DEFAULT_ARIA_LABEL_SEARCH_BOX;
    this.ariaLabelInputDescription = DEFAULT_ARIA_DESCRIPTION_INPUT_FIELD;
    this.ariaLabelInputField = DEFAULT_ARIA_LABEL_INPUT_FIELD;
    this.expanded = false;
    this.headerItem = false;
    this.iconAppearance = '';
    this.labelText = SEARCH_PLACEHOLDER;
    this.measure = false;
    this.searchPlaceholder = SEARCH_PLACEHOLDER;
    this.size = 'lg';
    this.tooltipSearchButtonOpen = '';
    this.tooltipClearKeywords = '';
    this.tooltipSearchButtonOpen = '';
    this.tooltipStartSearch = '';
    this.noautoclose = false;
    this.value = '';
    this._doHideSearchfieldBox = !this.expanded;
    this._isActive = false;

    this._expandedMenu = false;
    this._focusinActive = true;
    this._initialRun = true;
    this._isAlwaysOpen = false;
    this._size = '';
  }

  // The expandedMenu state must be changed only with help of this function.
  // The tabindex of the surrogate must be also updated.
  _setExpandedMenuState(expandedMenu) {
    this._expandedMenu = expandedMenu;
    // adapt tabindex of surrogate to new state
    const searchMenuSurrogate = this._searchMenuSurrogate;
    Console.log(`otcSearchBase: _setExpandedMenuState: menu isOpen: ${this._expandedMenu}`);
    if (searchMenuSurrogate) {
      if (this._expandedMenu) {
        searchMenuSurrogate.setAttribute('tabindex', '0');
      } else {
        searchMenuSurrogate.setAttribute('tabindex', '-1');
      }
    }
  }

  // asks the menu if an menu element is open
  _menuGetCurrentOpenState() {
    const menuElements = this._rootMenuItems;
    return menuElements.some(menuElem => menuElem.isOpen);
  }

  // sets on the menu element the new open state and updates tabindex of surrogate
  _menuSetCurrentOpenState(isMenuOpen) {
    this._setExpandedMenuState(isMenuOpen);

    const menuElements = this._rootMenuItems;
    menuElements.forEach((menuElem) => {
      if (menuElem.isOpen !== isMenuOpen) {
        if (menuElem.updateComplete) {
          menuElem.updateComplete.then(() => {
            menuElem.isOpen = isMenuOpen;
          });
        } else {
          menuElem.isOpen = isMenuOpen;
        }
      }
    });
  }

  _updateMenuOpenState(isMenuOpen) {
    // we don't want any surprises, get current isOpen state directly from menu
    const menuElements = this._rootMenuItems;
    if (menuElements) {
      const menuOpen = this._menuGetCurrentOpenState();
      if (this._expandedMenu !== menuOpen) {
        Console.log(`otcSearchBase: _updateMenuOpenState: investigated menu isOpen: ${menuOpen} (internal state: ${
          this._expandedMenu}), updating internal state with ${menuOpen}`);
        this._expandedMenu = menuOpen;
      }
    }
    Console.log(`otcSearchBase: _updateMenuOpenState: menu isOpen: ${isMenuOpen} (internal state: ${this._expandedMenu})`);
    if (this._expandedMenu !== isMenuOpen) {
      this._menuSetCurrentOpenState(isMenuOpen);
    }
  }

  _setFocusSearchInput() {
    if (this.expanded) {
      const searchTermInput = this._searchTermInput;
      if (searchTermInput) {
        searchTermInput.focus();
        Console.log('otcSearchBase: _setFocusSearchInput: Set focus to input field');
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

  // function to present the search field initially opened/closed without animations
  // this is used for measurement in headerbar
  setInitialState(expanded) {
    this._initialRun = true; // skip animations
    // set the flags to your needs
    this._doHideSearchfieldBox = !expanded;
    this.expanded = expanded; // change the state
    Console.log(`otcSearchBase: setInitialState: expanded: ${expanded},_initialRun: ${
      this._initialRun},_doHideSFBox: ${this._doHideSearchfieldBox}`);
    this.updateComplete.then(() => {
      this._initialRun = false;
      Console.log(`otcSearchBase: setInitialState: _initialRun is now: ${this._initialRun}`);
    });
  }

  _retriggerClick() {
    this.dispatchEvent(
      new Event('click'),
    );
  }

  // clicks on startSearch span/button
  _clickStartSearchButton() {
    if (this.expanded) {
      const startSearch = this.shadowRoot.querySelector('otc-button.ot-search__startsearch-button');
      startSearch.click();
    }
  }

  // get selection in searchWithin
  _optionsHandleWithin(element, options) {
    const searchOptions = options;
    // only searchWithin has currently otc-menucheckbox or otc-menuradio items
    if (element.tagName === 'OTC-MENUCHECKBOX' || element.tagName === 'OTC-MENURADIO') {
      if (element.checked) {
        searchOptions.searchWithin = searchOptions.searchWithin || [];
        const entry = {
          name: element.id, // deprecated, name always contains id
          itemid: element.id,
          checked: element.checked,
        };
        searchOptions.searchWithin.push(entry);
      }
    }
    return searchOptions;
  }

  _childrenWorker(parentElem, options, startLevel) {
    let searchOptions = options;
    if (parentElem.children && parentElem.children.length > 0) {
      for (const [i, elem] of Object.entries(parentElem.children)) {
        Console.log(`otcSearchBase: menu slot child (${startLevel}): tagName: ${elem.tagName}, id: ${elem.id}, arrpos: ${i}`);
        if (elem.tagName && elem.tagName.indexOf('MENU') >= 0 && !menuItemsToIgnore.includes(elem.tagName)) {
          searchOptions = this._optionsHandleWithin(elem, searchOptions);

          if (elem.children && elem.children.length > 0) {
            Console.log('otcSearchBase: recurse in _childrenWorker...');
            searchOptions = this._childrenWorker(elem, searchOptions, startLevel + 1);
          }
        }
      }
    }
    return searchOptions;
  }

  _slotWorker(slotElem, options, startLevel) {
    let searchOptions = options;
    if (slotElem) {
      const menuElements = slotElem.assignedElements({ flatten: true });
      for (const [i, element] of Object.entries(menuElements)) {
        Console.log(`otcSearchBase: menu slot (${startLevel}): tagName: ${element.tagName}, id: ${element.id}, arrpos: ${i}`);
        searchOptions = this._childrenWorker(element, searchOptions, startLevel + 1);
      }
    }
    return searchOptions;
  }

  get #searchOptionsDropdownSlot() {
    return this._partRefs.searchOptionsDropdownSlot.value;
  }

  get _rootMenuItems() {
    const menuElements = this.#searchOptionsDropdownSlot?.assignedElements({ flatten: true }) ?? [];
    return menuElements?.filter(e => e.tagName === 'OTC-MENU');
  }

  get _searchBox() {
    return this._partRefs.searchBox.value;
  }

  get _searchButton() {
    return this._partRefs.searchButton.value;
  }

  get _searchInputContainer() {
    return this._partRefs.searchInputContainer.value;
  }

  get _searchMenuSurrogate() {
    return this._partRefs.searchMenuSurrogate.value;
  }

  get _searchTermInput() {
    return this._partRefs.searchTermInput.value;
  }

  // retrieves the currently selected searchOptions
  _getCurrentSearchOptions() {
    const searchOptionsDropdownSlot = this.#searchOptionsDropdownSlot;
    if (searchOptionsDropdownSlot) {
      return this._slotWorker(searchOptionsDropdownSlot, {}, 0);
    }

    return {};
  }

  _getTextFromInputField() {
    let ret = '';
    const searchTermInput = this._searchTermInput;
    if (searchTermInput) {
      this.value = searchTermInput.value;
      ret = this.value;
    }
    return ret;
  }

  // Returns the actual value of the input text
  _setTextOfInputField(text) {
    const searchTermInput = this._searchTermInput;
    if (searchTermInput) {
      searchTermInput.value = text;
      this.value = searchTermInput.value;
    }
    return this.value;
  }

  _submitSearch() {
    Console.log('otcSearchBase: _submitSearch: Called...');
    const searchOptions = this._getCurrentSearchOptions();
    Console.log('otcSearchBase: _submitSearch: searchOptions: ', searchOptions);
    const searchString = this._getTextFromInputField();
    Console.log(`otcSearchBase: _submitSearch: searchString: '${searchString}'`);
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
        searchstring: searchString,
        message: 'Submit search',
      },
    });
    Console.log('otcSearchBase: sending "search" customEvent: ', searchEvent);
    this.dispatchEvent(searchEvent);
  }

  _closeOptionsMenu() {
    if (this.expanded && this._expandedMenu) {
      const menuElements = this._rootMenuItems;
      menuElements.forEach((element) => {
        Console.log('otcSearchBase: _closeOptionsMenu: Setting isOpen=false for otc-menu: ', element);
        if (element.isOpen) {
          if (element.updateComplete) {
            element.updateComplete.then(() => {
              element.isOpen = false;
            });
          } else {
            element.isOpen = false;
          }
        }
        this._setExpandedMenuState(false);
      });
    }
  }

  _toggleHideFormfields(doHide) {
    const inputActionsElem = this.shadowRoot.querySelector(`.ot-search .ot-search__input-field-actions-${this._size}`);
    if (inputActionsElem) {
      Console.log(`otcSearchBase: _toggleHideFormFields called. doHide: ${doHide}`);
      if (doHide) {
        inputActionsElem.classList.remove(`ot-search__input-field-actions-${this._size}--actions-shown`);
        inputActionsElem.classList.add('ot--is-hidden');
      } else {
        inputActionsElem.classList.add(`ot-search__input-field-actions-${this._size}--actions-shown`);
        inputActionsElem.classList.remove('ot--is-hidden');
      }
    }
  }

  // public function for clearing search term
  clearSearchTerm() {
    if (this._searchTermInput) {
      this._setTextOfInputField('');
      this._toggleHideFormfields(true);
    }
  }

  _clickFormfieldClear() {
    Console.log('otcSearchBase: FormfieldClear called...');
    // set active
    this._isActive = true;

    this.clearSearchTerm();
    this._triggerInputEvent();
    this.triggerChangeEvent();

    // set focus to search input field
    this._setFocusSearchInput();
    // open menu
    this._toggleMenu(true);
  }

  _clickFormfieldSearch() {
    // set Active
    this._isActive = true;

    this._submitSearch();
    // set focus to search input field
    this._setFocusSearchInput();
  }

  _getAriaSearchButtonOpen() {
    return this.ariaLabelSearchButtonOpen.length > 0 ? this.ariaLabelSearchButtonOpen : undefined;
  }

  _createTabEvent(shiftPressed) {
    const tabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      code: 'Tab',
      keyCode: 0x09,
      shiftKey: shiftPressed,
      location: KeyboardEvent.DOM_KEY_LOCATION_STANDARD,
      bubbles: true,
      cancelable: true,
      composed: true,
    });
    return tabEvent;
  }

  _initMenuSurrogate() {
    // add listeners to handle focus for menu
    const searchMenuSurrogate = this._searchMenuSurrogate;
    if (searchMenuSurrogate) {
      searchMenuSurrogate.addEventListener('focusin', (event) => {
        Console.log('otcSearchBase: menuSurrogate: got "focusin" event...');
        if (this._focusinActive && this._expandedMenu) {
          // Focus the first menu item
          const element = this._rootMenuItems.at(0);
          if (element) {
            Console.log('otcSearchBase: menuSurrogate: focusFirstItem');
            this._focusinActive = false;
            // prevent browser to process event further
            event.preventDefault();
            FocusUtilities.focusFirstItem(Array.from(element.children));
          }
        }
      });
      // the "localfocus" event is only triggered from the menu
      searchMenuSurrogate.addEventListener('localfocus', (event) => {
        Console.log(`otcSearchBase: menuSurrogate: got "localfocus" event... (direction: ${
          event.detail ? event.detail.direction : 'undefined'})`);
        searchMenuSurrogate.focus();
        // event from menu
        switch (event.detail.direction) {
          case 'forward':
          case 'backward':
            Console.log('otcSearchBase: menuSurrogate: got "localfocus" in surrogate, dispatching orgevent...');
            this._focusinActive = false;
            searchMenuSurrogate.dispatchEvent(event.detail.orgevent);
            break;
        }
      });
    }
  }

  _handleSearchOptionsDropdownSlotChange() {
    // add listener to otc-menu
    const searchMenuSurrogate = this._searchMenuSurrogate;
    const menuElements = this._rootMenuItems;

    menuElements.every((element) => {
      element.addEventListener('keydown', (event) => {
        switch (event.key) {
          case 'Tab': {
            // tell surrogate that Tab was pressed in menu
            const focusedElement = document.activeElement;
            if (element.contains(focusedElement)) {
              // inform surrogate
              Console.log('otcSearchBase: menuTab: Sending "localfocus" to surrogate...');
              searchMenuSurrogate.dispatchEvent(
                new CustomEvent('localfocus', {
                  bubbles: true,
                  detail: {
                    direction: event.shiftKey ? 'backward' : 'forward',
                    orgevent: this._createTabEvent(event.shiftKey),
                  },
                }),
              );
            }
            break;
          }
        }
      });
      return true;
    });

    // if menu is added later, the correct open state must be reflected
    if (this._expandedMenu === true) {
      const menuOpen = this._menuGetCurrentOpenState();
      if (this._expandedMenu !== menuOpen) {
        Console.log('otcSearchBase: _handleSearchOptionsDropdownSlotChange: The internal and the actual menu open state differ, '
        + `new state is menuOpen: ${this._expandedMenu}`);
        this._menuSetCurrentOpenState(this._expandedMenu);
      }
    }
  }

  _onChange(event) {
    this.value = event.target.value || '';
    this.triggerChangeEvent();
  }

  _onInput(event) {
    this.value = event.target.value || '';
  }

  /**
  * Triggers a 'change' event by calling dispatchEvent, where 'bubbles' is set true
  *
  * @param detail
  */
  triggerChangeEvent(detail = null) {
    this.dispatchEvent(
      new CustomEvent('change', {
        detail,
        bubbles: true,
      }),
    );
  }

  /**
   * Triggers an 'input' event by calling dispatchEvent, where 'bubbles' is set true.
   * This is necessary for sending an 'input' event when the value is changed programmatically.
   *
   * @param detail
   */
  _triggerInputEvent(detail = null) {
    const event = new InputEvent('input', {
      bubbles: true,
      cancelable: false,
      detail,
    });
    event.value = this._searchTermInput.value;
    this.dispatchEvent(event);
  }

  // ----------------------------- functions having isAlwaysOpen code -------------

  /**
   * Updates the alwaysOpen search field to the given state.
   * @param {Boolean} isActive - if persistent search field is currently in active state
   */
  _updateAlwaysOpenField(isActive) {
    if (this._isAlwaysOpen) {
      throw new Error(`otcSearchBase: _updateAlwaysOpenField is not implemented, although "isAlwaysOpen" is true (isActive: ${isActive})!`);
    }
  }

  // functions defined by each WC:
  // _clickCloseSearch
  // connectedCallback
  // disconnectedCallback
  // firstUpdated
  // _setInitialStates
  // render
  // _handleOutsideClick
  // _getFieldButtonsIconsAppearance
}

export { MENU_EVENT_TIMEOUT, SearchBase, formfieldCloseIcon, formfieldSearchIcon };
//# sourceMappingURL=search-base.js.map
