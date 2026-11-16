function formatAttributeData(value, isBooleanAttribute = false) {
  if (!isBooleanAttribute) {
    return value !== undefined ? value : null;
  }

  return (value !== undefined && value === true) ? value : null;
}

export { formatAttributeData };
//# sourceMappingURL=utilities.js.map
