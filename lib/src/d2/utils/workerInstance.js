/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([], function() {
  "use strict";
  return {
    workerFunction: function() {
      self.addEventListener("message", async e => {
        var {
          url,
          options
        } = e.data;
        try {
          options.credentials = "include";
          const response = await fetch(url, options);
          const data = await response.json();
          if (response.status === 401) {
            self.postMessage({
              status: "unauthorized"
            });
          } else if (response.status >= 400) {
            self.postMessage({
              status: "error",
              response: response.message
            });
          } else {
            self.postMessage({
              status: "success",
              data: data
            });
          }
        } catch (error) {
          if (error.status === 401) {
            self.postMessage({
              status: "unauthorized"
            });
          } else {
            self.postMessage({
              status: "error",
              error: error.message
            });
          }
        }
      }, false);
    }
  };
});