/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { FocusUtilities } from './focus-utilities.js';

// Simulate reflection of maxLength and minLength of the built-in input element
// without the error thrown if number < 0 is passed to the property setter
// and without retaining the negative value in the attribute. The complete
// implementation of the built-in input element's behavior would need custom
// reflection and property getters and setters. This is simpler and it is enough
// because it ensures only valid values in the properties and attributes.
const limitPropValConverter = {
  /**
   * Only numbers >= 0 is valid. Any invalid value is converted to -1.
   * @returns the given value as Number if >=0 or -1 for anything else
   */
  fromAttribute(value) {
    const number = Number(value);
    return number >= 0 ? number : -1;
  },
  /**
   * Only numbers >= 0 are valid. Any non-numeric value returns null.
   * @returns a String generated from the given number or null
   */
  toAttribute(value) {
    return value >= 0 ? String(value) : null;
  },
};

/**
 * Generate an (almost) unique number, using the Math.random() output
 * @returns a String with the numeric characters
 */
function generateUniqueNumber() {
  return Math.random().toString().substring(3);
}

const pattern = /\{\{|\}\}|\{(\d+)\}/g;

/**
 * String formatting using {\d+} placeholders, which allows different
 * order of the placeholders than the formatting arguments are in.
 * See http://stackoverflow.com/a/5077091/623816.
 * See http://jsfiddle.net/prantlf/L77L9/.
 * See http://jsperf.com/string-formatting-with-positioning-placeholders.
 * @example usage of sformat()
 * const pattern = "Open {1} {2} for {0}";
 * const str = sformat(pattern, 'inspection', 'document', 'file.csv');
 * @returns the formatted string
 */
function sformat(format, ...params) {
  if (typeof format !== 'string') {
    throw new Error('The formatting pattern must be a string');
  }
  return format.replace(pattern, (match, group) => {
    if (match === '{{') return '{';
    if (match === '}}') return '}';
    if (group >= params.length) {
      throw new Error('Too few parameters were provided');
    }
    const value = params[+group];
    return value != null ? value.toString() : '';
  });
}

/**
 * Retrieve the language from the 'lang' attribute of the given element or an ancestor.
 * Return the browser's language, if there is nothing found.
 *
 * @returns string
 */
function getLanguage(el) {
  let lang;

  if (!el || !(el instanceof Object)) {
    throw new Error('Please provide a valid element');
  }
  let ele = el;
  do {
    lang = ele.getAttribute('lang');
    if (lang) {
      break;
    }
    ele = ele.parentElement;
  } while (ele !== null);

  return lang || navigator.language;
}

/**
 * Retrieve the direction from the 'dir' attribute of the given element or an ancestor.
 * Return true if the direction is RTL
 * @param {Element} el
 * @returns boolean
 */
function isRTL(el) {
  return (getComputedStyle(el).direction === 'rtl');
}

/**
 * Check if a map has key case-insensitive.
 *
 * @param {Map} map
 * @param {String} searchKey
 * @returns {boolean}
 */
function mapHasKey(map, searchKey) {
  let found = false;
  for (const key of map.keys()) {
    if (key.toLowerCase() === searchKey.toLowerCase()) {
      found = true;
      break;
    }
  }

  return found;
}

/**
 * Gets the viewport height from window.document.
 *
 * @returns {number} the viewport height of the document
 */
function getViewportHeight() {
  return (document.documentElement.clientHeight || window.innerHeight);
}

/**
 * Gets the viewport width from window.document.
 *
 * @returns {number} the viewport width of the document
 */
function getViewportWidth() {
  return (document.documentElement.clientWidth || window.innerWidth);
}

// the wait time must be > 0
function debounce(func, wait = 100) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, wait);
  };
}

/**
 * Returns a promise which is resolved when the given event occurs before
 * the given maxWaitTime.
 * @param {Object} elem element to which the event listener should be added
 * @param {String} evtName name of event to listen for
 * @param {func} triggerFunc function to perform actions which should trigger the given event
 * @param {number} maxWaitTime maximum wait time for event to occur in ms
 * @returns {Promise} promise to wait for
 */
function waitForEvent(elem, evtName, triggerFunc, maxWaitTime = 1000) {
  return new Promise((resolve, reject) => {
    let timeoutId;
    const evtHandler = (event) => {
      elem.removeEventListener(evtName, evtHandler);
      clearTimeout(timeoutId);
      resolve(event);
    };
    elem.addEventListener(evtName, evtHandler);
    timeoutId = setTimeout(() => {
      elem.removeEventListener(evtName, evtHandler);
      reject(new Error('Event wait timeout reached.'));
    }, maxWaitTime);

    triggerFunc();
  });
}

/**
 * Escapes all special characters that could be used in a regular expression.  See:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
 * @param {String} string An un-escaped regular expression literal.
 * @returns {String} An escaped regular expression literal.
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Determines if an element is the child of another, including traversal through shadow roots and all assigned slots.
 * @param {Object} parent The parent element
 * @param {Object} child The child element
 * @returns {boolean}
 */
function isChild(parent, child) {
  if (!parent || !child) {
    return false;
  }

  // Check if the child is a direct descendant.
  if (parent.contains(child) || parent.shadowRoot?.contains(child)) {
    return true;
  }

  // If the child is a slotted element, check if the assigned slot is a descendant.
  if (child.assignedSlot) {
    return isChild(parent, child.assignedSlot);
  }

  // If the child is in a shadow root, check if the host element is a descendant.
  const childRoot = child.getRootNode();
  if (childRoot instanceof ShadowRoot) {
    return isChild(parent, childRoot.host);
  }

  return false;
}

// Return an array containing all elements in order, including those inside slots and groups.
function flattenElementArray(elements, includeGroup = false) {
  const result = [];

  for (const element of elements ?? []) {
    if (element.tagName === 'SLOT') {
      // If it is a slot, add all slotted items to the result array.
      const slottedElements = element.assignedElements({ flatten: true });
      result.push(...flattenElementArray(slottedElements));
    } else if (element.tagName === 'OTC-MENUGROUP') {
      // If the `includeGroup` flag is set, we want to include the group itself in the result as well as its children.
      if (includeGroup) {
        result.push(element);
      }

      // If it is a menu group, recursively add all of its child menu items to the result array.
      result.push(...flattenElementArray(element.children));
    } else if (!FocusUtilities.isFocusableElement(element) && (element.children.length > 0)) {
      // If the element is not focusable but has children, recursively add all of its child menu items to the result array.
      result.push(...flattenElementArray(element.allElements ?? element.children));
    } else {
      // If it is a normal menu item, add it to the result array.
      result.push(element);
    }
  }

  return result;
}

export { debounce, escapeRegExp, flattenElementArray, generateUniqueNumber, getLanguage, getViewportHeight, getViewportWidth, isChild, isRTL, limitPropValConverter, mapHasKey, sformat, waitForEvent };
//# sourceMappingURL=common-utilities.js.map
