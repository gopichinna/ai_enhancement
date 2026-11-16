/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
function formatAttributeData(value, isBooleanAttribute = false) {
  if (!isBooleanAttribute) {
    return value !== undefined ? value : null;
  }

  return (value !== undefined && value === true) ? value : null;
}

export { formatAttributeData };
//# sourceMappingURL=utilities.js.map
