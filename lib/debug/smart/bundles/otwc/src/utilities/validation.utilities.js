function buildMissingPropertyMessage(propertyName) {
  return `Warning! Missing property: ${propertyName}.`;
}

function getLocalizableProperty(lang, propertyName) {
  return lang[propertyName] || buildMissingPropertyMessage(propertyName);
}

/**
 * Check if the value is an integer with min and max checks.
 *
 * @returns string
 */
function validateInteger(value, lang) {
  const number = Number(value);
  let errorMessage = '';

  if (Number.isNaN(number)) {
    errorMessage = getLocalizableProperty(lang, 'invalidErrorMessage');
  } else if (!Number.isInteger(number)) {
    errorMessage = getLocalizableProperty(lang, 'invalidErrorMessage');
  } else if (number > 2147483647) {
    errorMessage = getLocalizableProperty(lang, 'maxErrorMessage');
  } else if (number < -2147483648) {
    errorMessage = getLocalizableProperty(lang, 'minErrorMessage');
  }

  return errorMessage;
}

/**
 * Check if the value is a decimal with min and max checks.
 *
 * @returns string
 */
function validateDecimal(value, lang) {
  const number = Number(value);
  let errorMessage = '';

  if (Number.isNaN(number)) {
    errorMessage = getLocalizableProperty(lang, 'invalidErrorMessage');
  } else if (!Number.isInteger(number) && !Number.isFinite(number)) {
    errorMessage = getLocalizableProperty(lang, 'invalidErrorMessage');
  } else if (number > 9007199254740991) {
    errorMessage = getLocalizableProperty(lang, 'maxErrorMessage');
  } else if (number < -9007199254740991) {
    errorMessage = getLocalizableProperty(lang, 'minErrorMessage');
  }

  return errorMessage;
}

export { validateDecimal, validateInteger };
//# sourceMappingURL=validation.utilities.js.map
