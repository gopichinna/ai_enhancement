/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import constants from "dctmw/utils/constants";

import vdocUtils from "d2/utils/vdoc.utils";

import lang from "i18n!d2/server.adaptors/aviator/nls/lang";

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
  let introMessage, promptPlaceholder, summarizeLabel, summarizeQuestion;
  if (nodes.length === 1) {
    let node = nodes[0], nodeType = node.get("type");
    if (vdocUtils.isVirtualDoc(node) && vdocUtils.getVDMNumber(node)) {
      introMessage = lang.introMessageVirtualDocument;
      promptPlaceholder = lang.promptPlaceholderVirtualDocument;
      summarizeLabel = lang.summarizeLabelVirtualDocument;
      summarizeQuestion = lang.summarizeQuestionVirtualDocument;
    } else if (nodeType === constants.Types.FOLDER) {
      introMessage = lang.introMessageFolder;
      promptPlaceholder = lang.promptPlaceholderFolder;
      summarizeLabel = lang.summarizeLabelFolder;
      summarizeQuestion = lang.summarizeQuestionFolder;
    } else if (nodeType === constants.Types.BWS) {
      introMessage = lang.introMessageWorkspace;
      promptPlaceholder = lang.promptPlaceholderWorkspace;
      summarizeLabel = lang.summarizeLabelWorkspace;
      summarizeQuestion = lang.summarizeQuestionWorkspace;
    } else {
      introMessage = lang.introMessageDocument;
      promptPlaceholder = lang.promptPlaceholderDocument;
      summarizeLabel = lang.summarizeLabelDocument;
      summarizeQuestion = lang.summarizeQuestionDocument;
    }
  } else {
    introMessage = lang.introMessageDocuments;
    promptPlaceholder = lang.promptPlaceholderDocuments;
    summarizeLabel = lang.summarizeLabelDocuments;
    summarizeQuestion = lang.summarizeQuestionDocuments;
  }
  return {
    introMessage: introMessage,
    promptPlaceholder: promptPlaceholder,
    summarizeLabel: summarizeLabel,
    summarizeQuestion: summarizeQuestion
  };
}