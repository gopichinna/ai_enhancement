/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import PostView from "d2/widgets/task.aviator/impl/messages/post.view";

import template from "hbs!d2/widgets/task.aviator/impl/messages/failure";

import "css!d2/widgets/task.aviator/impl/messages/failure";

class FailureView extends PostView {}

Object.assign(FailureView.prototype, {
  className: `${PostView.prototype.className} aie-chat-failure`,
  template: template
});

Object.defineProperty(FailureView.prototype.constructor, "name", {
  value: "FailureView"
});

export default FailureView;