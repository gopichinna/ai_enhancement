import { Console } from '../../utilities/logging-utilities.js';

// This is a private module for brand resizing support.

// definition of the different types for measurement
const ElemType = {
  TYPE_HAMBURGER: 'hamburger',
  TYPE_BRAND: 'brand',
  TYPE_OTCBRAND: 'otcBrand',
  TYPE_ACTIONS: 'actions',
  TYPE_HEADERBAR: 'headerbar',
};

/**
 * This function allow you to modify a JS Promise by adding some status properties.
 * Based on: http://stackoverflow.com/questions/21485545/is-there-a-way-to-tell-if-an-es6-promise-is-fulfilled-rejected-resolved
 * But modified according to the specs of promises : https://promisesaplus.com/ (Dec 2022).
 */
function makeQueryablePromise(promise) {
  // Don't modify any promise that has been already modified.
  if (promise.isFulfilled) return promise;

  // Set initial state
  let isPending = true;
  let isRejected = false;
  let isFulfilled = false;

  // Observe the promise, saving the fulfillment in a closure scope.
  const result = promise.then(
    (v) => {
      isFulfilled = true;
      isPending = false;
      return v;
    },
    (e) => {
      isRejected = true;
      isPending = false;
      throw e;
    },
  );

  result.isFulfilled = () => isFulfilled;
  result.isPending = () => isPending;
  result.isRejected = () => isRejected;
  return result;
}

function showElementInternal(elem, displayValue) {
  if (elem) {
    // remove display if undefined or null
    if (displayValue == null) {
      elem.style.removeProperty('display');
    } else {
      elem.style.display = displayValue;
    }
  }
}

// change the display style to hide components temporarily,
// do not use WC properties since this is irreversible
function showTextInternal(brandEl, show, selector) {
  const elem = brandEl.shadowRoot.querySelector(selector);
  if (show === true) {
    showElementInternal(elem, null);
  } else {
    showElementInternal(elem, 'none');
  }
  return !!show;
}

function showPrimaryText(brandEl, show) {
  return showTextInternal(brandEl, show, '.ot-brand__primary');
}

function showSecondaryText(brandEl, show) {
  return showTextInternal(brandEl, show, '.ot-brand__secondary');
}

function showVersionText(brandEl, show) {
  return showTextInternal(brandEl, show, '.ot-brand__version');
}

function showBrandDivider(brandEl, show) {
  return showTextInternal(brandEl, show, '.ot-brand__divider');
}

// due to (previous) margins and since the logo is the last element which gets
// displaced, we hide with the logo the whole brand component
function showBrandLogo(otcHeaderbarEl, show) {
  const elem = otcHeaderbarEl.shadowRoot.querySelector('.ot-header__brand');
  if (show === true) {
    showElementInternal(elem, null);
  } else {
    showElementInternal(elem, 'none');
  }
  return !!show;
}

function hasNonEmptyBrandTexts(sizeData) {
  return ((!sizeData[ElemType.TYPE_OTCBRAND].hidePrimaryText && sizeData[ElemType.TYPE_OTCBRAND].primaryText.length > 0)
    || (!sizeData[ElemType.TYPE_OTCBRAND].hideSecondaryText && sizeData[ElemType.TYPE_OTCBRAND].secondaryText.length > 0)
    || (!sizeData[ElemType.TYPE_OTCBRAND].hideVersionText && sizeData[ElemType.TYPE_OTCBRAND].versionText.length > 0)
  );
}

/**
 * Returns null if no brand part is displayed, otherwise object with flags.
 * @returns {Object} showData object with flags or null if no brand can be displayed
 */
function resizeResponsive(restSpace, sizeData, headerbarLightEl, brandEl) {
  // no space for brand, hide all
  const showData = {
    showBrandLogo: false,
    showBrandDivider: false,
    showPrimaryText: false,
    showSecondaryText: false,
    showVersionText: false,
  };
  const brandSize = sizeData[ElemType.TYPE_BRAND].size;
  const brandSum = sizeData[ElemType.TYPE_BRAND].sum;

  // the restSpace can be used by brand
  if (restSpace >= brandSize.wholeBrand.width) {
    // show all wanted parts
    Console.log('brand-resize: show all');
    showData.showBrandLogo = true;
    if (!sizeData[ElemType.TYPE_OTCBRAND].hidePrimaryText) showData.showPrimaryText = true;
    if (!sizeData[ElemType.TYPE_OTCBRAND].hideSecondaryText) showData.showSecondaryText = true;
    if (!sizeData[ElemType.TYPE_OTCBRAND].hideVersionText) showData.showVersionText = true;
    showData.showBrandDivider = hasNonEmptyBrandTexts(sizeData);
  } else if ((restSpace
      - brandSize.logo.width
      - (2 * brandSum.averageBrandSpacing.width)) >= 0) {
    showData.showBrandLogo = true;
    // all other stuff is still hidden

    if (sizeData[ElemType.TYPE_OTCBRAND].brandTextExists) {
      let tempDiff = -1;

      const tempSpace = restSpace
        - brandSize.brandDivider.width
        - brandSize.logo.width
        - (3 * brandSum.averageBrandSpacing.width);
      Console.log(`brand-resize: space for brand texts: ${tempSpace}, logoAndDividerAndAvgBrandSpacing: ${
        brandSize.brandDivider.width
        + brandSize.logo.width
        + (3 * brandSum.averageBrandSpacing.width)}`);

      let primaryTextWidth = 0;
      if (!sizeData[ElemType.TYPE_OTCBRAND].hidePrimaryText) {
        primaryTextWidth = brandSize.primaryText.width > 0
          ? brandSize.primaryText.width
          + brandSum.averageBrandSpacing.width : 0;
        tempDiff = (tempSpace - primaryTextWidth);
        Console.log(`brand-resize: tempDiff ${tempDiff} after primaryText + avgBrandSpacing`);
        if (tempDiff >= 0) {
          showData.showPrimaryText = true;
        }
      }
      let secondaryTextWidth = 0;
      if (!sizeData[ElemType.TYPE_OTCBRAND].hideSecondaryText) {
        secondaryTextWidth = brandSize.secondaryText.width > 0
          ? brandSize.secondaryText.width
          + brandSum.averageBrandSpacing.width : 0;
        tempDiff = (tempSpace - (primaryTextWidth + secondaryTextWidth));
        Console.log(`brand-resize: tempDiff ${tempDiff} after primaryText + secondaryText + avgBrandSpacing`);
        if (tempDiff >= 0) {
          showData.showSecondaryText = true;
        }
      }
      let versionTextWidth = 0;
      if (!sizeData[ElemType.TYPE_OTCBRAND].hideVersionText) {
        versionTextWidth = brandSize.versionText.width > 0
          ? brandSize.versionText.width
          + brandSum.averageBrandSpacing.width : 0;
        tempDiff = (tempSpace - (primaryTextWidth + secondaryTextWidth + versionTextWidth));
        Console.log(`brand-resize: tempDiff ${tempDiff} after primaryText + secondaryText + versionText + avgBrandSpacing`);
        if (tempDiff >= 0) {
          showData.showVersionText = true;
        }
      }
      showData.showBrandDivider = showData.showPrimaryText || showData.showSecondaryText || showData.showVersionText;
    }
  }
  Console.info('brand-resize: finally shown brand parts:', showData);
  // do the attribute/DOM changes in one place
  showBrandLogo(headerbarLightEl, showData.showBrandLogo);
  showBrandDivider(brandEl, showData.showBrandDivider);
  showPrimaryText(brandEl, showData.showPrimaryText);
  showSecondaryText(brandEl, showData.showSecondaryText);
  showVersionText(brandEl, showData.showVersionText);

  let ret = null;
  if (showData.showBrandLogo || showData.showPrimaryText
    || showData.showSecondaryText || showData.showVersionText) {
    ret = showData;
  } else {
    // in the future when the brand component fully manages its size itself, we still
    // have to remove the margins for the whole brand in the header here
    Console.log('brand-resize: no brand parts are displayed, removing margins in header');
    showBrandLogo(headerbarLightEl, false);
  }

  return ret;
}

function hideWholeBrand(headerbarLightEl) {
  // we just hide the whole brand
  showBrandLogo(headerbarLightEl, false);
}

export { ElemType, hasNonEmptyBrandTexts, hideWholeBrand, makeQueryablePromise, resizeResponsive, showBrandDivider, showBrandLogo, showPrimaryText, showSecondaryText, showVersionText };
//# sourceMappingURL=brand-resize.js.map
