/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  View
} from "nuc/lib/marionette3";

import {
  text2html
} from "d2/widgets/task.aviator/aie/utils/text2html/text2html";

import lang from "i18n!d2/widgets/task.aviator/nls/lang";

import "css!d2/widgets/task.aviator/impl/messages/post";

import "d2/widgets/task.aviator/aie/icons/icons_header";

class PostView extends View {
  templateContext() {
    const text = this.model.get("text");
    return text ? {
      text: text2html(text),
      lang: lang
    } : {
      lang: lang
    };
  }
}

Object.assign(PostView.prototype, {
  className: "aie-chat-post",
  tagName: "li"
});

Object.defineProperty(PostView.prototype.constructor, "name", {
  value: "PostView"
});

export default PostView;