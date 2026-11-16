import { html } from 'lit';
import commonStyleSheet from '../../styles/common.scss.js';
import headerStyleSheet from './otcHeaderbar.scss.js';
import { ElementBase } from '../element-base.js';
import { debounce, getViewportWidth } from '../../utilities/common-utilities.js';
import { Console } from '../../utilities/logging-utilities.js';
import { DomLocation } from './dom-location.js';
import { makeQueryablePromise, ElemType, hasNonEmptyBrandTexts, showBrandLogo, showPrimaryText, showSecondaryText, showVersionText, showBrandDivider, hideWholeBrand, resizeResponsive } from './brand-resize.js';
import { FocusUtilities } from '../../utilities/focus-utilities.js';
import { createRef as e, ref as n } from '../../../node_modules/lit-html/directives/ref.js';
import { classMap as e$1 } from '../../../node_modules/lit-html/directives/class-map.js';

const RenderStates = {
  RENDER_STATE_INITIAL: 'SearchfieldInitial',
  RENDER_STATE_SEARCHFIELD_SHRANK: 'SearchfieldShrank',
  RENDER_STATE_SEARCHFIELD_EXPANDED: 'SearchfieldExpanded',
};

const OTC_SEARCH_FIELD1_TAG_NAME = 'OTC-SEARCH-FIELD';
const CLASS_OT_SEARCH_FIELD1_CONTAINER = '.ot-searchfield__container';

const OTC_SEARCH_SLIDEIN_TAG_NAME = 'OTC-SEARCH-SLIDEIN';
const OTC_SEARCH_PERSISTENT_TAG_NAME = 'OTC-SEARCH-PERSISTENT';
// query in search
const CLASS_OT_SEARCH_CONTAINER = '.ot-search__container';

// the distance of the action items in righttoolbar; must be in sync with "gap" in .ot-header__actions
const HEADER_DISTANCE_ACTION_ITEMS = 24;

// the width beneath we switch to the stacked mode
const OTC_HEADER_STACKED_MODE_WIDTH = 640;

// ------------------------------------ helper functions ------------------------------------
function _getElementProportions(element) {
  const elemClientRect = element.getBoundingClientRect();
  const proportions = {};
  proportions.width = Math.ceil(elemClientRect.width);
  proportions.height = Math.ceil(elemClientRect.height);
  return proportions;
}

function _appendSizeData(sizeData, elemType, parentElem, selector, propName) {
  let currElem = parentElem;
  if (selector) {
    currElem = parentElem.querySelector(selector);
    if (!currElem) {
      Console.warn(`otcHeaderbar: _appendSizeData: The selector '${selector}' with parentElem '${parentElem.tagName}' returned null,
        skipping measuring!`);
      return sizeData;
    }
    Console.debug(`otcHeaderbar: _appendSizeData: Using selector '${selector}', currElem is '${currElem.tagName}'`);
  }
  const brandProportions = _getElementProportions(currElem);
  sizeData[elemType].size = sizeData[elemType].size || {};
  sizeData[elemType].size[propName] = brandProportions;
  Console.log(`otcHeaderbar: _appendSizeData: '${propName}' => width ${sizeData[elemType].size[propName].width} x height ${
    sizeData[elemType].size[propName].height}`);

  return sizeData;
}

function _getPixelsFromStyle(elemStyle, valueName) {
  // Distance units always end with "px"; cut it and convert it
  const orgVal = elemStyle.getPropertyValue(valueName);
  return +orgVal.substring(0, orgVal.lastIndexOf('px'));
}

// ---------------------------------- end helper functions ----------------------------------

/**
 * The Header Bar component is a common horizontal element which is placed at the top of a page. It includes page action buttons such as
 * profile, search field etc., and might provide access to a page menu.
 * The Header Bar supports a Search Field as its member, such as `otc-search-slidein` or `otc-search-persistent`.
 * @prop {string} ariaLabel The aria-label of the enclosing header tag.
 * @prop {boolean} measure Enables special mode for measuring the size of the web component.
 * @prop {boolean} stacked Defines whether the Header Bar is rendered in stacked mode. This is a read-only property. This property
 * is changed based on internal states like predefined screen width and other settings and should only be used for informational
 * purposes. Changing this property with a not fitting screen width does not render the header correctly in `stacked` mode.
 * @prop {boolean} transparent Defines whether the Header Bar is in transparent state.  The elements of the Header Bar use a transparent
 * background, including the buttons.
 * @cssprop [--ot-header-hamburger-gap=24px] The gap between the hamburger menu and the brand.
 * @slot hamburger Defines an optional hamburger menu. **Note:** It is strongly recommended that you only use one `otc-button` element
 * in order to preserve the intended design.
 * @slot rightToolbar Defines the right toolbar. **Note:** It is strongly recommended that you only use `otc-button` elements in order to
 * preserve the intended design.
 * @slot brand Defines the brand. **Note:** It is strongly recommended that you only use an `otc-brand` element in order to preserve the
 * intended design.
 * @slot unnamed Defines further content of the Header Bar.
 */
class OtcHeaderbar extends ElementBase {
  #measureFailed = undefined;

  #measureSuccess = undefined;

  #resizeObserver = new ResizeObserver(this.#handleResize.bind(this));

  #expandedSearchfieldObserver = new MutationObserver(this.#handleSearchfieldExpanded.bind(this));

  /**
   * A promise that resolves when this component and its child search field have finished rendering.
   * @internal
   */
  measureComplete = undefined;

  #shadowRefs = {
    brandSlot: e(),
    rightToolbarSlot: e(),
    hamburgerSlot: e(),
    headerEndSlot: e(),
    defaultSlot: e(),
  };

  static get styles() {
    return [
      commonStyleSheet,
      headerStyleSheet,
    ];
  }

  static get properties() {
    return {
      ariaLabel: {
        type: String,
        reflect: true,
      },
      measure: {
        type: Boolean,
        reflect: true,
      },
      stacked: {
        type: Boolean,
        reflect: true,
      },
      transparent: {
        type: Boolean,
        reflect: true,
      },
      _renderOffscreenState: {
        state: true,
      },
      _oneLine: {
        state: true,
      },
      _slotChangeHandler: {
        state: true,
      },
    };
  }

  constructor() {
    super();
    this.ariaLabel = 'Application header';
    this.measure = false;
    this.stacked = false;
    this.transparent = false;

    this._boundResizeHandler = this.#handleResize.bind(this);
    // We need a fast slotChange handling since it runs concurrently with the stacked/resize handler.
    // If we switch from stacked to non-stacked mode the slotChange handler is enabled again and the
    // non-stacked handling is already processed. This will introduce a flickering in an expanded searchfield
    // if it takes too long.
    this._boundUpdateSlotted = this._updateSlotted.bind(this);
    this._debouncedSlottedHandler = debounce(this._boundUpdateSlotted, 10);
    this._disabledSlottedHandler = (evt) => {
      Console.log('otcHeaderbar: _slotChangeHandler: is still disabled...');
      evt.preventDefault();
    };
    this._slotChangeHandler = this._debouncedSlottedHandler;
    this._brandEl = undefined;
    this._overflowContainerEl = undefined;
    this._searchfieldEl = undefined;
    this._renderOffscreenState = RenderStates.RENDER_STATE_INITIAL;
    this._initialSearchfieldExpanded = false;
    this._searchfieldTagName = OTC_SEARCH_SLIDEIN_TAG_NAME;
    this._searchfieldDomLocation = new DomLocation();
    this._oneLine = false;
    this._previousStacked = this.stacked;
    this._previousSearchfield = undefined;
    this._measureInProgress = false; // Internal flag, to signal if a measurement is already in progress
    this._measureOnceMore = false; // Internal flag, to signal that an additional measurement is necessary

    this._resetMeasureVariables();
  }

  _resetMeasureVariables() {
    Console.log('otcHeaderbar: _resetMeasureVariables: clear measure variables');
    // clear variables and states
    this._measureComplete = false;
    this._sizeData = undefined;
    if (this._searchfieldEl) {
      this._searchfieldEl.removeEventListener('click', this._boundResizeHandler);
      this._searchfieldEl.removeEventListener('close', this._boundResizeHandler);
    }

    this.measureComplete = makeQueryablePromise(
      new Promise((resolve, reject) => {
        this.#measureSuccess = resolve;
        this.#measureFailed = reject;
      }),
    );
  }

  async measureHeaderBar() {
    Console.log(`otcHeaderbar: measureHeaderBar: entering... (measureInProgress: ${
      this._measureInProgress}, measureOnceMore: ${this._measureOnceMore})`);
    if (this._measureInProgress) {
      this._measureOnceMore = true;
    } else {
      this._measureInProgress = true;

      this._resetMeasureVariables();

      await this.doMeasureHeaderBar();
      // install on searchfield click handler(s)
      if (this._searchfieldEl) {
        this._searchfieldEl.addEventListener('click', this._boundResizeHandler);
        this._searchfieldEl.addEventListener('close', this._boundResizeHandler);
      }

      if (this._measureOnceMore) {
        setTimeout(() => {
          this._measureInProgress = false;
          this._measureOnceMore = false;
          Console.log('otcHeaderbar: measureHeaderBar: Performing measure once more');
          this.measureHeaderBar();
        }, 10);
      } else {
        // set measurement to finished
        // resolve the promise
        this.#measureSuccess();
        await this.measureComplete;
        // restore the slotChange handler
        this._slotChangeHandler = this._debouncedSlottedHandler;
        this._measureComplete = true;

        // execute resize with already resolved promise to hide brand parts
        this._boundResizeHandler();

        this._measureInProgress = false;
        Console.log('otcHeaderbar: measureHeaderBar: leaving...');
      }
    }
  }

  /**
   * Measures asynchronously the Header Bar.
   */
  async doMeasureHeaderBar() {
    // prevent slotChange events in the measurement context by disabling the handler
    this._slotChangeHandler = this._disabledSlottedHandler;

    await this._waitForOffscreenRendering();

    // clear offscreen render flags and trigger render of initial headerbar
    this._changeRenderOffscreenState(RenderStates.RENDER_STATE_INITIAL);
    Promise.allSettled([this.updateComplete, this._searchfieldEl?.updateComplete,
      this._overflowContainerEl?.updateComplete]).then(() => {
      // get actual (finally rendered) size of action elements (because of otc-overflow-container)
      this._sizeData = this._measureActionElements(this._sizeData);

      Console.log('otcHeaderbar: measureHeaderBar: new _sizeData: ', this._sizeData);
    });
  }

  /**
   * Returns a promise which is resolved when all slot elements of the header bar and the header bar
   * itself has resolved updateComplete promise.
   * @returns {Promise}
   * @internal
  */
  allSlotElementsUpdated() {
    const allSlotElements = this.allElements;
    const allElementsPromises = [];

    Console.log('otcHeaderbar: _allSlotElementsUpdated: Getting all slot element updateComplete promises...');
    if (allSlotElements.length > 0) {
      allSlotElements.forEach((element) => {
        // Save the updateComplete promise so we can wait for them to be resolved later.
        allElementsPromises.push(element.updateComplete);
      });

      // Return a promise that combines the `updateComplete` promises of the header bar and every
      // slot element that is in the header bar.
      return Promise.all([...allElementsPromises, this.updateComplete]);
    }
    return Promise.resolve();
  }

  // This is called with slotChange and also with contents-changed event to perform a re-measure.
  _updateSlotted() {
    // the slot and all other elements in the event parameter are not set, so we cannot get e.g. the source slot
    // from the event
    if (this.stacked) {
      Console.log('otcHeaderbar: _updateSlotted: ignoring slotChange event in "stacked" mode');
      return;
    }

    // request measure
    this.measureHeaderBar();
  }

  _measureHamburgerElements(sizeData, otcHeaderbarEl) {
    sizeData[ElemType.TYPE_HAMBURGER] = {};

    // get the whole hamburger slot which includes the margins for the hamburger menu
    _appendSizeData(sizeData, ElemType.TYPE_HAMBURGER, otcHeaderbarEl.shadowRoot, '.ot-header__hamburger', 'wholeHamburger');
    return sizeData;
  }

  _measureBrandElements(sizeData, otcHeaderbarEl) {
    let brandLightElem;
    let validCnt = 0;
    sizeData[ElemType.TYPE_BRAND] = {};

    // the wholeBrand is the whole slot which includes the margins for the brand
    _appendSizeData(sizeData, ElemType.TYPE_BRAND, otcHeaderbarEl.shadowRoot, '.ot-header__brand', 'wholeBrand');

    const brandItems = this._getSlotContent(this._slotBrand, 'OTC-BRAND');
    if (brandItems.length > 0) {
      sizeData[ElemType.TYPE_OTCBRAND] = {};

      // the otcBrand holds the brand components and the spacing between them
      _appendSizeData(sizeData, ElemType.TYPE_OTCBRAND, otcHeaderbarEl, 'otc-brand', 'otcBrand');

      [brandLightElem] = brandItems; // get first elem in brandItems
      const isHeaderBrandHidden = otcHeaderbarEl.shadowRoot.querySelector('.ot-header__brand').style.display === 'none';

      sizeData[ElemType.TYPE_OTCBRAND].hideVersionText = brandLightElem.hideVersionText;
      sizeData[ElemType.TYPE_OTCBRAND].hideSecondaryText = brandLightElem.hideSecondaryText;
      sizeData[ElemType.TYPE_OTCBRAND].hidePrimaryText = brandLightElem.hidePrimaryText;
      sizeData[ElemType.TYPE_OTCBRAND].hideLogo = isHeaderBrandHidden;

      // test if any text is allowed to be shown
      sizeData[ElemType.TYPE_OTCBRAND].brandTextExists = (!sizeData[ElemType.TYPE_OTCBRAND].hidePrimaryText
        || !sizeData[ElemType.TYPE_OTCBRAND].hideSecondaryText
        || !sizeData[ElemType.TYPE_OTCBRAND].hideVersionText);

      const brandElem = brandLightElem.shadowRoot;
      sizeData[ElemType.TYPE_BRAND].sum = {};
      // logo currently always exists and cannot be skipped
      _appendSizeData(sizeData, ElemType.TYPE_BRAND, brandElem, '.ot-brand__logo', 'logo');
      validCnt += 1;
      sizeData[ElemType.TYPE_BRAND].sum.width = sizeData[ElemType.TYPE_BRAND].size.logo.width;
      sizeData[ElemType.TYPE_BRAND].sum.height = sizeData[ElemType.TYPE_BRAND].size.logo.height;

      if (!sizeData[ElemType.TYPE_OTCBRAND].hidePrimaryText) {
        sizeData[ElemType.TYPE_OTCBRAND].primaryText = brandLightElem.primaryText;
        _appendSizeData(sizeData, ElemType.TYPE_BRAND, brandElem, '.ot-brand__primary', 'primaryText');
        validCnt += 1;
        sizeData[ElemType.TYPE_BRAND].sum.width += sizeData[ElemType.TYPE_BRAND].size.primaryText.width;
        sizeData[ElemType.TYPE_BRAND].sum.height = Math.max(
          sizeData[ElemType.TYPE_BRAND].sum.height,
          sizeData[ElemType.TYPE_BRAND].size.primaryText.height,
        );
      } else {
        sizeData[ElemType.TYPE_BRAND].size.primaryText = { width: 0, height: 0 };
      }
      if (!sizeData[ElemType.TYPE_OTCBRAND].hideSecondaryText) {
        sizeData[ElemType.TYPE_OTCBRAND].secondaryText = brandLightElem.secondaryText;
        _appendSizeData(sizeData, ElemType.TYPE_BRAND, brandElem, '.ot-brand__secondary', 'secondaryText');
        validCnt += 1;
        sizeData[ElemType.TYPE_BRAND].sum.width += sizeData[ElemType.TYPE_BRAND].size.secondaryText.width;
        sizeData[ElemType.TYPE_BRAND].sum.height = Math.max(
          sizeData[ElemType.TYPE_BRAND].sum.height,
          sizeData[ElemType.TYPE_BRAND].size.secondaryText.height,
        );
      } else {
        sizeData[ElemType.TYPE_BRAND].size.secondaryText = { width: 0, height: 0 };
      }
      if (!sizeData[ElemType.TYPE_OTCBRAND].hideVersionText) {
        sizeData[ElemType.TYPE_OTCBRAND].versionText = brandLightElem.versionText;
        _appendSizeData(sizeData, ElemType.TYPE_BRAND, brandElem, '.ot-brand__version', 'versionText');
        validCnt += 1;
        sizeData[ElemType.TYPE_BRAND].sum.width += sizeData[ElemType.TYPE_BRAND].size.versionText.width;
        sizeData[ElemType.TYPE_BRAND].sum.height = Math.max(
          sizeData[ElemType.TYPE_BRAND].sum.height,
          sizeData[ElemType.TYPE_BRAND].size.versionText.height,
        );
      } else {
        sizeData[ElemType.TYPE_BRAND].size.versionText = { width: 0, height: 0 };
      }

      if (hasNonEmptyBrandTexts(sizeData)) {
        _appendSizeData(sizeData, ElemType.TYPE_BRAND, brandElem, '.ot-brand__divider', 'brandDivider');
        validCnt += 1;
        sizeData[ElemType.TYPE_BRAND].sum.width += sizeData[ElemType.TYPE_BRAND].size.brandDivider.width;
        sizeData[ElemType.TYPE_BRAND].sum.height = Math.max(
          sizeData[ElemType.TYPE_BRAND].sum.height,
          sizeData[ElemType.TYPE_BRAND].size.brandDivider.height,
        );
      } else {
        sizeData[ElemType.TYPE_BRAND].size.brandDivider = { width: 0, height: 0 };
      }

      if (validCnt > 0) {
        sizeData[ElemType.TYPE_BRAND].sum.averageBrandSpacing = {};
        // Average spacing: -El-El-El-El- => needed spacing: count El + 1
        sizeData[ElemType.TYPE_BRAND].sum.averageBrandSpacing.width = (sizeData[ElemType.TYPE_OTCBRAND].size.otcBrand.width
          - sizeData[ElemType.TYPE_BRAND].sum.width) / (validCnt + 1);
        sizeData[ElemType.TYPE_BRAND].sum.averageBrandSpacing.height = sizeData[ElemType.TYPE_BRAND].sum.height;
      }
    }
    return sizeData;
  }

  _measureActionElements(sizeData) {
    const actionItems = this._getSlotContent(this._slotRightToolbar);
    let cntNotShownItems = 0;
    if (!sizeData[ElemType.TYPE_ACTIONS]) {
      sizeData[ElemType.TYPE_ACTIONS] = {};
      sizeData[ElemType.TYPE_ACTIONS].sum = {
        height: 0,
        width: 0,
      };
    }

    for (let i = 0; i < actionItems.length; i += 1) {
      const actionItem = actionItems[i];
      const tagName = (actionItem.tagName && actionItem.tagName.toUpperCase()) || '';
      switch (tagName) {
        case 'OTC-BUTTON':
        case 'OTC-LINK':
        case 'OTC-TOOLBARITEM':
        case 'OTC-PROGRESS-ICON':
        case 'OTC-AVATAR':
          {
            Console.log(`otcHeaderbar: _measureActionElements: element label: '${actionItem.ariaLabel}'`);
            const localSizeData = {};
            localSizeData[ElemType.TYPE_ACTIONS] = {};
            _appendSizeData(localSizeData, ElemType.TYPE_ACTIONS, actionItem, null, 'actionObj');
            sizeData[ElemType.TYPE_ACTIONS].sum.width += localSizeData[ElemType.TYPE_ACTIONS].size.actionObj.width;
            sizeData[ElemType.TYPE_ACTIONS].sum.height = Math.max(
              sizeData[ElemType.TYPE_ACTIONS].sum.height,
              localSizeData[ElemType.TYPE_ACTIONS].size.actionObj.height,
            );

            // only otc-toolbaritem can be moved into overflow menu, consider this by distance calculation
            if (tagName === 'OTC-TOOLBARITEM' && actionItem.slot === 'otc-overflow-slot') {
              cntNotShownItems += 1;
            }
          }
          break;
        case 'OTC-SEARCH-FIELD':
        case 'OTC-SEARCH-SLIDEIN':
          // the shrank search field is measured in a separate function
          break;
        case 'OTC-SEARCH-PERSISTENT':
          // the persistent search field is always expanded, so silently ignore it here
          break;
        default:
          Console.warn(`otcHeaderbar: _measureActionElements: Detected not supported element type '${actionItem.tagName}'!`);
          break;
      }
    }
    // add the width of the distances based on count action items (n-1)
    if (actionItems.length > 1) {
      const distancesWidth = (actionItems.length - cntNotShownItems - 1) * HEADER_DISTANCE_ACTION_ITEMS;
      sizeData[ElemType.TYPE_ACTIONS].sum.width += distancesWidth;
      Console.log(`otcHeaderbar: _measureActionElements: _appendWidthData: 'actionDistances' => width ${distancesWidth}`);
    }

    return sizeData;
  }

  _measureSearchfieldShrank(sizeData) {
    const actionItems = this._getSlotContent(this._slotRightToolbar);
    if (!sizeData[ElemType.TYPE_ACTIONS]) {
      sizeData[ElemType.TYPE_ACTIONS] = {};
      sizeData[ElemType.TYPE_ACTIONS].sum = {
        height: 0,
        width: 0,
      };
    }

    for (let i = 0; i < actionItems.length; i += 1) {
      const actionItem = actionItems[i];
      const tagName = (actionItem.tagName && actionItem.tagName.toUpperCase()) || '';
      switch (tagName) {
        case 'OTC-SEARCH-FIELD':
        case 'OTC-SEARCH-SLIDEIN':
          {
            // a headerbar must not have a searchfield, so this case may not be called
            // the shrank searchfield (= just button) will be stored in internal structure
            const sfEl = actionItem.shadowRoot;
            // expanded searchfield is measured in another function
            if (actionItem.expanded === false) {
              const localSizeData = {};
              localSizeData[ElemType.TYPE_ACTIONS] = {};
              // get sizeData of search button
              _appendSizeData(localSizeData, ElemType.TYPE_ACTIONS, sfEl, 'otc-button[headeritem]', 'button_searchfield');
              sizeData[ElemType.TYPE_ACTIONS].sum.searchfieldShrank = localSizeData[ElemType.TYPE_ACTIONS].size.button_searchfield;
            }
          }
          break;
        case 'OTC-SEARCH-PERSISTENT':
          // the persistent search field is always expanded, nothing to do here
          break;
        default:
          Console.log(`otcHeaderbar: _measureSearchfieldShrank: Skip non search field element type '${actionItem.tagName}'.`);
          break;
      }
    }
    return sizeData;
  }

  // updates sizeData with expanded searchfield data, if searchfield is available
  _measureSearchfieldExpanded(sizeData) {
    if (!sizeData[ElemType.TYPE_ACTIONS]) {
      throw new Error('otcHeaderbar: _measureSearchfieldExpanded: The sizeData does not contain any ACTIONS entries,'
        + ' so they cannot be extended!');
    }

    // a headerbar must not have a searchfield
    if (this._searchfieldEl?.expanded) {
      // get sizeData of searchfield from expanded searchfield (search button was already
      // added in shrank state)
      const localSizeData = {};
      localSizeData[ElemType.TYPE_ACTIONS] = {};
      // In new search the search button is hidden in expanded mode and only the search is displayed,
      // the selector below does consider this. In the v1 searchfield the search button is also displayed,
      // so we have to use the correct selector.
      const selectorSearchContainer = (this._searchfieldTagName === OTC_SEARCH_FIELD1_TAG_NAME)
        ? CLASS_OT_SEARCH_FIELD1_CONTAINER : CLASS_OT_SEARCH_CONTAINER;
      _appendSizeData(
        localSizeData,
        ElemType.TYPE_ACTIONS,
        this._searchfieldEl.shadowRoot,
        selectorSearchContainer,
        'searchfield',
      );
      sizeData[ElemType.TYPE_ACTIONS].sum.searchfieldExpanded = localSizeData[ElemType.TYPE_ACTIONS].size.searchfield;
      Console.log(`otcHeaderbar: _measureActionElements: Only searchfield expanded size: width ${
        sizeData[ElemType.TYPE_ACTIONS].sum.searchfieldExpanded.width}px x height ${
        sizeData[ElemType.TYPE_ACTIONS].sum.searchfieldExpanded.height}px`);
    }
    return sizeData;
  }

  _changeRenderOffscreenState(newState) {
    Console.log('otcHeaderbar: _changeRenderOffscreenState: New state: ', newState);
    if (!this._searchfieldEl) return;
    switch (newState) {
      case RenderStates.RENDER_STATE_SEARCHFIELD_SHRANK:
        this.measure = true;
        this.considerMeasure(this.measure);
        this._searchfieldEl.setInitialState(false);
        break;
      case RenderStates.RENDER_STATE_SEARCHFIELD_EXPANDED:
        this.measure = true;
        this.considerMeasure(this.measure);
        this._searchfieldEl.setInitialState(true);
        break;
      default: // case RenderStates.RENDER_STATE_INITIAL:
        this.measure = false;
        this.considerMeasure(this.measure);
        this._searchfieldEl.setInitialState(this._initialSearchfieldExpanded);
        break;
    }
    this._renderOffscreenState = newState;
  }

  // tries to get one of our search fields from the given slot
  _getSearchfieldFromSlot(slot) {
    let searchfieldTagName = OTC_SEARCH_SLIDEIN_TAG_NAME;
    let searchfieldEl;
    [searchfieldEl] = this._getSlotContent(slot, searchfieldTagName);
    if (!searchfieldEl) {
      // try persistent
      searchfieldTagName = OTC_SEARCH_PERSISTENT_TAG_NAME;
      [searchfieldEl] = this._getSlotContent(slot, searchfieldTagName);
      if (!searchfieldEl) {
        // try old v1 searchfield
        searchfieldTagName = OTC_SEARCH_FIELD1_TAG_NAME;
        [searchfieldEl] = this._getSlotContent(slot, searchfieldTagName);
      }
    }
    return {
      searchfieldTagName,
      searchfieldEl,
    };
  }

  async _waitForOffscreenRendering() {
    // get initial expanded state; a headerbar must not have a searchfield
    const result = this._getSearchfieldFromSlot(this._slotRightToolbar);
    this._searchfieldTagName = result.searchfieldTagName;
    this._searchfieldEl = result.searchfieldEl;

    Console.log(`otcHeaderbar: _waitForOffscreenRendering: this._searchfieldEl exists: ${
      (typeof this._searchfieldEl !== 'undefined')} (tag: ${this._searchfieldTagName})`);
    if (this._searchfieldEl) {
      // we need the shadow DOM of the searchfield
      await this._searchfieldEl.updateComplete;

      this._initialSearchfieldExpanded = !!this._searchfieldEl.expanded;
      Console.log(`otcHeaderbar: _waitForOffscreenRendering: initial searchfield expanded: ${this._initialSearchfieldExpanded}`);
      this._searchfieldDomLocation.slotName = this._searchfieldEl.slot;
      Console.log(`otcHeaderbar: _waitForOffscreenRendering: initial searchfield slotName: "${this._searchfieldDomLocation.slotName}"`);
      this._oneLine = this._checkOneLineEnough();
      Console.log(`otcHeaderbar: _waitForOffscreenRendering: initial just oneLine: ${this._oneLine}`);
    }

    // get possible overflow container
    const ocContainer = this._getOverflowContainerFromSlot(this._slotRightToolbar);
    if (ocContainer) {
      this._overflowContainerEl = ocContainer;
    }

    // render headerbar in shrank mode
    this._changeRenderOffscreenState(RenderStates.RENDER_STATE_SEARCHFIELD_SHRANK);
    await Promise.allSettled([this.updateComplete, this._searchfieldEl?.updateComplete, this._overflowContainerEl?.updateComplete]);
    let sizeData = {};
    sizeData = this._measureHamburgerElements(sizeData, this);

    // get possible brand
    [this._brandEl] = this._getSlotContent(this._slotBrand, 'OTC-BRAND');
    // show all brand parts which are specified for offscreen rendering (render takes already place in wide mode)
    if (this._brandEl) {
      const hasPrimaryText = !this._brandEl.hidePrimaryText && this._brandEl.primaryText.length > 0;
      const hasSecondaryText = !this._brandEl.hideSecondaryText && this._brandEl.secondaryText.length > 0;
      const hasVersionText = !this._brandEl.hideSecondaryText && this._brandEl.versionText.length > 0;
      const needsDivider = hasPrimaryText || hasSecondaryText || hasVersionText;
      showBrandLogo(this._brandEl, true);
      showPrimaryText(this._brandEl, hasPrimaryText);
      showSecondaryText(this._brandEl, hasSecondaryText);
      showVersionText(this._brandEl, hasVersionText);
      showBrandDivider(this._brandEl, needsDivider);
      this._brandEl.requestUpdate();

      await Promise.allSettled([this._brandEl.updateComplete, this._brandEl.imageComplete]);
      sizeData = this._measureBrandElements(sizeData, this);
    }

    // get size of header elements from offscreen-rendering
    // there may be no searchfield in headerbar
    if (this._searchfieldEl) {
      sizeData = this._measureSearchfieldShrank(sizeData);
      Console.log('otcHeaderbar: _waitForOffscreenRendering: _measureElements shrank result:', sizeData);

      // render headerbar in expanded mode
      this._changeRenderOffscreenState(RenderStates.RENDER_STATE_SEARCHFIELD_EXPANDED);
      // await this.updateComplete;
      await Promise.allSettled([this.updateComplete, this._searchfieldEl.updateComplete, this._overflowContainerEl?.updateComplete]);
      sizeData = this._measureSearchfieldExpanded(sizeData);
      Console.log('otcHeaderbar: _waitForOffscreenRendering: _measureElements expanded result:', sizeData);
    }
    // the this._sizeData may not be complete here due to the missing action elements
    this._sizeData = sizeData;
  }

  get _slotHamburger() {
    return this.shadowRoot.querySelector('slot[name=hamburger]');
  }

  get _slotBrand() {
    return this.shadowRoot.querySelector('slot[name=brand]');
  }

  get _slotRightToolbar() {
    return this.shadowRoot.querySelector('slot[name=rightToolbar]');
  }

  get _slotEnd() {
    return this.shadowRoot.querySelector('slot[name=headerEnd]');
  }

  get _searchfield() {
    return this.querySelector('otc-search-slidein') || this.querySelector('otc-search-persistent');
  }

  get #brandSlotElements() {
    return this.#shadowRefs.brandSlot.value?.assignedElements({ flatten: true });
  }

  get #rightToolbarSlotElements() {
    return this.#shadowRefs.rightToolbarSlot.value?.assignedElements({ flatten: true });
  }

  get #hamburgerSlotElements() {
    return this.#shadowRefs.hamburgerSlot.value?.assignedElements({ flatten: true });
  }

  get #headerEndSlotElements() {
    return this.#shadowRefs.headerEndSlot.value?.assignedElements({ flatten: true });
  }

  get #defaultSlotElements() {
    return this.#shadowRefs.defaultSlot.value?.assignedElements({ flatten: true });
  }

  /**
   * Get all elements, including slotted elements.
   * @returns {Array}
   * @internal
   */
  get allElements() {
    const elements = [];
    if (this.#hamburgerSlotElements) {
      elements.push(...this.#hamburgerSlotElements);
    }
    if (this.#brandSlotElements) {
      elements.push(...this.#brandSlotElements);
    }
    if (this.#rightToolbarSlotElements) {
      elements.push(...this.#rightToolbarSlotElements);
    }
    if (this.#defaultSlotElements) {
      elements.push(...this.#defaultSlotElements);
    }
    if (this.#headerEndSlotElements) {
      elements.push(...this.#headerEndSlotElements);
    }

    return elements;
  }

  // Tells the known children which support a "measure" property that we are in measure mode (e.g. skip open animations).
  considerMeasure(newValue) {
    const supportsMeasureProperty = ['OTC-SEARCH-SLIDEIN', 'OTC-SEARCH-PERSISTENT'];
    // array of known slots where elements to be measured can reside
    const knownSlots = [this._slotHamburger, this._slotBrand, this._slotRightToolbar, this._slotEnd];
    // Console.log(`otcHeaderbar: considerMeasure: got 'measure' property with value: ${newValue}`);

    // propagate the property to each measureable element in the known slots
    for (let n = 0; n < knownSlots.length; n += 1) {
      if (knownSlots[n]) {
        const slotElems = this._getSlotContent(knownSlots[n]);
        for (let i = 0; i < slotElems.length; i += 1) {
          const elem = slotElems[i];
          if (elem.tagName in supportsMeasureProperty) {
            elem.measure = !!newValue;
          }
        }
      }
    }
  }

  updated() {
    // check if search field was added/changed
    if (this._searchfield) {
      if (this._previousSearchfield !== this._searchfield) {
        if (this._previousSearchfield) {
          this.#expandedSearchfieldObserver.disconnect();
        }
        this._previousSearchfield = this._searchfield;
        // add observer
        Console.log('otcHeaderbar: updated: now observing searchfield');
        // Watch for changes in expanded flag.
        this.#expandedSearchfieldObserver.observe(this._searchfield, {
          attributeFilter: ['expanded'],
          attributeOldValue: true,
          subtree: false,
        });
      }
    }
  }

  /**
  * After the DOM has been updated the first time.
  *
  * @param changedProperties
  */
  async firstUpdated(changedProperties) {
    super.firstUpdated(changedProperties);

    // Normally we should get the expanded state of the searchfield here,
    // but the searchfield does not exist at this point of time. Its firstUpdated
    // function is called just after this firstUpdated function of the headerbar (= parent).

    Console.log('otcHeaderbar: firstUpdated: called');
    // this initial measurement does only cover all elements when every element is already in the DOM
    await this.measureHeaderBar();
  }

  // this function is used in stacked and normal context, including offscreen rendering
  #handleSearchfieldExpanded(mutationList) {
    mutationList.forEach((mutation) => {
      switch (mutation.type) {
        case 'attributes':
          switch (mutation.attributeName) {
            case 'expanded':
              Console.log(`otcHeaderbar: #handleSearchfieldExpanded: Searchfield is now expanded: ${mutation.target.expanded === true}`);
              if (this.stacked) {
                if (mutation.target.expanded === true) {
                  Console.log('otcHeaderbar: #handleSearchfieldExpanded: Searchfield switched to expanded, requesting update...');
                  this.requestUpdate(); // if removed, SF will stay expanded in first line
                } else {
                  Console.log('otcHeaderbar: #handleSearchfieldExpanded: Searchfield switched to collapsed, continuing after close evt...');
                  // ensure searchfield is fully closed first
                  this._searchfield.addEventListener('close', (evt) => {
                    const evtName = evt.target.nodeName.toUpperCase();
                    // skip menu close events
                    if (evtName === 'OTC-SEARCH-SLIDEIN' || evtName === 'OTC-SEARCH-PERSISTENT') {
                      Console.log('otcHeaderbar: #handleSearchfieldExpanded: Searchfield got close evt, requesting update...');
                      this.requestUpdate(); // if removed, SF will stay closed in second line
                    }
                  });
                }
              }
              break;
            default:
              Console.error(`otcHeaderbar: #handleSearchfieldExpanded: Got unhandled attribute '${mutation.attributeName}',
              please check the implementation!`);
              break;
          }
          break;
      }
    });
  }

  willUpdate(changedProperties) {
    super.willUpdate(changedProperties);

    if (this._measureComplete === true) {
      if (changedProperties.has('stacked')) {
        const prevStacked = changedProperties.get('stacked');
        if (!this.stacked && prevStacked === true) {
          // if we move from stacked back to one line then there should be initially no brand components
          // to give the search field the available space; later the headerbar resize handling takes over
          Console.log(`otcHeaderbar: updated: moved back from stacked to single line, initially hiding brand components.${
            !this.stacked ? ' ' : ''}Searchfield expanded: ${this._searchfield?.expanded}`);
          // hide all brand components
          hideWholeBrand(this);
        }
      }

      // we don't move the searchfield into second line in oneLine mode
      if (!this._oneLine) {
        Console.log(`otcHeaderbar: updated: multiline relocate searchfield, stacked: ${this.stacked}, expanded: ${
          this._searchfield?.expanded}`);
        this._relocateSearchfield(this.stacked);
      }
    }
  }

  #handleResize() {
    // initial check
    if (this._measureComplete !== true) {
      Console.log('otcHeaderbar: #handleResize: promise "measureComplete" is not fulfilled, skipping resize and stacked handling!');
      this.stacked = false;
      return;
    }

    // stacked
    if (this._measureComplete === true) {
      if (this._oneLine) {
        Console.log('otcHeaderbar: #handleResize: ignoring switching to stacked mode due to oneLine is "true".');
      } else {
        // use width of web component or alternativly viewport width, but in global header they are identical
        const headerProportions = _getElementProportions(this);

        const prevStacked = this.stacked;
        this.stacked = headerProportions.width < OTC_HEADER_STACKED_MODE_WIDTH;
        Console.log(`otcHeaderbar: #handleResize: headerWidth: ${headerProportions.width}, stacked: ${this.stacked}`);
        if (prevStacked !== this.stacked) {
          Console.log(`otcHeaderbar: #handleResize: headerWidth: ${headerProportions.width}, stacked: ${this.stacked} (was: ${
            prevStacked})`);
        }
      }
    }

    // resize
    if (this._measureComplete === true) {
      if (!this.stacked) {
        const brandElems = this._getSlotContent(this._slotBrand, 'OTC-BRAND');
        const [brandEl] = brandElems;

        // when whole measurement is already done, handle resize
        if (brandEl && this._sizeData) {
          Console.log('otcHeaderbar: #handleResize: check to modify something ...');

          const headerbarLightEl = this;
          // calc rest space
          const headerPadding = this._getHeaderPadding();
          const availWidth = this._getAvailableWidth(headerPadding);
          const mustHaveWidth = this._getMustHaveWidth(this._sizeData, headerPadding);
          const spaceForBrand = availWidth - mustHaveWidth;
          Console.log(
            `otcHeaderbar: #handleResize: availableWidth ${availWidth} px - mustHaveWidth ${mustHaveWidth} px`,
            `= spaceForBrand ${spaceForBrand}`,
          );

          // only if brand exists (measureBrand was called)
          if (this._sizeData[ElemType.TYPE_BRAND] && this._sizeData[ElemType.TYPE_BRAND].size.wholeBrand) {
            Console.log(`otcHeaderbar: #handleResize: wholeBrand.width ${this._sizeData[ElemType.TYPE_BRAND].size.wholeBrand.width}`);
            resizeResponsive(spaceForBrand, this._sizeData, headerbarLightEl, brandEl);
          }
        } else {
          Console.log('otcHeaderbar: #handleResize: this._sizeData or vital DOM-elements are (still) undefined, skipping!');
        }
      } else {
        Console.log('otcHeaderbar: #handleResize: in stacked context, hiding whole brand.');
        const brandElems = this._getSlotContent(this._slotBrand, 'OTC-BRAND');
        const [brandEl] = brandElems;

        // when whole measurement is already done, handle resize
        if (brandEl) {
          // hide all brand components
          // For changing the "stacked" flag, we do this also in willUpdate(), but if you just press
          // refresh we have to consider this also in resize handler
          hideWholeBrand(this);
        }
      }
    } else {
      Console.log('otcHeaderbar: #handleResize: skipped resize processing, measure not complete');
    }
  }

  /* Checks the parent and siblings of the search field to detect if it is alone.
   * If it is the only action item, the stacked mode can be skipped since it can use the whole existing line.
   */
  _checkOneLineEnough() {
    let retVal = false;
    const overflowEl = this.querySelector('otc-overflow-container');
    // if there is no other non-hidden focusable item in the slot, display it in the same row (slot)!
    // There are the cases:
    // a) only SF without overflow container
    // b) SF + empty overflow container
    // c) overflow container with just SF
    const relevantElements = {};
    const actionItems = this._slotRightToolbar.assignedElements({ flatten: false });
    actionItems.filter(e => !FocusUtilities.isHidden(e)).forEach((element) => {
      relevantElements[element.tagName] = element;
    });
    let hasOverflowItems = false;
    if (overflowEl) {
      const overflowItems = relevantElements['OTC-OVERFLOW-CONTAINER'].allElements;
      if ('OTC-OVERFLOW-CONTAINER' in relevantElements) {
        hasOverflowItems = overflowItems.some(e => !FocusUtilities.isHidden(e));
      }
    }
    const hasSearchfield = ('OTC-SEARCH-SLIDEIN' in relevantElements || 'OTC-SEARCH-PERSISTENT' in relevantElements);

    if (hasSearchfield && overflowEl && !hasOverflowItems) {
      // overflow container is empty
      retVal = true;
    } else if (hasSearchfield && !overflowEl && relevantElements.length === 1) {
      // only SF
      retVal = true;
    } else if ('OTC-OVERFLOW-CONTAINER' in relevantElements) {
      // the only element in overflow container must be SF
      if (hasOverflowItems) {
        let overflowItemCnt = 0;
        let foundSearchfield;
        const overflowItems = relevantElements['OTC-OVERFLOW-CONTAINER'].allElements;
        overflowItems.filter(e => !FocusUtilities.isHidden(e)).forEach((element) => {
          overflowItemCnt += 1;
          if (element.tagName === 'OTC-SEARCH-SLIDEIN' || element.tagName === 'OTC-SEARCH-PERSISTENT') {
            foundSearchfield = element;
          }
        });
        if (foundSearchfield && overflowItemCnt === 1) {
          retVal = true;
        }
      }
    }

    Console.log(`otcHeaderbar: _checkOneLineEnough: just one line needed: ${retVal}`);
    return retVal;
  }

  /* This helper function supports direct action items in the rightToolbar as well as the `otc-overflow-container`
   * in the rightToolbar.
   */
  _relocateSearchfield(isStacked) {
    const searchfield = this._searchfield;
    if (searchfield) {
      const overflowEl = this.querySelector('otc-overflow-container');
      // Console.log(`otcHeaderbar: _relocateSearchfield: isStacked: ${isStacked}, current slot: ${
      //   searchfield.slot}, initial slotName: ${this._searchfieldDomLocation.slotName}, expanded: ${searchfield.expanded}`);
      // force the relocated search field to be newly observed
      if (this._previousSearchfield) {
        this._previousSearchfield = undefined;
      }

      if (isStacked && searchfield.expanded) {
        if (searchfield.slot !== 'headerEnd') {
          // check if location of search field is directly in header bar or in overflow container
          if (searchfield.parentNode) {
            this._searchfieldDomLocation.parentNode = searchfield.parent;

            // assign to new position
            if (!overflowEl) { // if not rendered in overflow container
              searchfield.slot = 'headerEnd';
              Console.debug(`otcHeaderbar: _relocateSearchfield: searchfield: changed slot to "headerEnd" from "${
                this._searchfieldDomLocation.slotName}", requesting update...`);
              this.requestUpdate(); // consider changed slot name in render
            } else { // if in overflow container
              Console.debug('otcHeaderbar: _relocateSearchfield: moving searchfield to rightToolbar by changing parent');
              this._searchfieldDomLocation.nextSibling = searchfield.nextSibling;
              this.insertBefore(searchfield, overflowEl);
              searchfield.slot = 'headerEnd';
              Console.debug(`otcHeaderbar: _relocateSearchfield: searchfield: changed slot to "headerEnd" from "${
                this._searchfieldDomLocation.slotName}", requesting update...`);
              this.requestUpdate(); // consider changed slot name in render
            }
          }
        }
      } else if (this._searchfieldDomLocation.isInitialized === true && (searchfield.slot !== this._searchfieldDomLocation.slotName)) {
        // not stacked
        Console.log(`otcHeaderbar: _relocateSearchfield: current slot: ${searchfield.slot}, new slot: ${
          this._searchfieldDomLocation.slotName}`);
        // assign original slot again
        searchfield.slot = this._searchfieldDomLocation.slotName;

        if (overflowEl) {
          Console.debug('otcHeaderbar: _relocateSearchfield: Trying to append SF back to previous location...');
          if (this._searchfieldDomLocation.nextSibling !== undefined) {
            Console.debug('otcHeaderbar: _relocateSearchfield: inserting SF back to previous location');
            overflowEl.insertBefore(searchfield, this._searchfieldDomLocation.nextSibling);
          } else {
            Console.error('otcHeaderbar: _relocateSearchfield: nextSibling is undefined, unable to locate search'
            + ' field back to previous position!');
          }
        }

        Console.log(`otcHeaderbar: _relocateSearchfield: searchfield: changed slot to "${
          this._searchfieldDomLocation.slotName}", requesting update...`);
        this.requestUpdate(); // consider changed slot name in render
      }
    }
  }

  connectedCallback() {
    super.connectedCallback();
    // install a resize listener on global object
    this.#resizeObserver.observe(this);
    Console.info('otcHeaderbar: connectedCallback: resize handler added.');

    // Watch for changes in expanded flag.
    if (this._searchfield) {
      this._previousSearchfield = this._searchfield;
      this.#expandedSearchfieldObserver.observe(this._searchfield, {
        attributeFilter: ['expanded'],
        attributeOldValue: true,
        subtree: false,
      });
      Console.info('otcHeaderbar: connectedCallback: start observing searchfield.');
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // remove any handlers that were added in connectedCallback()
    this.#resizeObserver.disconnect();
    Console.info('otcHeaderbar: disconnectedCallback: resize handler removed.');

    if (this._previousSearchfield) {
      this.#expandedSearchfieldObserver.disconnect();
      this._previousSearchfield = undefined;
    }
  }

  _getAvailableWidth(parentPadding = undefined) {
    // viewport
    let vpWidth = getViewportWidth();
    if (parentPadding) {
      vpWidth = vpWidth - parentPadding.paddingRight - parentPadding.paddingLeft;
    }
    return vpWidth;
  }

  _getMustHaveWidth(sizeData, parentPadding = undefined) {
    const hamburgerWidth = sizeData[ElemType.TYPE_HAMBURGER].size.wholeHamburger.width;
    let rightToolbarWidth = sizeData[ElemType.TYPE_ACTIONS].sum.width;

    // consider in returned value the expanded/collapsed state, if searchfield is available
    if (this._searchfieldEl) {
      if (this._searchfieldEl.expanded) {
        rightToolbarWidth += sizeData[ElemType.TYPE_ACTIONS].sum.searchfieldExpanded.width;
        // In the v1 implementation we display also the search button beside the searchfield,
        // so the button width must be added.
        if (this._searchfieldTagName === OTC_SEARCH_FIELD1_TAG_NAME) {
          rightToolbarWidth += sizeData[ElemType.TYPE_ACTIONS].sum.searchfieldShrank.width;
        }
      } else {
        rightToolbarWidth += sizeData[ElemType.TYPE_ACTIONS].sum.searchfieldShrank.width;
      }
    }
    // consider possible unusable space in parent because of padding
    if (parentPadding) {
      rightToolbarWidth += parentPadding.paddingRight;
    }
    return rightToolbarWidth + hamburgerWidth;
  }

  // returns the overflow container (= the only existing element) from the slot
  _getOverflowContainerFromSlot(slot) {
    let overflowContainer;
    const slotItems = slot.assignedElements({ flatten: true });
    if (slotItems.length === 1 && slotItems?.at(0).tagName === 'OTC-OVERFLOW-CONTAINER') {
      overflowContainer = slotItems.at(0);
    }
    return overflowContainer;
  }

  // returns an array of found items or an empty array
  _getSlotContent(slot, tagNameInSlot = undefined) {
    let slotItems = slot.assignedElements({ flatten: true });
    if (slotItems.length === 1 && slotItems?.at(0).tagName === 'OTC-OVERFLOW-CONTAINER') {
      const overflowContainer = slotItems.at(0);
      let moreButton;
      // when is rendered, try to get moreButton
      if (overflowContainer.shadowRoot) {
        const ofButton = overflowContainer.shadowRoot.querySelector('otc-toolbaritem#otc-overflow-button');
        if (ofButton && ofButton.classList.contains('ot--is-hidden') === false) {
          moreButton = ofButton;
        }
      }

      slotItems = Array.from(slotItems.at(0).children);

      if (moreButton) {
        // add the displayed 3-dot button for measurement
        slotItems.push(moreButton);
      }
    }

    if (!tagNameInSlot) {
      return slotItems;
    }

    return slotItems.filter(slotItem => slotItem.tagName === tagNameInSlot);
  }

  // returns the current padding of the header element
  _getHeaderPadding() {
    const headerElem = this.shadowRoot.querySelector('header');
    const elemStyle = getComputedStyle(headerElem);

    const headerPadding = {};
    headerPadding.paddingLeft = _getPixelsFromStyle(elemStyle, 'padding-left');
    headerPadding.paddingRight = _getPixelsFromStyle(elemStyle, 'padding-right');
    headerPadding.paddingTop = _getPixelsFromStyle(elemStyle, 'padding-top');
    headerPadding.paddingBottom = _getPixelsFromStyle(elemStyle, 'padding-bottom');
    return headerPadding;
  }

  _contentsChangedHandler() {
    Console.log('otcHeaderbar: _contentsChangedHandler: Got "contents-changed" event.');
    this._boundUpdateSlotted();
  }

  _getHeaderBarTemplate() {
    const classes = {
      'ot-header--is-transparent': this.transparent,
      'ot-header--is-measure': this.measure,
    };
    return html`<header aria-label="${this.ariaLabel}" class="ot-header ${e$1(classes)}"><div class="ot-header__hamburger"><slot ${n(this.#shadowRefs.hamburgerSlot)} name="hamburger" @slotchange="${this._slotChangeHandler}"></slot></div><div class="ot-header__brand"><slot ${n(this.#shadowRefs.brandSlot)} name="brand" @slotchange="${this._slotChangeHandler}"></slot></div><div class="ot-header__actions ot-header__actions--max-size"><slot ${n(this.#shadowRefs.rightToolbarSlot)} name="rightToolbar" @slotchange="${this._slotChangeHandler}" @contents-changed="${this._contentsChangedHandler}"></slot></div></header><slot ${n(this.#shadowRefs.defaultSlot)}></slot>`;
  }

  _getEndSlot(oneLine, classesHeaderEnd) {
    if (oneLine) {
      // do not render additional row/slot
      return html``;
    }
    return html`<div class="${e$1(classesHeaderEnd)}"><slot ${n(this.#shadowRefs.headerEndSlot)} name="headerEnd" @slotchange="${this._slotChangeHandler}"></slot></div>`;
  }

  // render header stacked
  _getHeaderBarTemplateStacked(oneLine) {
    const classes = {
      'ot-header--is-transparent': this.transparent,
      'ot-header--is-stacked': this.stacked,
    };
    const classesHeaderEnd = {
      'ot-header__end': true,
      'ot-header__end--expanded': this._searchfield?.expanded,
    };
    return html`<header aria-label="${this.ariaLabel}" class="ot-header ${e$1(classes)}"><div class="ot-header__column"><div class="ot-header__stackedrow"><div class="ot-header__hamburger"><slot ${n(this.#shadowRefs.hamburgerSlot)} name="hamburger" @slotchange="${this._slotChangeHandler}"></slot></div><div class="ot-header__brand ot--is-hidden"><slot ${n(this.#shadowRefs.brandSlot)} name="brand" @slotchange="${this._slotChangeHandler}"></slot></div><div class="ot-header__actions ot-header__actions--max-size"><slot ${n(this.#shadowRefs.rightToolbarSlot)} name="rightToolbar" @slotchange="${this._slotChangeHandler}"></slot></div></div>${this._getEndSlot(oneLine, classesHeaderEnd)}</div></header><slot ${n(this.#shadowRefs.defaultSlot)}></slot>`;
  }

  render() {
    Console.log(`otcHeaderbar: render: requested template for renderState "${this._renderOffscreenState}"`);
    Console.log(`otcHeaderbar: render: should render stacked: "${this.stacked}", oneLine: "${this._oneLine}"`);
    if (this._renderOffscreenState === RenderStates.RENDER_STATE_SEARCHFIELD_SHRANK
      || this._renderOffscreenState === RenderStates.RENDER_STATE_SEARCHFIELD_EXPANDED) {
      return html`<div style="position:fixed;top:-1000px;min-width:1920px">${this._getHeaderBarTemplate()}</div>`;
    }
    if (this.stacked) {
      return html`${this._getHeaderBarTemplateStacked(this._oneLine)}`;
    }
    return html`${this._getHeaderBarTemplate()}`;
  }
}

if (!customElements.get('otc-header-bar')) {
  customElements.define('otc-header-bar', OtcHeaderbar);
}

export { OtcHeaderbar };
//# sourceMappingURL=otcHeaderbar.js.map
