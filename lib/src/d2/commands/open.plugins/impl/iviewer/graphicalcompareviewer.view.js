/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "d2/utils/rest.linkrels", "dctmw/utils/rest.resources", "nuc/utils/log", "nuc/utils/url", "csui/controls/globalmessage/globalmessage", "d2/utils/server.query.utils", "d2/utils/widget.constants", "d2/commands/open.plugins/impl/iviewer/utils", "d2/commands/open.plugins/impl/viewer.utils", "d2/commands/open.plugins/impl/iviewer/default.view", "i18n!d2/commands/open.plugins/nls/localized.strings" ], function(_, $, Marionette, RestLinkrels, RestResources, log, Url, GlobalMessage, serverQueryUtils, widgetConstants, iViewerUtils, viewerUtils, DefaultView, lang) {
  "use strict";
  var ivWidgetConfiguration, intelligentViewerConfig, isIVAnnotateDisabled, layout, userDefaultWidgets, currentUser = RestResources.getCurrentUser();
  if (currentUser && !_.isEmpty(currentUser)) {
    userDefaultWidgets = currentUser.get("defaultWidgets");
  }
  if (userDefaultWidgets && !_.isEmpty(userDefaultWidgets)) {
    ivWidgetConfiguration = serverQueryUtils.getWidgetConfig(widgetConstants.D2.BRAVAIV, userDefaultWidgets[widgetConstants.DEFAULT.BRAVAIV]);
  }
  if (ivWidgetConfiguration && !_.isEmpty(ivWidgetConfiguration)) {
    intelligentViewerConfig = JSON.parse(ivWidgetConfiguration.widgetParams["iv_configuration_graphical_compare"]);
    isIVAnnotateDisabled = ivWidgetConfiguration.widgetParams["is_iv_disable_annotate_g_compare"];
  }
  if (isIVAnnotateDisabled) {
    var removeAnnotationFeature = intelligentViewerConfig.leftTabContainer.tabs;
    _.each(removeAnnotationFeature, function(item) {
      if (item !== undefined && item.component === "MarkupPane") {
        removeAnnotationFeature.splice(removeAnnotationFeature.indexOf(item), 1);
      }
    });
  }
  if (intelligentViewerConfig && !_.isEmpty(intelligentViewerConfig)) {
    layout = _.defaults({
      topToolbar: "toolbarWithMarkupStuff",
      toolbarWithMarkupStuff: intelligentViewerConfig.toolbarWithMarkupStuff,
      mainContainer: [ {
        component: "TabContainer",
        layoutKey: "leftTabContainer"
      }, {
        component: "CompareContainer"
      } ]
    }, intelligentViewerConfig);
  }
  var viewerClassName = "d2-iv-graphical-compare";
  var appleMatches = navigator.userAgent.match(/(iPad)/i);
  if (appleMatches) {
    viewerClassName = "d2-iv-graphical-compare-ipad";
  }
  var IVGraphicalCompareViewer = DefaultView.extend({
    className: viewerClassName,
    constructor: function IVGraphicalCompareViewer(options) {
      DefaultView.prototype.constructor.call(this, options);
    },
    onShow: function() {
      var me = this;
      this.blockActions();
      this.getPublicationDeferred = this._getPublication();
      iViewerUtils.getBravaIViewerConfiguration(this.model.connector).done(function(bravaIViewerConfigutation) {
        me.bravaIVConfiguration = bravaIViewerConfigutation;
        iViewerUtils.getAccessToken(me.model.connector).done(function(token) {
          me.bearerToken = "Bearer " + token;
          viewerUtils.isRelatePermission(me.model.connector, [ me.nodes.at(0).get("id"), me.nodes.at(1).get("id") ]).done(function(permission) {
            me.isRelatePermission = permission;
            me._loadBravaViewerScripts();
          });
        }).fail(function() {
          GlobalMessage.showMessage("error", lang.IVDocumentLoadError);
          me.destroy();
        });
      }).fail(function() {
        GlobalMessage.showMessage("error", lang.IVDocumentLoadError);
        me.destroy();
      });
    },
    reloadViewer: function() {
      var me = this;
      this.clearViewer();
      this.migrationStatusTimer && clearInterval(this.migrationStatusTimer);
      this.hideMigrationStatusBar();
      if (this.isPreviewMode) {
        !this.isAppliedMask() && this.trigger("apply:mask");
      }
      this.blockActions();
      iViewerUtils.getAccessToken(this.model.connector).done(function(token) {
        me.bearerToken = "Bearer " + token;
        me.api.setHttpHeaders({
          Authorization: me.bearerToken
        });
        me.api.setSidebarOpen(false);
        viewerUtils.isRelatePermission(me.model.connector, [ me.nodes.at(0).get("id"), me.nodes.at(1).get("id") ]).done(function(permission) {
          me.isRelatePermission = permission;
          me.setPublicationToViewer().always(function() {
            me.unblockActions();
            me.setLayout(false);
          });
        });
      }).fail(function() {
        GlobalMessage.showMessage("error", lang.IVDocumentLoadError);
        me.destroy();
      });
    },
    addPublication: function(response) {
      this.addComparePublications(response, "graphical");
    },
    setLayout: function(isAnnotationDisable) {
      var layoutClone = JSON.parse(JSON.stringify(layout));
      if (isAnnotationDisable || this.isAnnotateDisabled()) {
        var removeAnnotationFeature = layoutClone.leftTabContainer && layoutClone.leftTabContainer.tabs;
        removeAnnotationFeature = removeAnnotationFeature.filter(function(value) {
          if (_.contains([ "MarkupPane", "StampRasterPane", "TakeoffPane" ], value.component)) {
            return false;
          } else {
            return true;
          }
        });
        layoutClone.leftTabContainer.tabs = removeAnnotationFeature;
      }
      iViewerUtils.setHelpUrl(layoutClone).done(function() {
        this.api.setLayout(layoutClone);
      }.bind(this));
    },
    isAnnotateDisabled: function() {
      var disabled = false;
      if (isIVAnnotateDisabled) {
        disabled = true;
      } else if (!this.isRelatePermission) {
        disabled = true;
      }
      return disabled;
    },
    _getPublication: function() {
      var currRepoLinks = RestResources.getCurrentRepository().get("links");
      var publicationUrl = Url.combine(RestLinkrels.getLink(currRepoLinks, RestLinkrels.SELF), "objects/iviewer-publication");
      var queryParam = {
        "object-ids": [ this.nodes.at(0).get("id"), this.nodes.at(1).get("id") ],
        type: "compare_view"
      };
      if (this.ivWidgetName && !_.isEmpty(this.ivWidgetName)) {
        queryParam["widget_name"] = this.ivWidgetName;
      }
      publicationUrl = Url.appendQuery(publicationUrl, Url.combineQueryString(queryParam));
      return $.ajax(this.model.connector.extendAjaxOptions({
        url: publicationUrl,
        type: "GET",
        contentType: "application/json"
      }));
    }
  });
  return IVGraphicalCompareViewer;
});