/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
const SUPPORTED_DOCUMENT_TYPES = [ 144, 749 ];

const SUPPORTED_WORKSPACE_TYPES = [ 848 ];

const __checkType = (node, src) => {
  const type = node.get("type");
  return src.indexOf(type) !== -1;
};

export const isDocumentType = node => {
  return __checkType(node, SUPPORTED_DOCUMENT_TYPES);
};

export const isWorkspaceType = node => {
  return __checkType(node, SUPPORTED_WORKSPACE_TYPES);
};

export const setDisplayName = (status, commandKey) => {
  const commandDisplayName = status.container?.actions?.get(commandKey)?.get("name");
  if (commandDisplayName) {
    status.toolItem?.set("name", commandDisplayName);
  }
};