/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([], function() {
  return {
    workerFunction: function() {
      var websocket;
      var connected = false;
      var opening = false;
      var closing = false;
      var connectionTimerID = 0;
      var portConnectionStatus = {};
      var timeOfFirstOpenWebSocketAttempt = 0;
      var logger = false;
      var StatusCode = Object.freeze({
        CONNECTION_FAILED: -3,
        ERROR: -2,
        DISCONNECTED: -1,
        RECV: 0,
        CONNECTED: 1,
        INFO: 2,
        PROGRESS: 3
      });
      var OpCode = Object.freeze({
        OPEN: 1,
        SEND: 0,
        CLOSE: -1
      });
      function log(msg) {
        if (logger) {
          console.log(msg);
        }
      }
      function error(msg) {
        if (logger) {
          console.error(msg);
        }
      }
      function getCurTime() {
        var today = new Date();
        return today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate() + ":" + today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds() + ":" + today.getMilliseconds();
      }
      function postMessageInternal(statusCode, connectionData, message, eventData) {
        postMessage({
          status: statusCode,
          connectionData: connectionData,
          message: message,
          eventData: eventData
        });
      }
      function openWebSocket(connectionData) {
        var protocol = connectionData.protocol;
        var address = connectionData.address;
        var port = connectionData.port;
        var launchId = connectionData.launchId;
        var language = connectionData.language ? connectionData.language : "en";
        var url = protocol + "://" + address + ":" + port + "/CTF/" + launchId + "?lang=" + language;
        var ws;
        try {
          if (connectionData.numTried === 0) {
            portConnectionStatus["" + port] = true;
          }
          connectionData.numTried += 1;
          postMessageInternal(StatusCode.INFO, connectionData);
          log(getCurTime() + " " + "openWebSocket: attempting to connect on port=" + connectionData.port + " , try=" + connectionData.numTried);
          ws = new WebSocket(url);
        } catch (e) {
          error(getCurTime() + " " + "openWebSocket ERROR: Caught exception connecting with url " + url + ": " + e.message);
          postMessageInternal(StatusCode.ERROR, connectionData, e.message);
          return;
        }
        ws.onopen = function() {
          log(getCurTime() + " " + "WebSocket onopen: connected to: " + url);
          if (connectionTimerID !== 0) {
            clearTimeout(connectionTimerID);
            connectionTimerID = 0;
          }
          postMessageInternal(StatusCode.CONNECTED, connectionData);
          opening = false;
          closing = false;
          connected = true;
          websocket = ws;
        };
        ws.onerror = function(event) {
          log(getCurTime() + " " + "WebSocket onerror:");
          if (!connected) {
            if (connectionData.numTriesMax === 0 || connectionData.numTried >= connectionData.numTriesMax) {
              if (connectionData.numTried >= connectionData.numTriesMax) {
                log("Exceeded number of trials " + getCurTime() + " " + "dt=" + (Date.now() - timeOfFirstOpenWebSocketAttempt) + " milliseconds");
              }
              opening = false;
              if (connectionTimerID !== 0) {
                clearTimeout(connectionTimerID);
                connectionTimerID = 0;
              }
              if (event.data) {
                log(getCurTime() + " " + "WebSocket onerror: " + event.data);
              }
              postMessageInternal(StatusCode.CONNECTION_FAILED, connectionData, "", event.data);
              connected = false;
              websocket = null;
              return;
            }
            if (connectionData.numTriesMax > 0 && connectionData.numTried < connectionData.numTriesMax) {
              var status = portConnectionStatus["" + port];
              if (status) {
                log(getCurTime() + " " + "dt=" + (Date.now() - timeOfFirstOpenWebSocketAttempt) / 10 + " milliseconds");
                connectionTimerID = setTimeout(openWebSocket, connectionData.nextTryWaitPeriodMilliseconds, connectionData);
              }
            }
          } else {
            opening = false;
            var msg = "WebSocket onerror";
            if (event.data) {
              msg += ": " + event.data;
            }
            error(getCurTime() + " " + msg);
            if (!closing) {
              postMessageInternal(StatusCode.ERROR, connectionData, "", event.data);
            } else {
              closing = false;
              postMessageInternal(StatusCode.DISCONNECTED, connectionData, "");
            }
            connected = false;
            websocket = null;
          }
        };
        ws.onclose = function(event) {
          log(getCurTime() + " " + "WebSocket onclose invoked ");
          if (connected) {
            var eventMsg = "code=" + event.code;
            if (event.reason) {
              eventMsg += ", reason=" + event.reason;
            }
            eventMsg += ", wasClean=" + event.wasClean;
            log(getCurTime() + " " + "WebSocket onclose: disconnected from: " + url + ", " + eventMsg);
            postMessageInternal(StatusCode.DISCONNECTED, connectionData);
          }
          closing = false;
          connected = false;
          websocket = null;
        };
        ws.onmessage = function(event) {
          log(getCurTime() + " " + "WebSocket onmessage: " + event.data);
          var message;
          try {
            message = JSON.parse(event.data);
            if (message.progress !== undefined) {
              postMessageInternal(StatusCode.PROGRESS, connectionData, message);
            } else if (message.connectionFailed) {
              connected = false;
              opening = false;
              postMessageInternal(StatusCode.CONNECTION_FAILED, connectionData, message);
              portConnectionStatus["" + port] = false;
              if (connectionTimerID !== 0) {
                clearTimeout(connectionTimerID);
                connectionTimerID = 0;
              }
              closeWebSocket();
            } else if (message.closing) {
              connected = false;
              opening = false;
              portConnectionStatus["" + port] = false;
              postMessageInternal(StatusCode.ERROR, connectionData, message);
              if (connectionTimerID !== 0) {
                clearTimeout(connectionTimerID);
                connectionTimerID = 0;
              }
              closeWebSocket();
            } else {
              postMessageInternal(StatusCode.RECV, connectionData, message);
            }
          } catch (e) {
            error(getCurTime() + " " + "WebSocket onmessage: invalid event.data: " + e.message);
          }
        };
        return ws;
      }
      function closeWebSocket() {
        if (websocket) {
          closing = true;
          var msg = "Closed by client";
          websocket.close(1e3, msg);
          log(this.getCurTime() + " " + "closeWebsocket: called websocket.close(1000, '" + msg + "')");
          websocket = null;
        }
      }
      this.addEventListener("message", function(e) {
        log(getCurTime() + " " + "Worker recv: " + JSON.stringify(e.data));
        var message;
        try {
          message = e.data;
        } catch (e) {
          error(getCurTime() + " " + "Worker error: Invalid JSON message string");
          return;
        }
        if (message.opcode === undefined || typeof message.opcode !== "number") {
          log(getCurTime() + " " + "Worker error: Missing or invalid message opcode");
          return;
        }
        var opcode = message.opcode;
        if (opcode < OpCode.CLOSE || OpCode.OPEN < opcode) {
          log(getCurTime() + " " + "Worker error: Invalid message opcode value: " + opcode);
          return;
        }
        switch (opcode) {
         case OpCode.OPEN:
          if (connected) {
            log(getCurTime() + " " + "Worker OPEN: already connected");
            return;
          }
          if (!connected && opening) {
            log(getCurTime() + " " + "Worker OPEN: waiting to open");
            return;
          }
          opening = true;
          log(getCurTime() + " " + "Worker: opening web socket connection on port " + message.connectionData.port);
          timeOfFirstOpenWebSocketAttempt = Date.now();
          openWebSocket(message.connectionData);
          break;

         case OpCode.CLOSE:
          if (!connected) {
            log(getCurTime() + " " + "Worker CLOSE:  already disconnected");
            return;
          }
          if (connected && closing) {
            log(getCurTime() + " " + "Worker CLOSE:  waiting to close");
            return;
          }
          log(getCurTime() + " " + "Worker CLOSE:  closeWebSocket");
          closeWebSocket();
          break;

         case OpCode.SEND:
          log(getCurTime() + " " + "Worker SEND: " + JSON.stringify(message.data));
          websocket.send(message.data);
          break;
        }
      }, false);
    }
  };
});