/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import constants from "dctmw/utils/constants";

import lang from "i18n!d2/widgets/task.aviator/nls/lang";

export function getNodeList(options) {
  if (!options) {
    throw new Error("The argument `options` is required.");
  }
  let {
    node,
    nodes
  } = options;
  if (!nodes) {
    nodes = [ node ];
  }
  return nodes;
}

export function getLocalizableStrings(options) {
  const {
    nodes
  } = options;
  let introMessage, promptPlaceholder, summarizeLabel, summarizeQuestion, introMessageQuerySpace, introMessageQuerySpaceSelection, querySpaceSelectedMessage, node = nodes[0], nodeType = getNodeType(node);
  if (nodeType === constants.Types.FOLDER) {
    introMessage = lang.introMessageFolder;
    promptPlaceholder = lang.promptPlaceholderFolder;
    summarizeLabel = lang.summarizeLabelFolder;
    summarizeQuestion = lang.summarizeQuestionFolder;
  } else if (nodeType === constants.Types.DOCUMENT) {
    introMessage = lang.introMessageDocument;
    introMessageQuerySpace = lang.introMessageQuerySpace;
    introMessageQuerySpaceSelection = lang.introMessageQuerySpaceSelection;
    promptPlaceholder = lang.promptPlaceholderDocument;
    summarizeLabel = lang.summarizeLabelDocument;
    summarizeQuestion = lang.summarizeQuestionDocument;
    querySpaceSelectedMessage = lang.querySpaceSelectedMessage;
  } else {
    introMessage = lang.introMessageDocument;
    promptPlaceholder = lang.promptPlaceholderDocument;
    summarizeLabel = lang.summarizeLabelDocument;
    summarizeQuestion = lang.summarizeQuestionDocument;
  }
  return {
    introMessage: introMessage,
    promptPlaceholder: promptPlaceholder,
    summarizeLabel: summarizeLabel,
    summarizeQuestion: summarizeQuestion,
    introMessageQuerySpace: introMessageQuerySpace,
    introMessageQuerySpaceSelection: introMessageQuerySpaceSelection,
    querySpaceSelectedMessage: querySpaceSelectedMessage
  };
}

export function getNodeType(node) {
  if (node == null || node == undefined) {
    return constants.Types.DOCUMENT;
  }
  const id = node.get("id");
  if (id.indexOf("0b") === 0) {
    return constants.Types.FOLDER;
  } else if (id.indexOf("09") === 0) {
    return constants.Types.DOCUMENT;
  } else {
    return constants.Types.TASK;
  }
}