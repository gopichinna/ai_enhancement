/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "require", "csui/lib/underscore", "csui/lib/jquery", "csui/utils/url", "csui/models/node.actions", "csui/utils/commandhelper", "csui/utils/commands/download", "csui/utils/commands/open.plugins/open.plugins", "csui/utils/commands/open.mixin", "i18n!csui/utils/commands/nls/localized.strings" ], function(module, require, _, $, Url, NodeActionCollection, CommandHelper, DownloadCommand, openPlugins, OpenMixin, lang) {
  "use strict";
  var config = _.extend({
    openInNewTab: null,
    forceDownload: false,
    extSupportTypes: {}
  }, module.config());
  var supportTypes = [ 144, 749, 736, 2 ];
  supportTypes = Array.prototype.concat.apply(supportTypes, _.values(config.extSupportTypes));
  var openAuthenticatedPage, NextNodeModelFactory;
  var OpenCommand = DownloadCommand.extend({
    defaults: {
      signature: "Open",
      command_key: [ "default", "open", "download", "Download" ],
      scope: "single",
      openable: true,
      types: supportTypes,
      name: lang.CommandNameOpen
    },
    execute: function(status, options) {
      let self = this, node = CommandHelper.getJustOneNode(status);
      this.options = options;
      this.checkRendition(status, options);
      return self.getPlugin(node);
    },
    getPlugin: function(node) {
      return this.checkPermission(node).then(_.bind(function(permitted) {
        if (!permitted) {
          return this._showOverview(node, this.options);
        }
        if (config.forceDownload) {
          return this._downloadContent(node, this.options, "download");
        }
        var plugin = openPlugins.findByNode(node, {
          openInNewTab: config.openInNewTab
        });
        return plugin ? this._openContent(node, this.options, plugin) : this._downloadContent(node, this.options, "download");
      }, this));
    },
    _openContent: function(node, options, plugin) {
      if (config.openInNewTab) {
        return this._openWindow(plugin, node, window.open(""), options);
      }
      if (plugin.widgetView) {
        return this._openWidget(plugin.widgetView, node, options);
      }
      var content = config.openInNewTab === false ? window : window.open("");
      return this._openWindow(plugin, node, content, options);
    },
    _openWidget: function(view, node, options) {
      var deferred = $.Deferred();
      require([ "csui/utils/commands/impl/full.page.modal/full.page.modal.view", view ], function(FullPageModal, ViewerView) {
        var viewerView = new ViewerView({
          context: options.context,
          model: node
        }), fullPageModal = new FullPageModal({
          view: viewerView
        });
        fullPageModal.on("destroy", function() {
          deferred.resolve();
        }).show();
      }, deferred.reject);
      return deferred.promise();
    },
    _openWindow: function(plugin, node, content, options) {
      var deferred = $.Deferred();
      var self = this;
      require([ "csui/utils/open.authenticated.page" ], function() {
        openAuthenticatedPage = arguments[0];
        var opened = true;
        if (!content || !content.location) {
          content = parent.window;
          opened = false;
        }
        var promise = plugin.getUrl && plugin.getUrl(node) || plugin.getUrlQuery(node);
        promise.then(function(url) {
          return self._openURL(plugin, node, content, url, options);
        }, function(error) {
          if (opened && content !== window) {
            content.close();
          }
          deferred.reject(error);
          return $.Deferred().reject();
        }).then(function() {
          if (opened) {
            content.focus();
          }
          deferred.resolve();
        });
      }, deferred.reject);
      return deferred.promise();
    },
    _openURL: function(plugin, node, content, url, options) {
      var connector = node.connector || options.connector;
      if (!plugin.getUrl) {
        url = Url.appendQuery(new Url(connector.connection.url).getCgiScript(), Url.combineQueryString(url));
      }
      if (plugin.needsAuthentication && plugin.needsAuthentication(node)) {
        return openAuthenticatedPage(connector, url, {
          window: content,
          openInNewTab: config.openInNewTab
        });
      }
      content.location.href = url;
      return $.Deferred().resolve().promise();
    },
    checkPermission: function(node) {
      function doCheckActions() {
        if (node.actions.get("download")) {
          return true;
        } else {
          return false;
        }
      }
      if (!node.actions.length) {
        var openables = new NodeActionCollection(undefined, {
          connector: node.connector,
          nodes: [ node.get("id") ],
          commands: [ "download" ]
        });
        var promise = $.Deferred();
        openables.fetch().then(function() {
          var nodeId = node.get("id");
          var openable = openables.get(nodeId);
          node.actions.add(openable.actions.models);
          var permitted = doCheckActions();
          promise.resolve(permitted);
        });
        return promise;
      } else {
        return $.Deferred().resolve(doCheckActions()).promise();
      }
    },
    _showOverview: function(node, options) {
      var deferred = $.Deferred();
      require([ "csui/utils/contexts/factories/next.node" ], function() {
        NextNodeModelFactory = arguments[0];
        var nextNode = options.context.getModel(NextNodeModelFactory);
        var nodeId = node.get("id");
        nextNode.set("id", nodeId);
      }, deferred.reject);
      return deferred.promise();
    }
  });
  OpenMixin.mixin(OpenCommand.prototype);
  return OpenCommand;
});