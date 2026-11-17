/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
function handleRequest(type, url, options) {
  var self = this, requestMethod = type, requestBody;
  if (!type || !url) {
    return;
  }
  function requestComplete(data, contentType, contentDisposition) {
    self.postMessage({
      response: "requestComplete",
      content: data,
      contentType: contentType,
      contentDisposition: contentDisposition
    });
    self.close();
  }
  function requestLog(msg) {
    self.postMessage({
      response: "requestLog",
      msg: msg
    });
  }
  if (options?.headers["x-worker-behavior-control"] !== undefined) {
    const workerBehavior = options.headers["x-worker-behavior-control"];
    requestMethod = workerBehavior.requestMethod;
    if (typeof workerBehavior.requestBody === "string") {
      requestBody = workerBehavior.requestBody;
    } else if (typeof workerBehavior.requestBody === "object") {
      requestBody = JSON.stringify(workerBehavior.requestBody);
    }
    delete options.headers["x-worker-behavior-control"];
  }
  requestLog("Getting: " + url);
  var xhr = new XMLHttpRequest();
  xhr.open(requestMethod || "GET", url);
  if (options?.withCredentials === true) {
    xhr.withCredentials = true;
  }
  if (options.headers !== undefined) {
    Object.keys(options.headers).forEach(function(key) {
      xhr.setRequestHeader(key, options.headers[key]);
    });
  }
  var responseType = options.handleAs || "text";
  xhr.mozResponseType = xhr.responseType = responseType;
  xhr.onprogress = function progress(evt) {
    self.postMessage({
      response: "requestProgress",
      loaded: evt.loaded,
      total: evt.lengthComputable ? evt.total : void 0
    });
  };
  xhr.onerror = function error(e) {
    self.postMessage({
      response: "requestError",
      error: "Error: " + e.target.status + " URL: " + url
    });
    self.close();
  };
  xhr.onreadystatechange = function getFileOnreadystatechange(e) {
    if (xhr.readyState === 4) {
      var contentType = xhr.getResponseHeader("Content-Type"), data = xhr.mozResponseArrayBuffer || xhr.mozResponse || xhr.responseArrayBuffer || xhr.response;
      if (xhr.status === 200) {
        var contentDisposition = null;
        if (options.extractContentDisposition) {
          contentDisposition = xhr.getResponseHeader("Content-Disposition");
        }
        requestComplete(data, contentType, contentDisposition);
      } else {
        var error = {
          status: e.target.status,
          type: "text"
        };
        if (contentType.indexOf("html") >= 0) {
          error.type = "html";
        } else if (contentType.indexOf("xml") >= 0) {
          error.type = "xml";
        } else if (contentType.indexOf("json") >= 0) {
          error.type = "json";
        }
        if (typeof TextDecoder === "undefined") {
          self.importScripts("./text-encoding.js");
        }
        if (typeof data === "string") {
          error.text = data;
        } else {
          error.text = new TextDecoder("utf-8").decode(data);
        }
        error.text = JSON.parse(error.text);
        self.postMessage({
          response: "requestError",
          error: error.text.message || error.text.details,
          errorResponse: error.text
        });
        self.close();
      }
    }
  };
  xhr.send(requestBody ? requestBody : null);
}

this.addEventListener("message", function(e) {
  var data = e.data;
  switch (data.type) {
   case "get":
    handleRequest("GET", data.url, data.options);
    break;

   default:
    break;
  }
}, false);