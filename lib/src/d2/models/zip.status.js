/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/models/node/node.model", "nuc/utils/url", "csui/utils/contexts/factories/connector", "d2/utils/rest.linkrels", "d2/utils/constants", "d2/utils/server.query.utils", "d2/dialogs/zipanddownload/zip.download.utils", "i18n!d2/utils/job.tracker/impl/nls/lang" ], function(_, $, Backbone, NodeModel, Url, ConnectorFactory, RestLinkrels, constants, ServerQueryUtils, ZipDownloadUtils, lang) {
  "use strict";
  return NodeModel.extend({
    constructor: function ZipStatusModal(attributes, options) {
      options = options || {};
      NodeModel.prototype.constructor.apply(this, arguments);
      this.options = options;
      this.listenTo(this, "abort", this.cancel);
      this.listenTo(this, "finished", this.download);
    },
    url: function() {
      var id = this.get("id");
      if (!id) {
        throw new Error("Zip status not supported via model");
      }
      var href = RestLinkrels.getLink(this.get("links"), RestLinkrels.D2_ZIP_DOWNLOAD_STATUS);
      if (href) {
        var params = {
          inline: true
        };
        href = ServerQueryUtils.appendQueryParams(href, params);
      } else {
        href = RestLinkrels.getLink(this.get("links"), RestLinkrels.SELF);
      }
      return href;
    },
    parse: function(response) {
      return response;
    },
    sync: function(method, model, options) {
      var me = this, dfd = $.Deferred(), oldSuccess = options.success, oldError = options.error;
      options.error = function() {
        oldError && oldError.apply(options.context, arguments);
        dfd.reject.apply(dfd, arguments);
      };
      options.success = function(model, status, xhr) {
        oldSuccess.call(options.context, model, status, xhr);
        dfd.resolve();
      };
      Backbone.Model.prototype.sync.call(me, method, model, options);
      return dfd.promise();
    },
    getState: function() {
      if (this.get("status") === "COMPLETED") {
        return "resolved";
      }
      if (this.get("status") === "INPROGRESS") {
        return "processing";
      }
      if (this.get("status") === "CANCELLED") {
        return "aborted";
      }
      return "pending";
    },
    getHeaderTitle: function() {
      var headerTitle;
      switch (this.get("status")) {
       case "COMPLETED":
        headerTitle = lang.CompletedHeaderTitle;
        break;

       case "INPROGRESS":
        headerTitle = lang.ProcessingHeaderTitle;
        break;

       case "CANCELLED":
        headerTitle = lang.AbortedHeaderTitle;
        break;

       default:
        headerTitle = lang.PendingHeaderTitle;
      }
      return headerTitle;
    },
    actionType: function() {
      return "ZIP-" + _.uniqueId();
    },
    cancel: function() {
      var url = this.url();
      var params = {
        action: "CANCEL"
      };
      url = Url.appendQuery(url, Url.combineQueryString(params));
      var connector = this.options.context ? this.options.context.getObject(ConnectorFactory) : this.options.connector;
      $.ajax(connector.extendAjaxOptions({
        url: url,
        type: "PUT",
        headers: {
          "Content-Type": constants.MediaTypes.DCTM_JSON
        },
        success: function() {
          console.log("reached here");
        },
        error: function() {}
      }));
    },
    download: function() {
      var url = RestLinkrels.getLink(this.get("links"), RestLinkrels.D2_ZIP_DOWNLOAD_CONTENT);
      var params = {
        file_name: this.get("default_name")
      };
      url = Url.appendQuery(url, Url.combineQueryString(params));
      ZipDownloadUtils.downloadContent(url);
    }
  });
});