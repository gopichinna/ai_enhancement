/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import Url from "nuc/utils/url";

export default {
  mixin: prototype => {
    return Object.assign(prototype, {
      makeServerAdaptor: function() {
        return this;
      },
      url: function() {
        return Url.combine(this.connector.connection.url, "product-info");
      }
    });
  }
};