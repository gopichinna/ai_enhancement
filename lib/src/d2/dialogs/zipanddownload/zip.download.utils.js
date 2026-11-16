/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/utils/url", "nuc/utils/log", "csui/utils/contexts/factories/connector", "csui/utils/commandhelper", "dctmw/utils/rest.resources", "dctmw/server.adaptors/converters/node", "d2/utils/rest.linkrels", "d2/utils/constants" ], function(require, $, _, Url, log, ConnectorFactory, CommandHelper, RestResources, NodeConverter, RestLinkrels, constants) {
  "use strict";
  return {
    getValidationUrl: function() {
      return RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.D2_ZIP_DOWNLOAD_VALIDATION);
    },
    getZipDownloadUrl: function(statusNode) {
      return RestLinkrels.getLink(statusNode.get("links"), RestLinkrels.D2_ZIP_DOWNLOAD);
    },
    getDocIdsFromNode: function(nodes) {
      var docIds = [];
      nodes.each(function(node) {
        docIds.push(node.get("id"));
      });
      return docIds;
    },
    validateZipDownloadObjects: function(options, nodes) {
      var url = this.getValidationUrl();
      var params = {
        inline: true
      };
      if (options && options["include_subfolders"]) {
        params["include_subfolders"] = options["include_subfolders"];
      }
      if (options && options["include_only_manifest_file"]) {
        params["include_only_manifest_file"] = options["include_only_manifest_file"];
      }
      url = Url.appendQuery(url, Url.combineQueryString(params));
      var deferred = $.Deferred();
      var connector = options.context ? options.context.getObject(ConnectorFactory) : options.connector;
      $.ajax(connector.extendAjaxOptions({
        url: url,
        type: "POST",
        headers: {
          "Content-Type": constants.MediaTypes.DCTM_JSON
        },
        data: JSON.stringify({
          "object-ids": this.getDocIdsFromNode(nodes)
        }),
        success: function(response) {
          deferred.resolve(response);
        },
        error: function(request) {
          deferred.reject(request);
        }
      }));
      return deferred.promise();
    },
    getColumnInformation: function(options, status) {
      const columnInfo = [], columns = status.originatingView?.searchMetadataObj?.models, serverColumnAttribute = NodeConverter.getClientServerAttrNameMap();
      if (columns) {
        columns.map(col => {
          var col_key = col.get("column_key");
          if (col_key && serverColumnAttribute[col_key]) {
            columnInfo.push(serverColumnAttribute[col_key]);
          } else {
            columnInfo.push(col_key);
          }
        });
        options["column_information"] = columnInfo;
      }
    },
    initateZipDownload: function(options, nodes) {
      var url = this.getZipDownloadUrl(options["status_node"]);
      var params = {
        inline: true
      };
      if (options && options["include_subfolders"]) {
        params["include_subfolders"] = options["include_subfolders"];
      }
      if (options && options["c2_override"]) {
        params["c2_override"] = options["c2_override"];
      }
      if (options && !!options["encrypt_passphrase"]) {
        params["encryption_passphrase"] = options["encrypt_passphrase"];
      }
      if (options && options["widget_name"]) {
        params["widget_name"] = options["widget_name"];
      }
      if (options && options["widget_type"]) {
        params["widget_type"] = options["widget_type"];
      }
      if (options && options["include_only_manifest_file"]) {
        params["include_only_manifest_file"] = options["include_only_manifest_file"];
      }
      if (options && options["column_information"]) {
        params["view"] = options["column_information"].join(",");
      }
      url = Url.appendQuery(url, Url.combineQueryString(params));
      var deferred = $.Deferred();
      var connector = options.context ? options.context.getObject(ConnectorFactory) : options.connector;
      var me = this;
      $.ajax(connector.extendAjaxOptions({
        url: url,
        type: "POST",
        headers: {
          "Content-Type": constants.MediaTypes.DCTM_JSON
        },
        data: JSON.stringify({
          "object-ids": this.getDocIdsFromNode(nodes)
        }),
        success: function(response) {
          var attrs = response.properties;
          attrs.id = response.properties.r_object_id;
          attrs.type = options.actionType;
          attrs.links = response.links;
          attrs.default_name = options.default_name;
          me.addJob(options, attrs);
          deferred.resolve(options);
        },
        error: function(request) {
          deferred.reject(request);
        }
      }));
      return deferred.promise();
    },
    addJob: function(options, attrs) {
      require([ "d2/utils/job.tracker/job.tracker" ], function(JobTracker) {
        var jobTracker = JobTracker.get();
        jobTracker.addJob(options, attrs);
      });
    },
    downloadContent: function(url) {
      require([ "csui/dialogs/modal.alert/modal.alert", "d2/utils/download.manager", "dctmw/utils/utils", "i18n!d2/dialogs/zipanddownload/impl/nls/lang" ], function(Alert, DownloadManager, Utils, lang1) {
        DownloadManager.downloadFile(url, function(event, doc) {
          var responseData;
          try {
            responseData = doc && JSON.parse($(doc).text());
          } catch (err) {
            log.error("Error while parsing response", err);
          }
          var msg = responseData ? Utils.parseErrorAsString("object", responseData) : lang1.DownloadFailMessage;
          Alert.showError(msg);
        });
      });
    },
    _getDefaultZipFileName: function(status) {
      if (status.nodes && status.nodes.length && status.nodes.length === 1) {
        var node = CommandHelper.getJustOneNode(status);
        return node.get("name");
      } else {
        if (status.container) {
          return status.container.get("name");
        } else {
          if (status.originatingView && status.originatingView.getTitle) {
            return status.originatingView.getTitle();
          }
        }
      }
    },
    containsFolder: function(status) {
      var folderLength = status.nodes.filter(function(node) {
        return _.contains([ constants.Types.FOLDER, constants.Types.CABINET ], node.get("type"));
      }).length;
      return folderLength !== 0;
    },
    _getWidgetOptions: function(collection) {
      var obj = {};
      if (collection.widgetType === undefined) {
        if (collection.node && collection.node.widgetName !== undefined) {
          obj["widget_name"] = collection.node.widgetName;
          obj["widget_type"] = collection.node.widgetType;
        }
      } else {
        obj["widget_name"] = collection.options.widgetName === undefined ? collection.node.widgetName : collection.options.widgetName;
        obj["widget_type"] = collection.widgetType;
      }
      return obj;
    }
  };
});