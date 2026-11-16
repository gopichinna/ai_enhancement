/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/marionette", "nuc/lib/jquery", "nuc/utils/url", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "csui/utils/contexts/factories/connector", "dctmw/utils/rest.resources", "dctmw/events/oah/dctm.oah.handler", "dctmw/events/oah/events.constants", "dctmw/events/oah/oah.message", "d2/utils/constants", "d2/utils/rest.linkrels", "i18n!d2/dialogs/external.widget.dialog/impl/nls/lang", "hbs!d2/dialogs/external.widget.dialog/impl/external.widget", "css!d2/dialogs/external.widget.dialog/impl/external.widget" ], function(require, _, Marionette, $, Url, LayoutViewEventsPropagationMixin, ConnectionFactory, RestResources, DctmOahHandler, eventsConstants, OpenAjaxMessage, constants, RestLinkrels, lang, template) {
  "use strict";
  var ExternalWidgetView = Marionette.LayoutView.extend({
    className: "d2-node-external-container",
    template: template,
    ui: {
      iframeLoader: ".d2-node-external"
    },
    events: {
      "click .btn-close-viewer": "_onClickClose",
      "keyup .btn-close-viewer": "_onKeyUp",
      "click otc-button": "_noPreviewDownload"
    },
    templateHelpers: function() {
      return {
        closeBtnTitle: lang.labelCloseExternalWidget
      };
    },
    constructor: function ExternalWidgetView(options) {
      options = options || {};
      this.context = options.context;
      Marionette.LayoutView.prototype.constructor.call(this, options);
      this.propagateEventsToRegions();
      this.listenTo(this, "after:show", this.afterShow);
    },
    _onClickClose: function(e) {
      e && e.stopPropagation();
      this.trigger("external:widget:close", e);
      DctmOahHandler.unsubscribeEvent("D2_EVENT_IFRAME_INIT");
      DctmOahHandler.unsubscribeEvent("D2_ACTION_DM_TICKET_GENERATE");
      this.destroy();
    },
    _onKeyUp: function(e) {
      if (e && (e.keyCode === 13 || e.keyCode === 32)) {
        this._onClickClose(e);
      }
    },
    afterShow: function() {
      this._loadOAHIframe();
      this._subscribeDmTicket();
    },
    _loadOAHIframe: function() {
      function onClientSecurityAlert(source, alertType) {
        if (typeof console != "undefined") console.log("onClientSecurityAlert " + source + " - " + alertType);
      }
      function onClientConnect(container) {
        if (typeof console != "undefined") console.log("onClientConnect :" + container);
      }
      function onClientDisconnect(container) {
        if (typeof console != "undefined") console.log("onClientDisconnect :" + container);
      }
      var options = {
        onClientSecurityAlert: onClientSecurityAlert,
        onClientConnect: onClientConnect,
        onClientDisconnect: onClientDisconnect,
        id: this._getClientId(),
        parentDiv: this.ui.iframeLoader[0],
        contextUid: "1234",
        iframeUrl: this.options.widgetConfig.entries[0].content.properties["widget_url"]
      };
      this.d2OahIiframeContainer = DctmOahHandler.createOAHIframeContainer(options);
      this._subscribeIFrameLoadEvent();
    },
    _subscribeIFrameLoadEvent: function() {
      var me = this;
      DctmOahHandler.subscribeEvent({
        event: "D2_EVENT_IFRAME_INIT",
        callbackFunction: function(event, message) {
          if ("ext" === message.get("source")) {
            message.set("source", "int");
            message.set(eventsConstants.OAM.PARAM_VOLATILE, true);
            this._publishDisplayedEvent();
            DctmOahHandler.publish("D2_EVENT_IFRAME_INIT", message.toString());
          }
          if (me.options.nodes.length > 0) {
            var nodesCollection = me.options.nodes.models[0].collection;
            var widgetPref = nodesCollection && nodesCollection.node && nodesCollection.node.get("widgetPreference") || nodesCollection && nodesCollection["widgetPreference"], widgetType = widgetPref && widgetPref.widgetType || nodesCollection.widgetType, widgetName = widgetPref && widgetPref.widgetName || nodesCollection.options && nodesCollection.options.widgetName;
            var optionsData = {
              widgetType: widgetType,
              config: widgetName
            };
            if (me.options.nodes.length === 1) {
              optionsData["type"] = me.options.nodes.models[0].get("type");
              optionsData["aContentType"] = me.options.nodes.models[0].get("aContentType");
              optionsData[eventsConstants.OAM.PARAM_ID] = me.options.nodes.models[0].get("id");
              DctmOahHandler.publishMessage("D2_EVENT_SELECT_OBJECT", optionsData);
            }
            var ids = [];
            me.options.nodes.each(function(item) {
              ids.push(item.get("id"));
            });
            optionsData[eventsConstants.OAM.PARAM_ID] = ids.join(eventsConstants.OAM.PARAM_SEPARATOR);
            DctmOahHandler.publishMessage("D2_EVENT_SELECT_OBJECTS", optionsData);
          }
        }.bind(this)
      });
    },
    _publishDisplayedEvent: function() {
      var options = {};
      options[eventsConstants.OAM.PARAM_VALUE] = true;
      options[eventsConstants.OAM.PARAM_TARGET_ID] = this.options.widgetConfig.entries[0].content.properties["r_object_id"];
      DctmOahHandler.publishMessage("D2_EVENT_IFRAME_DISPLAYED", options);
    },
    _getClientId: function() {
      var oamId = new OpenAjaxMessage();
      oamId.setId(this.options.widgetConfig.entries[0].content.properties["object_name"]);
      oamId.setTargetType(this.options.widgetConfig.entries[0].content.properties["widget_type"]);
      oamId.setContainerUid(this.options.widgetConfig.entries[0].content.properties["r_object_id"]);
      oamId.set("time", new Date().getMilliseconds().toString());
      return oamId.toString();
    },
    onDestroy: function() {
      DctmOahHandler.removeIframeContainer(this.d2OahIiframeContainer);
    },
    _subscribeDmTicket: function() {
      var me = this;
      DctmOahHandler.subscribeEvent({
        event: "D2_ACTION_DM_TICKET_GENERATE",
        callbackFunction: function(event, ticketRequestMessage) {
          var isSecure = ticketRequestMessage.get("is_secure") ? ticketRequestMessage.get("is_secure") : true;
          var connector = me.options.context.getObject(ConnectionFactory);
          var url = RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.SELF) + "/dm-ticket";
          url = Url.appendQuery(url, Url.combineQueryString({
            secure: isSecure,
            timeout: RestResources.getD2Options()["dm_server_ticket_timeout"]
          }));
          $.ajax(connector.extendAjaxOptions({
            url: url,
            type: "GET",
            headers: {
              "Content-Type": constants.MediaTypes.DCTM_JSON
            },
            success: function(data) {
              var currentTime = new Date().getMilliseconds();
              DctmOahHandler.publishMessage("D2_EVENT_DM_TICKET_GENERATED", {
                oam_sender: ticketRequestMessage.get(ticketRequestMessage.PARAM_SENDER),
                oam_cuid: ticketRequestMessage.get(ticketRequestMessage.PARAM_CONTAINER_UID),
                is_encrypted: isSecure,
                ticket: data["dm-ticket"],
                ticket_timeout: RestResources.getD2Options()["dm_server_ticket_timeout"],
                ticket_time_generated: currentTime.toString(),
                ticket_time_expiration: currentTime + RestResources.getD2Options()["dm_server_ticket_timeout"]
              });
            }
          }));
        }
      });
    }
  });
  _.extend(ExternalWidgetView.prototype, LayoutViewEventsPropagationMixin);
  return ExternalWidgetView;
});