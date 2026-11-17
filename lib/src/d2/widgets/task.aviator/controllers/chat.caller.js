/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import UploadableMixin from "nuc/models/mixins/uploadable/uploadable.mixin";

import getChatUrl from "d2/widgets/task.aviator/controllers/chat.url";

export default function callChat(connector, body) {
  let data = JSON.stringify(body);
  let contentType;
  if (UploadableMixin.useJSON || UploadableMixin.mock) {
    contentType = "application/json";
  } else {
    data = `body=${encodeURIComponent(data)}`;
    contentType = "application/x-www-form-urlencoded";
  }
  return connector.makeAjaxCall({
    type: "POST",
    url: getChatUrl(connector),
    data: data,
    contentType: contentType
  });
}