/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import $ from "nuc/lib/jquery";

export default {
  mixin: prototype => {
    return Object.assign(prototype, {
      makeServerAdaptor: function() {
        return this;
      },
      sync: function() {
        return $.Deferred().resolve().promise();
      }
    });
  }
};