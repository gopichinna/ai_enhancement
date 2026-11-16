/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
(function() {
  const {
    bootHold,
    handleError,
    require,
    addExtension,
    addBundleIndex,
    config
  } = sv;
  const promise = bootHold();
  const pluginModeInUrl = sv.getUrlParameterValue("plugin_mode");
  const allowedPluginModes = [ "thin", "wsctf" ];
  if (pluginModeInUrl && allowedPluginModes.indexOf(pluginModeInUrl) > -1) {
    config.defaultPluginMode = pluginModeInUrl;
    if (pluginModeInUrl === "wsctf" && config.embedMode === true) {
      var pluginClientTypeInUrl = sv.getUrlParameterValue("plugin_client_type"), allowedPluginClientTypes = [ "browser", "non-browser" ];
      if (pluginClientTypeInUrl && allowedPluginClientTypes.indexOf(pluginClientTypeInUrl) > -1) {
        config.pluginClientType = pluginClientTypeInUrl;
      }
    }
  }
  require.config({
    paths: {
      igc: config.svfPackagePath + "/igc"
    },
    map: {
      "*": {
        "nuc/models/node/server.adaptor.mixin": "d2/server.adaptors/models/node.mixin",
        "dctmw/models/session/cup.server.adaptor": "d2/server.adaptors/models/dctmw/session/cup.server.adaptor",
        "dctmw/utils/icons/icons": "d2/utils/icons/icons",
        "dctmw/utils/constants": "d2/utils/constants",
        "dctmw/utils/rest.linkrels": "d2/utils/rest.linkrels",
        "dctmw/utils/theme/theme.config.manager": "d2/utils/theme/theme.config.manager",
        "d2/utils/sort.utils": "dctmw/utils/sort.utils",
        "nuc/models/node.actions/server.adaptor.mixin": "d2/server.adaptors/models/node.actions.mixin",
        "nuc/models/node.addable.type/server.adaptor.mixin": "d2/server.adaptors/models/node.addable.type.mixin",
        "nuc/models/node.ancestors/server.adaptor.mixin": "d2/server.adaptors/models/node.ancestors.mixin",
        "nuc/models/node.children/server.adaptor.mixin": "d2/server.adaptors/models/node.children2.mixin",
        "nuc/models/node.children2/server.adaptor.mixin": "d2/server.adaptors/models/node.children2.mixin",
        "csui/models/node.facets/server.adaptor.mixin": "d2/server.adaptors/models/node.facets.mixin",
        "csui/models/node.facets/facet.query.mixin": "d2/server.adaptors/models/facet.query.mixin",
        "csui/models/server.adaptors/favorite.model.mixin": "d2/server.adaptors/models/widget/favorites/favorite.model.mixin",
        "csui/models/server.adaptors/nodeversions.mixin": "d2/server.adaptors/models/nodeversions.mixin",
        "csui/models/server.adaptors/version.mixin": "d2/server.adaptors/models/version.mixin",
        "csui/models/server.adaptors/largefilesettings.mixin": "d2/server.adaptors/models/largefilesettings.mixin",
        "csui/models/server.adaptors/objecttypes.mixin": "d2/server.adaptors/models/objecttypes.mixin",
        "csui/models/widget/favorites.model": "d2/server.adaptors/models/widget/favorites/favorites.model",
        "csui/models/widget/recentlyaccessed/server.adaptor.mixin": "d2/server.adaptors/models/widget/recentlyaccessed/recentlyaccessed.mixin",
        "csui/models/widget/search.results/search.metadata/server.adaptor.mixin": "d2/server.adaptors/models/widget/search.results/search.metadata/search.metadata.mixin",
        "csui/models/widget/search.results/server.adaptor.mixin": "d2/server.adaptors/models/widget/search.results/search.results.mixin",
        "csui/utils/commands/download": "d2/commands/download",
        "csui/utils/commands/delete": "d2/commands/delete",
        "csui/utils/commands/switch.to.classic": "d2/commands/switch.to.classic",
        "csui/utils/commands/reserve": "d2/commands/reserve",
        "csui/utils/commands/unreserve": "d2/commands/unreserve",
        "csui/utils/commands/email.link": "d2/commands/email.link",
        "csui/utils/commands/versions/delete": "d2/commands/versions.delete",
        "csui/utils/commands/copy.link": "d2/commands/copy.link",
        "csui/utils/commands/add.version": "d2/commands/add.version",
        "csui/utils/commands/open": "d2/commands/open",
        "csui/utils/commands/open.plugins/impl/core.open.plugins": "d2/commands/open.plugins/d2.open.plugins",
        "csui/utils/promoted.actionitems": "d2/utils/promoted.actionitems",
        "csui/utils/impl/nls/localized.strings": "d2/utils/icons/impl/nls/localized.strings",
        "csui/controls/table/table.columns": "d2/controls/table/table.columns",
        "csui/controls/facet.panel/facet.panel.view": "d2/controls/facet.panel/facet.panel.view",
        "csui/controls/facet.bar/facet.bar.view": "d2/controls/facet.bar/facet.bar.view",
        "csui/widgets/metadata/impl/metadata.properties.content.view": "d2/widgets/metadata/impl/metadata.properties.content.view",
        "csui/widgets/metadata/metadata.forms/server.adaptor.mixin": "d2/server.adaptors/widgets/metadata/metadata.forms/metadata.forms.mixin",
        "csui/widgets/recentlyaccessed/recentlyaccessed.columns": "d2/widgets/recentlyaccessed/recentlyaccessed.columns",
        "csui/widgets/metadata/versions.toolbaritems": "d2/widgets/metadata/panels/versions/metadata.versions.toolbaritems",
        "csui/models/server.adaptors/widget.settings.model.mixin": "d2/server.adaptors/models/widget.settings.model.mixin",
        "csui/models/server.adaptors/widget.settings.collection.mixin": "d2/server.adaptors/models/widget.settings.collection.mixin",
        "dctmw/pages/signin/style/signin.ext": "d2/pages/signin/style/signin.ext"
      }
    },
    config: {
      "dctmw/utils/authenticators/base.authenticator": {
        applicationPageUrl: "#d2"
      },
      "csui/widgets/nodestable/nodestable.view": {
        useV2RestApi: true
      },
      "csui/widgets/search.results/search.results.view": {
        enableSearchSettings: true,
        csui: {
          fetchFacets: false
        }
      },
      "d2/commands/node.actions.rules": {
        embedMode: !!config.embedMode
      },
      "csui/integration/folderbrowser/commands/go.to.node.history": {
        enabled: !!config.embedMode
      },
      "d2/widgets/nodestable/toolbaritems": {
        showFavoriteToolitem: !config.embedMode
      },
      "d2/server.adaptors/models/node.children2.mixin": {
        showFavoriteColumn: !config.embedMode
      },
      "d2/server.adaptors/models/node.mixin": {
        showFavoriteColumn: !config.embedMode
      },
      "csui/utils/commands/thumbnail.toggle": {
        enableGridView: true
      },
      "csui/widgets/metadata/metadata.audit.view": {
        enabled: false
      },
      "csui/widgets/metadata.navigation/metadata.navigation.view": {
        delayRestCommands: true
      },
      "csui/widgets/metadata/impl/header/dropdown.menu/dropdown.menu.view": {
        fetchLazyActions: true
      },
      "csui/widgets/metadata/versions.toolbaritems.mask": {
        masks: {
          blacklist: [ "DocPreview" ]
        }
      },
      "csui/widgets/nodestable/headermenuitems.mask": {
        dropdownMenuList: {
          blacklist: [ "Aviator-LaunchChat" ]
        }
      },
      "d2/widgets/taskstable/task.toolbaritems.masks": {
        masks: {
          inlineActionbar: {
            blacklist: [ "D2-WorkflowEmailPerformers" ]
          },
          workingFileListInlineActionbar: {
            blacklist: [ "Properties" ]
          },
          supportingFileListInlineActionbar: {
            blacklist: [ "Properties" ]
          },
          detailViewActionBar: {
            whitelist: [ "D2-AcquireTask", "D2-ForwardTask", "D2-RejectTask" ]
          },
          detailViewHeaderDropdown: {
            blacklist: [ "D2-AcquireTask", "D2-ForwardTask", "D2-RejectTask", "D2-AddTaskNote", "D2-WorkflowManageAttachment", "D2-WorkflowEmailPerformers" ]
          },
          filesRelationTableInlineActionbar: {
            blacklist: [ "D2-RelationDelete" ]
          },
          filesRelationTableSelectionToolbar: {
            blacklist: [ "D2-RelationDelete" ]
          }
        }
      },
      "d2/widgets/workflowstable/workflow.toolbaritems.masks": {
        masks: {
          workingFileListInlineActionbar: {
            blacklist: [ "Properties" ]
          },
          supportingFileListInlineActionbar: {
            blacklist: [ "Properties" ]
          },
          detailViewHeaderDropdown: {
            blacklist: [ "D2-AddWorkflowNote", "D2-WorkflowManageAttachment" ]
          },
          filesRelationTableInlineActionbar: {
            blacklist: [ "D2-RelationDelete" ]
          },
          filesRelationTableSelectionToolbar: {
            blacklist: [ "D2-RelationDelete" ]
          },
          timelineInlineActionBar: {
            blacklist: [ "D2-AddTaskNote", "D2-WorkflowManageAttachment", "D2-ReadTask", "D2-UnreadTask" ]
          },
          timelineDigitalSignatureInlineActionBar: {
            whitelist: [ "D2-WorkflowAbort" ]
          }
        }
      },
      "csui/widgets/metadata/add.properties.menuitems.mask": {
        addPropertiesToolbar: {
          blacklist: [ {
            dynamic: true
          } ]
        }
      },
      "d2/widgets/d2collections.perspective/impl/d2collections.toolbaritems.mask": {
        inlineActionbar: {},
        collectionsInlineToolBar: {
          blacklist: [ "D2-rename-collection", "D2-GoToD2Collection" ]
        },
        collectionsInlineActionBar: {
          blacklist: [ "D2-rename-collection", "D2-GoToD2Collection" ]
        },
        headerMenuToolbar: {
          blacklist: [ "D2-GoToD2Collection" ]
        }
      },
      "d2/widgets/splitview.widgets/impl/vdoc.edit.toolbaritems.mask": {
        editVDInlineActionbar: {
          whitelist: [ "D2-ConvertToSimpleDoc", "addversion", "ReserveDoc", "UnreserveDoc", "D2-VDAddVersion", "D2-Print", "CopyLink", "D2-VDocRemoveChildren", "D2-GoToLocation" ]
        }
      },
      "d2/widgets/splitview.widgets/impl/splitview.doclist.toolbaritems.mask": {
        inlineActionbar: {
          whitelist: [ "ReserveDoc", "D2-AddToCollections", "D2-CompareVDoc", "Download", "addversion", "UnreserveDoc", "D2-VDAddVersion", "D2-Print", "CopyLink", "D2-VDocRemoveChildren" ]
        }
      },
      "csui/widgets/metadata/header.dropdown.menu.items.mask": {
        dropdownMenuList: {
          blacklist: [ "D2-Permissions" ]
        }
      }
    }
  });
  addExtension("d2/d2-core-extensions.json");
  addBundleIndex(`${config.otherBundlesLocation}/d2/bundles/d2-core-index.js`);
  if (!config.mobile) {
    require.config({
      map: {
        "*": {
          "csui/widgets/metadata/impl/versions/metadata.versions.columns": "d2/models/base.columns",
          "csui/widgets/nodestable/toolbaritems": "d2/widgets/nodestable/toolbaritems",
          "csui/widgets/nodestable/toolbaritems.masks": "d2/widgets/nodestable/toolbaritems.masks",
          "csui/widgets/favorites/favorites.view": "d2/widgets/favorites/favorites.view",
          "csui/widgets/favorites/favorite.star.view": "d2/widgets/favorites/favorite.star.view",
          "csui/widgets/recentlyaccessed/recentlyaccessed.view": "d2/widgets/recentlyaccessed/recentlyaccessed.view",
          "csui/widgets/search.results/nls/lang": "d2/widgets/search.results/nls/lang",
          "csui/controls/settings/settings.view": "d2/controls/search.table.settings.view/search.table.settings.view",
          "csui/widgets/navigation.header/controls/search/search.view": "d2/widgets/navigation.header/controls/search/legacy.search.view",
          "csui/controls/pagination/nls/localized.strings": "d2/controls/pagination/nls/localized.strings",
          "csui/pages/start/impl/root.perspective.router": "d2/pages/start/impl/root.perspective.router",
          "csui/utils/contexts/perspective/impl/root.perspective.context.plugin": "d2/utils/contexts/perspective/impl/root.perspective.context.plugin",
          "csui/utils/commands/copy": "d2/commands/copy",
          "csui/utils/thumbnail/server.adaptor.mixin": "d2/server.adaptors/models/thumbnail.object.mixin",
          "esoc/commands/comment/comment.command": "d2/commands/comment",
          "esoc/widgets/socialactions/comment/server.adaptor.mixin": "d2/server.adaptors/models/esoc/comment.model.mixin",
          "esoc/widgets/socialactions/reply/server.adaptor.mixin": "d2/server.adaptors/models/esoc/reply.model.mixin",
          "esoc/widgets/socialactions/commentscollection/server.adaptor.mixin": "d2/server.adaptors/models/esoc/commentscollection.model.mixin",
          "esoc/widgets/socialactions/replycollection/server.adaptor.mixin": "d2/server.adaptors/models/esoc/replycollection.model.mixin",
          "esoc/widgets/tablecell/server.adaptor.mixin": "d2/server.adaptors/models/esoc/tablecell.model.mixin",
          "csui/controls/node.state/nls/lang": "d2/overrides/csui/controls/node.state/nls/lang",
          "csui/controls/node.state/impl/reservation/nls/lang": "d2/overrides/csui/controls/node.state/nls/lang",
          "csui/controls/table/cells/reservation/impl/nls/lang": "d2/overrides/csui/controls/node.state/nls/lang",
          "aie/controllers/chat/chat.node.adapter": "d2/server.adaptors/aviator/chat.node.adapter",
          "aie/controllers/chat/chat.server.adapter": "d2/server.adaptors/aviator/chat.server.adapter",
          "aie/models/many.nodes/server.adaptor.mixin": "d2/server.adaptors/aviator/chat.reference.nodes.mixin"
        }
      },
      config: {
        "csui/dialogs/node.picker/start.locations/start.location.collection": {
          masks: {
            defaults: {
              whitelist: [ "csui/dialogs/node.picker/start.locations/current.location", "csui/dialogs/node.picker/start.locations/personal.volume", "csui/dialogs/node.picker/start.locations/recent.containers", "csui/dialogs/node.picker/start.locations/default.location" ]
            }
          }
        },
        "csui/widgets/navigation.header/navigation.header.controls": {
          masks: {
            defaults: {
              whitelist: [ "csui/widgets/navigation.header/controls/home/home.view", "csui/widgets/navigation.header/controls/breadcrumbs/breadcrumbs.view", "csui/widgets/navigation.header/controls/search/search.view", "csui/widgets/navigation.header/controls/user.profile/user.profile.view", "csui/widgets/navigation.header/controls/favorites/favorites.view" ]
            }
          }
        },
        "csui/widgets/search.box/search.box.view": {
          showOptionsDropDown: false
        },
        "csui/pages/start/start.page.view": {
          signInPageUrl: config.signinPageUrl || "signin"
        },
        "esoc/widgets/metadata/impl/activity/metadata.activity.view": {
          enabled: false
        },
        "csui/widgets/metadata/metadata.properties.view": {
          topAlignLabel: true
        },
        "csui/widgets/metadata/metadata.view": {
          showExtraRightActionBar: true
        },
        "csui/widgets/metadata/metadata.versions.view": {
          enabled: false
        },
        "d2/ctf/wsHandler": {
          pluginClientType: config.pluginClientType
        },
        "d2/ctf/utils": {
          defaultPluginMode: config.defaultPluginMode
        },
        "d2/integration/embed.mode.rules": {
          defaultPluginMode: config.defaultPluginMode
        },
        "d2/utils/url.utils": {
          embedMode: !!config.embedMode
        }
      }
    });
    addExtension("d2/d2-desktop-extensions.json");
    addBundleIndex(`${config.otherBundlesLocation}/d2/bundles/d2-desktop-index.js`);
  }
  csui.require([ "nuc/lib/require.config!d2/overrides/lang.json" ], () => {
    promise.resolve();
  }, handleError);
})();