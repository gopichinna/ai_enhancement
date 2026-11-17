/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
export function workerFunction() {
  let pollingId = null;
  let controller;
  async function doFetch({
    url,
    options
  }) {
    try {
      const resp = await fetch(url, options);
      const data = await resp.json();
      if (resp.status === 401) {
        postMessage({
          status: "unauthorized"
        });
      } else if (resp.status >= 400) {
        postMessage({
          status: "error",
          response: data
        });
      } else {
        postMessage({
          status: "success",
          data: data
        });
      }
    } catch (err) {
      if (err.status === 401) {
        postMessage({
          status: "unauthorized"
        });
      } else {
        postMessage({
          status: "error",
          error: err.message
        });
      }
    }
  }
  function startPolling({
    url,
    options,
    interval
  }) {
    if (pollingId !== null) return;
    pollingId = setInterval(() => {
      if (controller) {
        controller.abort();
      }
      controller = new AbortController();
      const signal = controller.signal;
      options.signal = signal;
      doFetch({
        url: url,
        options: options
      });
    }, interval);
  }
  function stopPolling() {
    if (pollingId !== null) {
      if (controller) {
        controller.abort();
      }
      clearInterval(pollingId);
      pollingId = null;
    }
  }
  self.addEventListener("message", ({
    data: {
      cmd,
      payload
    }
  }) => {
    if (cmd === "START") {
      startPolling(payload);
    } else if (cmd === "STOP") {
      stopPolling();
    }
  });
}