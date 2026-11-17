/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/utils/url", "nuc/lib/marionette", "d2/commands/open.plugins/impl/markup.migration/view", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "dctmw/dialogs/authentication/oauth.login.dialog", "d2/utils/documentation.utils", "dctmw/utils/client.location", "dctmw/utils/authenticators/session", "i18n!d2/commands/open.plugins/nls/localized.strings" ], function($, _, Url, Marionette, markupMigrationView, RestResources, RestLinkrels, OAuthLoginDialog, DocumentationUtils, clientLocation, Session, lang) {
  "use strict";
  var store = [ {
    accessToken: null,
    accessTokenExpiry: null
  } ];
  var tokenExpeiredTime = 900;
  var ivUserInfoLink = "iv-user-info";
  let IVUserInfo, IVConfig;
  const migrationStatusConstants = Object.freeze({
    migrationStatusComplete: "COMPLETE",
    migrationStatusInprogress: "INPROGRESS",
    migrationStatusFailed: "FAILED",
    migrationStatusNotApplicable: "NA",
    migrationStatusTitleUpdateFailed: "TITLE_UPDATE_FAILED"
  });
  var viewerUtils = {
    markupMigrationStartedCache: {},
    migrationStatusConstants: migrationStatusConstants,
    hasRegularLicense: -1,
    getIVUserInfo: function(connector) {
      var me = this;
      var deffered = $.Deferred();
      if (connector && IVUserInfo === undefined) {
        this.getAccessToken(connector).done(function(loginToken) {
          me.fetchIvUserInfo(connector, loginToken).done(function(userInfo) {
            if (userInfo && userInfo.license && userInfo.license === "FULLTIME_USERS_REGULAR") {
              me.hasRegularLicense = 1;
            } else {
              me.hasRegularLicense = 0;
            }
            IVUserInfo = userInfo;
            deffered.resolve(userInfo);
          });
        }).fail(function(error) {
          deffered.reject(error);
        });
      } else {
        deffered.resolve(IVUserInfo);
      }
      return deffered.promise();
    },
    fetchIvUserInfo: function(connector, loginToken) {
      var currRepoLinks = RestResources.getCurrentRepository().get("links");
      var userInfoUrl = Url.combine(RestLinkrels.getLink(currRepoLinks, RestLinkrels.SELF), ivUserInfoLink);
      return $.ajax(connector.extendAjaxOptions({
        url: userInfoUrl,
        type: "GET",
        contentType: "application/json",
        headers: {
          "IV-LOGIN-TOKEN": loginToken
        }
      }));
    },
    getAccessToken: function(connector) {
      var deffered = $.Deferred(), me = this, appContext = Session.get().getContext();
      const params = clientLocation.getHashParams();
      if (this._getAccessToken()) {
        return deffered.resolve(this._getAccessToken()).promise();
      }
      if (appContext && appContext.isEmbeddedMode && params && !_.isEmpty(params["access_token"])) {
        return deffered.resolve(params["access_token"]).promise();
      }
      this.getBravaIViewerConfiguration(connector).done(function() {
        me.validateLoginAndGetToken(connector).done(function(accessToken, expiresIn) {
          me._setAccessToken(accessToken, expiresIn);
          deffered.resolve(me._getAccessToken());
        }).fail(function(error) {
          deffered.reject(error);
        });
      }).fail(function(error) {
        deffered.reject(error);
      });
      return deffered.promise();
    },
    getBravaIViewerConfiguration: function(connector) {
      var def = $.Deferred();
      if (IVConfig === undefined) {
        this._getBravaIViewerConfiguration(connector).done(function(response) {
          IVConfig = response.properties;
          def.resolve(response.properties);
        }).fail(function(error) {
          def.reject(error);
        });
      } else {
        def.resolve(IVConfig);
      }
      return def.promise();
    },
    validateLoginAndGetToken: function(connector) {
      var authUrl = RestResources.getProductInfo().get("otds_url") + "/otdsws/login";
      var dialog = new OAuthLoginDialog({
        connector: connector,
        url: authUrl,
        clientId: RestResources.getProductInfo().get("otds_client_id"),
        strings: {
          authUrlErrorTitle: lang.authUrlErrorTitle
        }
      });
      return dialog.login().then(function(accessToken, expiresIn) {
        return $.Deferred().resolve(accessToken, expiresIn).promise();
      }).catch(function(msg) {
        return $.Deferred().reject(msg).promise();
      });
    },
    _getBravaIViewerConfiguration: function(connector) {
      var configAPI = RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.D2_BRAVAIVIEWER_CONFIG_OPTIONS);
      return $.ajax(connector.extendAjaxOptions({
        url: configAPI,
        type: "GET",
        contentType: "application/json"
      }));
    },
    _getAccessToken: function() {
      var token = store.accessToken, expiry = store.accessTokenExpiry;
      if (token && expiry && new Date().getTime() < expiry - 6e4) {
        return token;
      } else {
        delete store.accessToken;
        delete store.accessTokenExpiry;
      }
    },
    _setAccessToken: function(accessToken, expiresIn) {
      if (!expiresIn) {
        expiresIn = tokenExpeiredTime;
      }
      store.accessToken = accessToken;
      store.accessTokenExpiry = new Date().getTime() + expiresIn * 1e3;
    },
    setHelpUrl: function(layout) {
      var def = $.Deferred();
      var options = {
        commandData: {
          URL: this.getRootHelpUrl(layout)
        },
        moduleNamePattern: "^iv"
      };
      DocumentationUtils.getHelpUrl(options).done(function(helpUrl) {
        this.setHelpUrlToLayout(layout, helpUrl);
      }.bind(this)).always(function() {
        def.resolve();
      });
      return def.promise();
    },
    getRootHelpUrl: function(layout) {
      var rootHelpUrl = "";
      _.each(layout.toolbarWithMarkupStuff, function(toolbarSection) {
        _.each(toolbarSection, function(tool) {
          if (tool.component === "HelpButton") {
            rootHelpUrl = tool.helpUrl;
          }
        });
      });
      return rootHelpUrl;
    },
    setHelpUrlToLayout: function(layout, helpUrl) {
      _.each(layout.toolbarWithMarkupStuff, function(toolbarSection) {
        _.each(toolbarSection, function(tool) {
          if (tool.component === "HelpButton") {
            tool.helpUrl = helpUrl;
          }
        });
      });
    },
    getMarkupMigrationStatusByObjectIds(connector, objectIds) {
      var queryParam = "";
      _.each(objectIds, function(objectId) {
        if (queryParam === "") {
          queryParam = "object-ids=" + objectId;
        } else {
          queryParam += "&object-ids=" + objectId;
        }
      });
      var currRepoLinks = RestResources.getCurrentRepository().get("links");
      var markupMigrationStatusUrl = Url.combine(RestLinkrels.getLink(currRepoLinks, RestLinkrels.SELF), "objects/markup-migration-status");
      var migrationStatusUrl = Url.appendQuery(markupMigrationStatusUrl, Url.combineQueryString(queryParam));
      return $.ajax(connector.extendAjaxOptions({
        url: migrationStatusUrl,
        type: "GET",
        contentType: "application/json"
      }));
    },
    getMarkupCounts(connector, objectIds) {
      var deffered = $.Deferred(), me = this;
      var graphQuery = `query ($sources: [String!]) {
              markupCounts(sources: $sources) {
                  source
                  count
                  deleted
              }
          }`;
      var graphVariables = {
        sources: objectIds
      };
      this.getBravaIViewerConfiguration(connector).done(function(ivConfiguration) {
        var markupGraphqlApi = ivConfiguration.brava_markup_service_url + "/markup/api/v1/graphql";
        me.getAccessToken(connector).done(function(loginToken) {
          me._fetchMarkupCounts(connector, loginToken, markupGraphqlApi, graphQuery, graphVariables).done(function(results) {
            var markupCounts = {}, markupCountsRes = results?.data?.markupCounts;
            if (markupCountsRes?.length > 0) {
              _.each(markupCountsRes, function(object) {
                markupCounts[object.source] = {
                  markup_count: object.count
                };
              });
            }
            deffered.resolve({
              markupCount: markupCounts
            });
          });
        }).fail(function(error) {
          deffered.reject(error);
        });
      });
      return deffered.promise();
    },
    _fetchMarkupCounts(connector, loginToken, markupGraphApi, graphQuery, graphVariables) {
      return $.ajax({
        url: markupGraphApi,
        type: "POST",
        contentType: "application/json",
        headers: {
          Authorization: "Bearer " + loginToken
        },
        data: JSON.stringify({
          query: graphQuery,
          variables: graphVariables
        })
      });
    },
    isMigrationEnabled: function() {
      return RestResources.getD2Options().is_markup_migration_to_iv_enabled;
    },
    getAccessibilityLayout: function() {
      const accessibleLayout = {
        topToolbar: "toolbarAccessible",
        toolbarAccessible: {
          a11y: true,
          left: [ {
            component: "PreviousPageButton"
          }, {
            component: "PageSelector"
          }, {
            component: "NextPageButton"
          }, {
            component: "ZoomOutButton"
          }, {
            component: "ZoomInButton"
          }, {
            component: "RotateButton"
          }, {
            component: "PageTextButton"
          } ],
          center: [],
          right: [ {
            component: "CloseButton"
          } ]
        },
        mainContainer: [ {
          component: "TabContainer",
          layoutKey: "tabContainerEmpty"
        }, {
          component: "PageContainer"
        } ],
        tabContainerEmpty: {
          sidebarName: "tabContainerEmpty",
          primary: "primary",
          tabs: []
        }
      };
      return accessibleLayout;
    },
    isMarkupMigrationStartedForAny: function(connector, documentIds) {
      var me = this, dfd = $.Deferred(), requiredToFetchData = [], isMigrated = false;
      _.each(documentIds, function(docId) {
        if (me.markupMigrationStartedCache[docId] === undefined) {
          requiredToFetchData.push(docId);
        } else if (me.markupMigrationStartedCache[docId] === true) {
          isMigrated = true;
        }
      });
      if (isMigrated) {
        return dfd.resolve(isMigrated).promise();
      }
      if (requiredToFetchData.length > 0) {
        this.getMarkupMigrationStatusByObjectIds(connector, requiredToFetchData).done(function(statusData) {
          var markupMigration = {};
          if (statusData && statusData.markupMigration && statusData.markupMigration.length > 0) {
            _.each(statusData.markupMigration, function(object) {
              markupMigration[object.object_id] = object.status;
            });
          }
          _.each(requiredToFetchData, function(docId) {
            var isMigratedDoc = false;
            if (markupMigration[docId]) {
              isMigratedDoc = _.contains([ migrationStatusConstants.migrationStatusInprogress, migrationStatusConstants.migrationStatusComplete, migrationStatusConstants.migrationStatusNotApplicable, migrationStatusConstants.migrationStatusTitleUpdateFailed ], markupMigration[docId]);
              if (isMigratedDoc) {
                isMigrated = isMigratedDoc;
              }
            }
            me.markupMigrationStartedCache[docId] = isMigratedDoc;
          });
          dfd.resolve(isMigrated);
        }).fail(function() {
          dfd.resolve(true);
        });
      } else {
        dfd.resolve(isMigrated).promise();
      }
      return dfd.promise();
    }
  };
  return viewerUtils;
});