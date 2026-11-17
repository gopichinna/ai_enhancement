/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "csui/models/command", "d2/controls/globalmessage/globalmessage", "csui/utils/non-emptying.region/non-emptying.region", "d2/models/virtual.document.children", "dctmw/utils/rest.resources", "d2/utils/widget.constants", "i18n!d2/commands/nls/localized.strings" ], function(require, _, $, Marionette, CommandModel, GlobalMessage, NonEmptyingRegion, VirtualDocumentChildren, RestResources, widgetConstants, lang) {
  "use strict";
  return CommandModel.extend({
    defaults: {
      signature: "D2-TableSettings",
      name: lang.CommandNameTableSettings,
      scope: "single"
    },
    enabled: function() {
      return true;
    },
    execute: function(status) {
      var me = this, userDefaultWidgets = RestResources.getCurrentUser().get("defaultWidgets"), defaultContainer = status.modalDialogContainer || me.getContainerForTableSettings(), useAdditionalViewContainer = status.toolItem && status.toolItem.get("useAdditionalViewContainer") === true, manageVersions = !(status.toolItem && status.toolItem.get("manageVersions") === false), manageMarkupStatus = status.toolItem && status.toolItem.get("manageMarkupStatus") === true && (userDefaultWidgets && userDefaultWidgets[widgetConstants.DEFAULT.BRAVAIV] ? true : false), manageShowWFAssociation = status.toolItem && status.toolItem.get("manageWorkflowStatus") === true, versionsStorageKey = status.toolItem && status.toolItem.get("versionsStorageKey"), manageColumnSettings = status.toolItem && status.toolItem.get("manageColumnSettings"), deferred = $.Deferred();
      if (useAdditionalViewContainer === true) {
        var region = new NonEmptyingRegion({
          el: defaultContainer
        }), settingsContainerView = new Marionette.ItemView({
          className: "d2-table-settings-container",
          template: false
        });
        region.show(settingsContainerView);
        defaultContainer = settingsContainerView.el;
      }
      this.originatingView = status.originatingView;
      this.collection = status.collection;
      this.applyProgressBlocker = this.originatingView && _.isFunction(this.originatingView.blockActions) && _.isFunction(this.originatingView.unblockActions);
      require([ "d2/widgets/table/table.settings.view" ], function(TableSettingsView) {
        var pref = this.collection.node && this.collection.node.get("widgetPreference") || this.collection["widgetPreference"] || [], view = new TableSettingsView({
          el: defaultContainer,
          originatingEl: status.toolItemView.$el,
          prefColumns: pref.columnPreference && pref.columnPreference.columns || this.collection && this.collection.columnPreference && this.collection.columnPreference.columns || [],
          manageVersions: manageVersions,
          manageMarkupStatus: manageMarkupStatus,
          manageShowWFAssociation: manageShowWFAssociation,
          versionsStorageKey: versionsStorageKey,
          manageColumnSettings: manageColumnSettings,
          connector: this.collection.connector,
          preferenceUpdateCallback: _.bind(this.preferenceUpdated, this),
          fixedColumns: status.toolItem && status.toolItem.get("fixedColumns"),
          supportedTableModes: me.getSupportedTableModes(pref, status),
          commandStatus: status
        }), destroyTableSetttings = function() {
          var $tableSettingsEl = $(defaultContainer).find(".d2-table-settings");
          if ($tableSettingsEl && $tableSettingsEl.length > 0) {
            $tableSettingsEl.remove();
          }
        };
        view.render();
        view.on("destroy", destroyTableSetttings);
        view.listenTo(status.context, "sync change:perspective", destroyTableSetttings);
        view.listenTo(pref.columnPreference, "change", () => {
          me.forceResetWidgetPreference = true;
        });
        deferred.resolve();
      }.bind(this), deferred.reject);
      return deferred.promise();
    },
    getContainerForTableSettings: function() {
      var modalContainer = $.fn.binf_modal.getDefaultContainer();
      return $("<div>", {
        class: "d2-table-settings-container"
      }).appendTo(modalContainer)[0];
    },
    getSupportedTableModes: function(widgetPref, status) {
      var supportedTableModes = [];
      if (status.toolItem && status.toolItem.get("allowTableModeChange") === true) {
        supportedTableModes.push(widgetConstants.TableModes.WRAP);
        supportedTableModes.push(widgetConstants.TableModes.NOWRAP);
        if (widgetPref && widgetPref.widgetConfig && widgetPref.widgetConfig.getParam("is_enable_thumbnail_smartview") === "true") {
          supportedTableModes.push(widgetConstants.TableModes.THUMBNAIL);
        }
      }
      return supportedTableModes;
    },
    preferenceUpdated: function(doOnlyCollectionRefresh, attrChanged) {
      var me = this, pref = me.collection.node && me.collection.node.get("widgetPreference") || me.collection["widgetPreference"] || [], columnPreference = pref.columnPreference || me.collection.columnPreference;
      if (doOnlyCollectionRefresh === true) {
        me.refreshCollectionAndClientColumns(doOnlyCollectionRefresh, attrChanged);
      } else {
        if (me.originatingView.columns || columnPreference.columns) {
          columnPreference.columns.each(function(pref) {
            if (pref.get("selected")) {
              var data = {
                name: pref.get("name"),
                label: pref.get("label"),
                width: 50
              };
              pref.clear();
              pref.set(data);
            }
          });
          columnPreference.save().done(function() {
            me.updateTableStyleInHTMLHead();
            me.refreshCollectionAndClientColumns();
          }).fail(function(xhr, status, err) {
            GlobalMessage.showMessage("error", lang.TableSettingsSavePrefFailed, err);
          });
        }
      }
    },
    refreshCollectionAndClientColumns: function(isOnlyCollectionRefresh, attrChanged) {
      delete this.collection.clientColumns;
      this.applyProgressBlocker && this.originatingView.blockActions();
      this.collection.setTop(0, false);
      var options = {
        reload: true,
        forceResetWidgetPreference: this.forceResetWidgetPreference
      };
      if (this.collection instanceof VirtualDocumentChildren) {
        if (isOnlyCollectionRefresh === true && (!attrChanged || !_.isBoolean(attrChanged["showWFAssociationIcon"]))) {
          var model = this.collection.node || this.collection;
          return model.resetWidgetPreference().always(function() {
            this.applyProgressBlocker && this.originatingView.unblockActions();
          }.bind(this));
        } else {
          options.skipMergeWithMirrorOnFetch = true;
        }
      }
      return this.collection.fetch(options).always(function() {
        this.adjustSelectedPageInOriginatingView();
        this.applyProgressBlocker && this.originatingView.unblockActions();
      }.bind(this));
    },
    adjustSelectedPageInOriginatingView: function() {
      var pageView = this.originatingView.paginationView;
      if (pageView) {
        var currentPageIndex = pageView.currentPageNum - 1, skipCount = pageView.pageSize * currentPageIndex;
        pageView.changePage(skipCount >= pageView._getTotalCount() ? 0 : currentPageIndex);
      }
    },
    updateTableStyleInHTMLHead: function() {
      var styleElementId = "adjusted_colstyles_js_" + this.originatingView?.tableView?.cid;
      if (document.getElementById(styleElementId)) {
        document.getElementById(styleElementId).innerHTML = "";
      }
    }
  });
});