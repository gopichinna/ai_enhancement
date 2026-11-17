/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  Behavior
} from "nuc/lib/marionette";

import ConnectorFactory from "nuc/contexts/factories/connector";

import Session from "dctmw/utils/authenticators/session";

import utils from "dctmw/utils/utils";

class ImageRetrieverBehavior extends Behavior {
  constructor(options, view) {
    super(options, view);
    this.imageCache = {};
    this.view = view;
    this.connector = Session.get().getContext().getObject(ConnectorFactory);
    this.listenTo(view, "retrieve:image", this._fetchImage);
  }
  _fetchImage(url) {
    const handleFailure = () => {
      this.view.triggerMethod("image:error", url);
    };
    const handleSuccess = b64ImageContent => {
      this.view.triggerMethod("image:sync", url, b64ImageContent);
    };
    if (utils.isNonEmptyString(url)) {
      if (this.imageCache[url]) {
        handleSuccess(this.imageCache[url]);
      } else {
        this.view.triggerMethod("image:request", url);
        this.connector.makeAjaxCall({
          url: url,
          dataType: "binary"
        }).always((resp, statusText, xhr) => {
          if (!this.isDestroyed) {
            if (xhr.status === 200) {
              const reader = new FileReader();
              reader.onloadend = () => {
                this.imageCache[url] = reader.result;
                handleSuccess(reader.result);
              };
              reader.onerror = () => {
                handleFailure();
              };
              reader.readAsDataURL(resp);
            } else {
              handleFailure();
            }
          }
        });
      }
    } else {
      handleFailure();
    }
  }
}

Object.defineProperty(ImageRetrieverBehavior.prototype.constructor, "name", {
  value: "ImageRetrieverBehavior"
});

export default ImageRetrieverBehavior;