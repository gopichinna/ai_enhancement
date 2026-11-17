/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import log from "nuc/utils/log";

import require from "require";

import $ from "nuc/lib/jquery";

import _ from "nuc/lib/underscore";

import OpenAjaxMessage from "dctmw/events/oah/oah.message";

import eventsConstants from "dctmw/events/oah/events.constants";

let instance = null;

class DctmOahHandler {
  managedHub;
  containerHubClient;
  hubclient;
  subScriptionIdList;
  constructor() {
    if (!instance) {
      instance = this;
    }
    return instance;
  }
  initialize() {
    var dfd = $.Deferred();
    this.subScriptionIdList = {};
    return this._initOahHub().done(function() {
      this.createInlineContainer("d2-view");
      this.createHubClient();
      this.initializeActionEvents();
      dfd.resolve();
    }.bind(this)).fail(dfd.fail);
  }
  _initOahHub() {
    log.debug("Hub creation initiated");
    var dfd = $.Deferred();
    if (this.managedHub !== undefined) {
      return dfd.resolve().promise();
    } else {
      require([ "dctmw/lib/oah/OpenAjaxManagedHub-all" ], function(OAH) {
        console.log(OAH);
        if (this.managedHub === undefined) this.managedHub = new window.OpenAjax.hub.ManagedHub({
          onPublish: this.onMHPublish,
          onSubscribe: this.onMHSubscribe,
          onUnsubscribe: this.onMHUnsubscribe,
          onSecurityAlert: this.onMHSecurityAlert
        });
        dfd.resolve();
      }.bind(this));
      log.debug("Hub creation completed");
      return dfd.promise();
    }
  }
  onMHPublish(topic, data, publishContainer, subscribeContainer) {
    log.debug("Managed hub publish : topic=" + topic + " - data=" + data + " - publish container=" + publishContainer + " - subscribe container=" + subscribeContainer);
    return true;
  }
  onMHSubscribe(topic, container) {
    log.debug("Managed hub subscription : topic=" + topic + " - container=" + container);
    return true;
  }
  onMHUnsubscribe(topic, container) {
    log.debug("Managed hub unsubscription : topic=" + topic + " - container=" + container);
    return true;
  }
  onMHSecurityAlert(source, alertType) {
    log.debug("Managed hub security alert : source=" + source + " - alertType=" + alertType);
  }
  createInlineContainer(id) {
    function onClientSecurityAlert() {
      log.debug("Reached  onClientSecurityAlert ");
    }
    function onClientConnect() {
      log.debug("Reached  onClientConnect ");
    }
    function onClientDisconnect() {
      log.debug("Reached  onClientDisconnect ");
    }
    this.containerHubClient = new window.OpenAjax.hub.InlineContainer(this.managedHub, id, {
      Container: {
        onSecurityAlert: onClientSecurityAlert,
        onConnect: onClientConnect,
        onDisconnect: onClientDisconnect
      }
    });
  }
  createHubClient() {
    function client1SecurityAlertHandler() {
      log.debug("Reached client1SecurityAlertHandler");
    }
    function clientApp1HubClientConnect(hubClient, success) {
      if (success) {
        log.debug("Reached clientApp1HubClientConnect");
      }
    }
    this.hubclient = new window.OpenAjax.hub.InlineHubClient({
      HubClient: {
        onSecurityAlert: client1SecurityAlertHandler
      },
      InlineHubClient: {
        container: this.containerHubClient
      }
    });
    this.hubclient.connect(clientApp1HubClientConnect);
  }
  createOAHIframeContainer(options) {
    if (typeof console != "undefined") log.debug(" createIframeContainer : id:" + options.id + " , parentDiv:" + " (" + options.parentDiv + ") , contextuid:" + options.contextUid + " , iframeurl:", +options.iframeUrl);
    var containerHubIframe = new window.OpenAjax.hub.IframeContainer(this.managedHub, options.id, {
      Container: {
        onSecurityAlert: options.onClientSecurityAlert,
        onConnect: options.onClientConnect,
        onDisconnect: options.onClientDisconnect
      },
      IframeContainer: {
        parent: options.parentDiv,
        timeout: 6e4,
        iframeAttrs: {
          style: {
            border: "black solid 0px",
            width: "100%",
            height: "98%"
          },
          contextUid: options.contextUid,
          allowfullscreen: "true"
        },
        uri: options.iframeUrl
      }
    });
    return containerHubIframe;
  }
  removeIframeContainer(iframeContainer) {
    this.managedHub.removeContainer(iframeContainer);
  }
  publishMessage(event, options) {
    var oam = new OpenAjaxMessage();
    _.each(options, function(value, key) {
      oam.set(key, value);
    });
    oam.set(eventsConstants.OAM.PARAM_GLOBAL, true);
    this.publish(event, oam.toString());
  }
  publish(event, message) {
    this.hubclient?.publish(event, message);
  }
  subscribeEvent(options) {
    if (this.hubclient) {
      var subId = this.hubclient.subscribe(options.event, (event, message) => {
        var ticketRequestMessage = new OpenAjaxMessage();
        ticketRequestMessage.parse(message);
        options.callbackFunction(event, ticketRequestMessage);
      });
      this.subScriptionIdList[options.event] = subId;
    }
  }
  unsubscribeEvent(event) {
    this.hubclient?.unsubscribe(this.subScriptionIdList[event]);
  }
  initializeActionEvents() {
    const dfd = $.Deferred();
    require([ "csui/utils/commands" ], commands => {
      commands.each(function(command) {
        if (command.subscribeEvents) {
          command.subscribeEvents();
        }
      });
      dfd.resolve();
    }, dfd.reject);
    return dfd.promise();
  }
}

Object.defineProperty(DctmOahHandler.prototype.constructor, "name", {
  value: "DctmOahHandler"
});

var DctmOahHandlerInstance = new DctmOahHandler();

export default DctmOahHandlerInstance;