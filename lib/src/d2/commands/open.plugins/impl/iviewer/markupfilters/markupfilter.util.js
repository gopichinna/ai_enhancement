/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import GlobalMessage from "d2/controls/globalmessage/globalmessage";

import lang from "i18n!d2/commands/open.plugins/nls/localized.strings";

import "css!d2/commands/open.plugins/impl/iviewer/markupfilters/markupfilters.style";

const MarkupFilterUtil = {
  parseFilterContent(content) {
    try {
      if (Array.isArray(content)) {
        return JSON.parse(content[0] || "{}");
      }
      return JSON.parse(content || "{}");
    } catch (e) {
      GlobalMessage.showMessage("error", lang.ParseFailure);
      return {};
    }
  },
  getFilterContent(markupIds) {
    const filterContent = {
      filterVersion: 2,
      withAnyProperties: []
    };
    markupIds.forEach(id => {
      filterContent.withAnyProperties.push({
        name: "id",
        value: id
      });
    });
    return filterContent;
  }
};

export default MarkupFilterUtil;