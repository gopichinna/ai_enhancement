/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import PostView from "d2/widgets/task.aviator/impl/messages/post.view";

import template from "hbs!d2/widgets/task.aviator/impl/messages/user";

import "css!d2/widgets/task.aviator/impl/messages/user";

class UserView extends PostView {}

function failed() {
  this.ui.text[0].classList.add("aie-chat-failed");
}

Object.assign(UserView.prototype, {
  className: `${PostView.prototype.className} aie-chat-user`,
  template: template,
  ui: {
    text: ".aie-chat-text"
  },
  modelEvents: {
    "change:failed": failed
  }
});

Object.defineProperty(UserView.prototype.constructor, "name", {
  value: "UserView"
});

export default UserView;