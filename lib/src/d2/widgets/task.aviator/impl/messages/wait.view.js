/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import PostView from "d2/widgets/task.aviator/impl/messages/post.view";

import template from "hbs!d2/widgets/task.aviator/impl/messages/wait";

import image from "txt!d2/widgets/task.aviator/aie/icons/mime_aviator_chatbot18.svg";

import "css!d2/widgets/task.aviator/impl/messages/wait";

import "smart/utils/otwc.loader";

class WaitView extends PostView {
  templateContext() {
    return {
      image: `data:image/svg+xml,${encodeURIComponent(image)}`
    };
  }
}

Object.assign(WaitView.prototype, {
  className: `${PostView.prototype.className} aie-chat-wait`,
  template: template
});

Object.defineProperty(WaitView.prototype.constructor, "name", {
  value: "WaitView"
});

export default WaitView;