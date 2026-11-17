/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "require", "i18n", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/moment", "nuc/models/member", "nuc/models/actions", "nuc/utils/log", "csui/utils/contexts/factories/connector", "csui/utils/contexts/factories/user", "nuc/utils/url", "nuc/utils/namedlocalstorage", "dctmw/models/formats", "dctmw/utils/session.utils", "d2/models/table/dm.types.holder", "dctmw/server.adaptors/converters/user", "dctmw/server.adaptors/converters/node", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "d2/utils/theme/theme.config.manager", "d2/utils/constants", "d2/utils/widget.constants", "dctmw/utils/utils", "d2/utils/node.utils", "d2/utils/server.query.utils", "d2/utils/landingpage/landingpage.utils", "d2/utils/search.utils", "d2/utils/menu.utils", "d2/utils/graphics/graphics.resources", "d2/commands/open.plugins/impl/iviewer/utils", "d2/controls/globalmessage/globalmessage", "dctmw/utils/authenticators/session", "d2/utils/filter.utils", "i18n!d2/server.adaptors/models/impl/nls/lang", "d2/utils/landingpage/landingpage.preference.store", "d2/utils/open.window.popup", "d2/utils/icons/icons" ], function(module, require, i18n, _, $, Backbone, moment, MemberModel, ActionCollection, log, ConnectorFactory, UserModelFactory, Url, NamedLocalStorage, FormatCollection, DctmwSessionUtils, DctmTypesHolder, userConverter, NodeConverter, RestResources, RestLinkrels, ThemeConfigManager, constants, widgetConstants, utils, nodeUtils, serverQueryUtils, landingPageUtils, searchUtils, menuUtils, GraphicsResources, iviewerUtils, GlobalMessage, Session, FilterUtils, lang, landingPreferenceStore, openWindowPopup) {
  "use strict";
  var logger = log(module.id);
  return {
    beforeStartup: function(options) {
      var me = this, dfd = $.Deferred();
      options = options || {};
      if (!options.context) {
        return dfd.reject("context parameter is mandatory in the options for startup");
      }
      me.context = options.context;
      me.connector = me.context.getObject(ConnectorFactory);
      Session.get().on("end", GlobalMessage.cleanupPreviousMessagesForD2);
      me.loadD2Overrides(options).then(me.getLastUsedLandingPage.bind(me)).then(me.beforeSDKStartup.bind(me)).then(me.fetchStartupDataInBatch.bind(me)).done(function() {
        searchUtils.getSearchConfiguration({
          connector: me.connector
        });
        me._fetchHomeCabinetId();
        dfd.resolve();
      }).fail(dfd.reject);
      return dfd.promise();
    },
    afterStartup: function(options) {
      return this.afterSDKStartup(options).then(() => {
        const dfd = $.Deferred();
        require([ "d2/utils/contexts/context.controller" ], D2ContextController => {
          D2ContextController.init(this.context);
          dfd.resolve();
        }, dfd.reject);
        return dfd.promise();
      });
    },
    loadD2Overrides: function(options) {
      const dfd = $.Deferred(), reqs = [ "d2/overrides/d2.core.overrides" ];
      if (!utils.isMobile()) {
        reqs.push("d2/overrides/d2.desktop.overrides");
      }
      require(reqs, () => {
        dfd.resolve(options);
      }, dfd.reject);
      return dfd.promise();
    },
    fetchStartupDataInBatch: function(options = {}) {
      var me = this, deferred = $.Deferred(), currRepoLinks = RestResources.getCurrentRepository().get("links"), batchPayload = [ {
        id: "userMenu",
        request: {
          method: "GET",
          uri: Url.appendQuery(RestLinkrels.getLink(currRepoLinks, RestLinkrels.ACTIONS), Url.combineQueryString({
            type: constants.MenuTypes.USER
          }))
        }
      }, {
        id: "d2Options",
        request: {
          method: "GET",
          uri: RestLinkrels.getLink(currRepoLinks, RestLinkrels.D2_OPTIONS)
        }
      }, {
        id: "landingPage",
        request: {
          method: "GET",
          uri: Url.appendQuery(Url.combine(RestLinkrels.getLink(currRepoLinks, RestLinkrels.D2_CONFIGURATIONS), "landing-page-configs"), Url.combineQueryString({
            inline: true
          }))
        }
      }, {
        id: "widgetConfigs",
        request: {
          method: "GET",
          uri: Url.appendQuery(RestLinkrels.getLink(currRepoLinks, RestLinkrels.D2_WIDGETS), Url.combineQueryString({
            inline: true
          }))
        }
      }, {
        id: "formats",
        request: {
          method: "GET",
          uri: Url.appendQuery(RestLinkrels.getLink(currRepoLinks, RestLinkrels.FORMATS), Url.combineQueryString({
            inline: true,
            "items-per-page": 1e5
          }))
        }
      }, {
        id: "menuActions",
        request: {
          method: "GET",
          uri: Url.appendQuery(RestLinkrels.getLink(currRepoLinks, RestLinkrels.ACTIONS), Url.combineQueryString({
            "include-subtype": true
          }))
        }
      }, {
        id: "dmTypes",
        request: {
          method: "GET",
          uri: Url.appendQuery(Url.combine(RestLinkrels.getLink(currRepoLinks, RestLinkrels.SELF), "d2-types"), Url.combineQueryString({
            inline: true
          }))
        }
      }, {
        id: "graphics",
        request: {
          method: "GET",
          uri: Url.appendQuery(RestLinkrels.getLink(currRepoLinks, RestLinkrels.D2_GRAPHICS_CONFIG), Url.combineQueryString({
            inline: true
          }))
        }
      }, {
        id: "bwgraphics",
        request: {
          method: "GET",
          uri: Url.appendQuery(Url.combine(RestLinkrels.getLink(currRepoLinks, RestLinkrels.SELF), "bws-types-definition"), Url.combineQueryString({
            inline: true,
            view: "icon_name,object_name",
            links: false
          }))
        }
      } ];
      utils.makeBatchAjaxCall({
        connector: me.connector,
        operations: batchPayload
      }).done(function(successful, failed) {
        if (failed && failed.length > 0) {
          var errorMessage;
          var nonFatalFailures = [ "menuActions", "userMenu", "landingPage", "bwgraphics" ];
          _.each(failed, function(operation) {
            if (nonFatalFailures.includes(operation.id)) {
              if (operation.id !== "bwgraphics") {
                errorMessage = (errorMessage || "") + (operation.output.message + "\n");
              }
            } else {
              deferred.reject();
              return false;
            }
          });
          if (errorMessage) {
            GlobalMessage.showMessage("error", errorMessage, lang.menuMisconfigurationErrorMessage);
          }
        }
        var landingPage, widgetConfigs = {}, graphicsConfig, BwGraphics = [];
        _.each(successful, function(operation) {
          var data = operation.output;
          switch (operation.id) {
           case "userMenu":
            var userActionItems = serverQueryUtils._parseActions(data, "user");
            RestResources.getCurrentUser().set("MenuActions", new ActionCollection(userActionItems[""]));
            break;

           case "d2Options":
            var d2Options = _.pick(data.properties, "logout_redirect_url", "core_share_configurations", "brava_configurations", "file_ending_configuration", "max_upload_file_size", "user_profile_image_extensions", "workflowReportingTimeout", "session_timeout", "token_refresh_allowed", "session_timeout_timer", "is_client_tz_aware", "is_markup_migration_to_iv_enabled", "max_files_allowed_for_multifile_view_iv", "dm_server_ticket_timeout", "oes_enabled", "oes_supported_extensions", "go_to_location_enabled", "oes_file_size_limit_in_mb");
            RestResources.setD2Options(d2Options);
            DctmwSessionUtils.reConfigureUserSessionModule({
              sessionTimeout: d2Options["session_timeout"],
              sessionTimeoutTimer: d2Options["session_timeout_timer"],
              allowTokenRefresh: d2Options["token_refresh_allowed"]
            });
            break;

           case "landingPage":
            if (data.entries && data.entries.length > 0) {
              if (options.lastUsedLandingPage) {
                const lp = data.entries.find(e => e.content.properties["object_name"] === options.lastUsedLandingPage);
                landingPage = lp && lp.content;
              }
              if (!landingPage) {
                const lp = data.entries.find(e => e.content.properties["is_default_landing_config"] === true);
                landingPage = lp && lp.content;
              }
              if (!landingPage) {
                landingPage = data.entries[0].content;
              }
            } else {
              deferred.reject(lang.landingPageError);
            }
            break;

           case "widgetConfigs":
            widgetConfigs = data.entries || [];
            break;

           case "formats":
            var formats = (data.entries || []).map(function(entry) {
              return _.extend(_.pick(entry.content, "is-default"), _.pick(entry.content.properties, "name", "r_object_id", "mime_type", "dos_extension", "description", "is_hidden"));
            });
            RestResources.setFormats(new FormatCollection(formats));
            break;

           case "menuActions":
            var actionItems = data.entries[0] && data.entries[0].content && data.entries[0].content.actionItems || [];
            menuUtils.loadActionsForMenuContext(actionItems);
            break;

           case "dmTypes":
            var subTypes = {}, superTypes = {}, labels = {};
            _.each(data.entries || [], function(entry) {
              var name = entry.content.name, parent = entry.content.parent;
              labels[name] = entry.content.label || name;
              if (parent) {
                superTypes[name] = parent;
                if (!subTypes[parent]) {
                  subTypes[parent] = [];
                }
                subTypes[parent].push(name);
              }
            });
            RestResources.setDctmTypeData(new DctmTypesHolder(subTypes, superTypes, labels));
            break;

           case "graphics":
            graphicsConfig = data.entries;
            GraphicsResources.setGraphicsRules(graphicsConfig);
            break;

           case "bwgraphics":
            _.each(data.entries, entry => {
              var rule = entry?.content?.properties;
              if (rule?.icon_name) {
                BwGraphics.push({
                  group: "type",
                  condition: "",
                  className: rule?.icon_name,
                  value: rule?.object_name,
                  title: rule?.object_name,
                  sequence: 3,
                  bwsType: rule?.object_name
                });
              }
            });
            GraphicsResources.setGraphicsRules(BwGraphics);
            break;
          }
        });
        if (deferred.state() === "rejected") {
          return;
        }
        try {
          landingPageUtils.processLandingPageWidgets(landingPage, widgetConfigs);
        } catch (e) {
          return deferred.reject(e);
        }
        me._setPreferredTimezone();
        const lpName = landingPage.properties["object_name"];
        options.lastUsedLandingPage = lpName;
        landingPreferenceStore.savePreferredLPName(lpName).always(() => {
          me.context.getModel(UserModelFactory, {
            permanent: true
          }).ensureFetched().done(function() {
            var searchSettings = _.defaults({}, RestResources.getCurrentUser().get("settings"), {
              searchFocusEnabled: false
            }), headerControlModuleName;
            if (searchSettings.searchFocusEnabled) {
              var userId = RestResources.getCurrentUser().get("id");
              var userPreferences = userId ? new NamedLocalStorage("userPreferences:" + userId) : undefined;
              if (userPreferences) {
                userPreferences.set("breadcrumbs-visible", true);
              }
              headerControlModuleName = "d2/pages/start/impl/navigationheader/navigation.header.controls";
              window.csui.require.config({
                map: {
                  "*": {
                    "csui/pages/start/impl/navigationheader/navigationheader.view": "d2/pages/start/impl/navigationheader/navigationheader.view"
                  }
                }
              });
            } else {
              headerControlModuleName = "csui/widgets/navigation.header/navigation.header.controls";
            }
            if (utils.isMobile()) {
              return deferred.resolve();
            }
            require([ headerControlModuleName ], function(headerControls) {
              if (headerControls.rightSide instanceof Backbone.Collection) {
                headerControls.rightSide.add([ {
                  id: "smart/controls/progresspanel/progressbar.maximize/progressbar.maximize.view",
                  sequence: 90,
                  parentClassName: "csui-progressbar-maximize"
                } ]);
                var defaultWidgets = RestResources.getCurrentUser().get("defaultWidgets"), defaultCollectionWidget = defaultWidgets && defaultWidgets[widgetConstants.DEFAULT.COLLECTIONS], widgetConfig = defaultCollectionWidget && serverQueryUtils.getWidgetConfig(widgetConstants.D2.COLLECTIONS, defaultCollectionWidget), showCollectionIcon = widgetConfig && widgetConfig.widgetParams && widgetConfig.widgetParams["is_header_control_smartview"];
                if (showCollectionIcon) {
                  headerControls.rightSide.add([ {
                    id: "d2/widgets/navigation.header/controls/d2collections/d2collectionsIcon.view",
                    sequence: 200,
                    parentClassName: "d2-collection d2-icons no-collection"
                  } ]);
                }
                if (RestResources.getD2Options()?.oes_enabled) {
                  openWindowPopup.initialize();
                }
                me.checkAndGetIVUserInfo(me.connector).done(function() {
                  deferred.resolve();
                }).fail(deferred.reject);
              } else {
                deferred.reject();
              }
            }, deferred.reject);
          }).fail(deferred.reject);
        });
      }).fail(deferred.reject);
      return deferred.promise();
    },
    _setPreferredTimezone: function() {
      if (!RestResources.getD2Options().is_client_tz_aware) {
        const preferred_tz = RestResources.getProductInfo().get("preferred_tz"), message = `*************** Running Smart View client in ${preferred_tz} Timezone ***************`;
        logger.info(message) && console.log(logger.last);
        moment.tz.setDefault(preferred_tz);
        if (_.isFunction(Session.get().connector?.authenticator?.setTimezone)) {
          Session.get().connector.authenticator.setTimezone(preferred_tz);
        }
      } else {
        moment.tz.setDefault(moment.tz.guess());
      }
    },
    _fetchHomeCabinetId: function() {
      var connector = this.connector, deferred = $.Deferred(), currUser = RestResources.getCurrentUser(), url = RestLinkrels.getLink(currUser.get("links"), RestLinkrels.DEFAULT_FOLDER);
      $.ajax(connector.extendAjaxOptions({
        url: url,
        success: function(response) {
          var homeCabinet = {
            id: response.properties.r_object_id,
            links: response.links
          };
          NodeConverter.setNodeType(homeCabinet);
          currUser.set("_home_cabinet", homeCabinet);
          _.each(RestResources.getWigetConfigs()[widgetConstants.D2.DOCLIST], function(item) {
            if (item.getParam("is_show_home_cabinet") === "true" && item.getParam("start_path_smartview") === nodeUtils.getHomeCabinetId()) {
              delete item.widgetParams["is_show_home_cabinet"];
            }
            if (item.getParam("content_type") === "DQL" && item.getParam("start_path_smartview")) {
              delete item.widgetParams["start_path_smartview"];
            }
          });
          deferred.resolve();
        },
        error: function(xhr, textStatus, errorThrown) {
          deferred.reject(utils.parseAjaxErrorAsString(xhr, textStatus, errorThrown));
        }
      }));
      return deferred.promise();
    },
    beforeSDKStartup: function(options) {
      var dfd = $.Deferred();
      if (utils.isMobile()) {
        dfd.resolve(options);
      } else {
        require([ "d2/utils/sdk.startup" ], function(sdkStartup) {
          sdkStartup.beforeStartup(options).always(function() {
            dfd.resolve(options);
          });
        }, dfd.reject);
      }
      return dfd.promise();
    },
    afterSDKStartup: function(options) {
      var dfd = $.Deferred();
      if (utils.isMobile()) {
        dfd.resolve();
      } else {
        require([ "d2/utils/sdk.startup" ], function(sdkStartup) {
          sdkStartup.afterStartup(options).always(function() {
            dfd.resolve(options);
          });
        }, dfd.reject);
      }
      return dfd.promise();
    },
    getLastUsedLandingPage: function(options) {
      options.lastUsedLandingPage = landingPreferenceStore.getPreferredLPName();
      return $.Deferred().resolve(options).promise();
    },
    checkAndGetIVUserInfo: function(connector) {
      var deferred = $.Deferred(), userDefaultWidgets = RestResources.getCurrentUser().get("defaultWidgets"), userHasDefaultBravaIntelligentViewerWidget = userDefaultWidgets && userDefaultWidgets[widgetConstants.DEFAULT.BRAVAIV];
      if (userHasDefaultBravaIntelligentViewerWidget) {
        iviewerUtils.getIVUserInfo(connector).done(deferred.resolve).fail(deferred.reject);
      } else {
        deferred.resolve();
      }
      return deferred.promise();
    }
  };
});