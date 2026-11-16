/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "d2/widgets/metadata/panels/permissions/permissions.model", "d2/widgets/metadata/panels/permissions/permission.set.model", "d2/widgets/metadata/panels/permissions/impl/permissions.form.view", "d2/widgets/metadata/panels/permissions/impl/security.template.form.view", "d2/widgets/metadata/panels/permissions/impl/permission.set.table.view", "d2/controls/userorgroupcombosearch.form/userorgroupcombosearch.form.view", "d2/utils/constants", "d2/utils/widget.constants", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "hbs!d2/widgets/metadata/panels/permissions/impl/metadata.permissions.view", "i18n!d2/widgets/metadata/panels/permissions/impl/nls/lang", "css!d2/widgets/metadata/panels/permissions/impl/metadata.permissions.view" ], function(_, $, Backbone, Marionette, PerfectScrollingBehavior, PermissionsModel, PermissionSetModel, PermissionsFormView, SecurityTemplateFormView, PermissionSetTableView, UserOrGroupComboSearchFormView, constants, widgetConstants, RestResources, RestLinkrels, MetadataPermissionsTemplate, lang) {
  "use strict";
  var MetadataPermissionsView = Marionette.LayoutView.extend({
    template: MetadataPermissionsTemplate,
    className: "d2-metadata-permissions-wrapper",
    ui: {
      myPermissionsForm: ".d2-metadata-my-permissions-form",
      securityTemplateForm: ".d2-metadata-security-template-form",
      permissionSetTable: ".d2-metadata-permission-set-table",
      searchUserPermissionsForm: ".d2-search-user-permissions-form",
      userPermissionsDiv: ".user-permissions-div",
      userPermissionsValueSpan: ".user-permissions-value"
    },
    regions: {
      myPermissionsFormRegion: "@ui.myPermissionsForm",
      securityTemplateFormRegion: "@ui.securityTemplateForm",
      permissionSetTableRegion: "@ui.permissionSetTable",
      searchUserPermissionsFormRegion: "@ui.searchUserPermissionsForm"
    },
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: ".csui-metadata-permissions"
      }
    },
    constructor: function MetadataPermissionsView(options) {
      MetadataPermissionsView.__super__.constructor.call(this, options);
    },
    onShow: function() {
      if (this.options.context.viewStateModel.get("lastRouter") !== "Metadata") {
        var me = this;
        setTimeout(function() {
          me._showViews();
        }, 1e3);
      } else {
        this._showViews();
      }
    },
    _showViews: function() {
      var me = this;
      this._fetchPermissionSetLinkRelFromObectsAPI().done(function() {
        me._setFormView();
        me._setPermissionTableView();
        me._setSearchUserPermissionsFormView();
      });
    },
    _fetchPermissionSetLinkRelFromObectsAPI: function() {
      var deferred = $.Deferred(), me = this;
      var permissionsUrl = RestLinkrels.getLink(me.model.get("links"), RestLinkrels.D2_PERMISSIONS), permissionSetModelUrl = RestLinkrels.getLink(me.model.get("links"), RestLinkrels.D2_PERMISSION_SET);
      if (permissionsUrl && permissionSetModelUrl) {
        deferred.resolve();
      } else {
        me.model.fetch().done(function() {
          deferred.resolve();
        });
      }
      return deferred.promise();
    },
    _setFormView: function() {
      var me = this, modelAttributes = {
        nodeId: me.model.get("id")
      }, modelOptions = {
        nodeModel: me.model,
        connector: me.model.connector
      };
      var myPermissionsModel = new PermissionsModel(modelAttributes, modelOptions);
      myPermissionsModel.fetch().done(function() {
        var myPermissionsFormView = new PermissionsFormView(myPermissionsModel, me.options);
        me.myPermissionsFormRegion.show(myPermissionsFormView);
      });
    },
    _setSecurityTemplateView: function(model) {
      var securityTemplateFormView = new SecurityTemplateFormView(model, this.options);
      this.securityTemplateFormRegion.show(securityTemplateFormView);
      this._isSecurityTemplateFormRendered = true;
    },
    _setPermissionTableView: function(accessorQueryParam, tabName) {
      tabName = tabName || "permissions";
      var me = this, modelAttributes = {
        nodeId: me.model.get("id")
      }, modelOptions = {
        nodeModel: me.model,
        connector: me.model.connector
      };
      if (accessorQueryParam) {
        modelOptions.accessorQueryParam = accessorQueryParam;
      }
      var permissionSetModel = new PermissionSetModel(modelAttributes, modelOptions);
      permissionSetModel.fetch().done(function(response) {
        if (!me.permissionSetResponseForLoggedInUser) {
          me.permissionSetResponseForLoggedInUser = response;
        }
        if (!me._isSecurityTemplateFormRendered) {
          me._setSecurityTemplateView(new Backbone.Model({
            aclCombinedName: permissionSetModel.get("aclCombinedName")
          }));
        }
        var responseCopy = JSON.parse(JSON.stringify(response)), customCollectionOptions = {
          tabName: tabName,
          fetchedResponse: responseCopy,
          context: me.options.context
        }, permissionSetTableViewOptions = {
          model: me.model,
          connector: me.model.connector,
          originatingView: me.options.originatingView,
          customCollectionOptions: customCollectionOptions
        };
        if (!me.permissionSetTableView) {
          me._initializePermissionSetTable(permissionSetTableViewOptions);
        } else {
          me._resetPermissionTableCollection(customCollectionOptions);
        }
      });
    },
    _initializePermissionSetTable: function(tableOptions) {
      this.permissionSetTableView = new PermissionSetTableView(tableOptions);
      this.listenTo(this.permissionSetTableView.collection, "collection:set:limit", this._onPermissionSetTableChangePage);
      this.permissionSetTableRegion.show(this.permissionSetTableView);
      this.permissionSetTableHeight = {
        headerRowHeight: this.permissionSetTableView.$el.find(".csui-table-view thead tr").height(),
        bodyRowHeight: this.permissionSetTableView.$el.find(".csui-table-view tbody tr").height(),
        paginationViewHeight: this.permissionSetTableView.ui.paginationView.height()
      };
    },
    _resetPermissionTableCollection: function(customCollectionOptions) {
      this.ui.permissionSetTable.removeClass("more-than-10-rows");
      this.permissionSetTableView.options.customCollectionOptions = customCollectionOptions;
      this.permissionSetTableView.collection.resetCollection(customCollectionOptions.fetchedResponse);
      var remainingRowsInPage = this._calculateRemainingRowsInPage(), actualTableHeight = this._calculateActualTableHeight(remainingRowsInPage);
      this._applyBestFitHeightForTable(actualTableHeight);
    },
    _setSearchUserPermissionsFormView: function() {
      this.options.userOrGroupSearchFieldOptions = {
        placeholder: lang.userOrGroupComboSearchPlaceholder
      };
      var searchUserPermissionsFormView = new UserOrGroupComboSearchFormView(this.options);
      this.listenTo(searchUserPermissionsFormView, "d2:userorgroup:search:value:change", this._onD2UserOrGroupSearchValueChange);
      this.searchUserPermissionsFormRegion.show(searchUserPermissionsFormView);
    },
    _onD2UserOrGroupSearchValueChange: function(newSearchedValueObject) {
      var searchedUserOrGroupId = newSearchedValueObject && newSearchedValueObject.searchedUserOrGroupId || "";
      var searchedUserOrGroupName = newSearchedValueObject && newSearchedValueObject.searchedUserOrGroupName || "";
      if (!searchedUserOrGroupName || searchedUserOrGroupName === "") {
        this._clearSearchedUsersBasicAndExtendedPermissions();
        this._resetPermissionTableView();
      } else {
        this._showSearchedUsersBasicAndExtendedPermissions(searchedUserOrGroupName);
        this._setPermissionTableView(searchedUserOrGroupId);
      }
    },
    _clearSearchedUsersBasicAndExtendedPermissions: function() {
      this.ui.userPermissionsValueSpan.html("");
      this.ui.userPermissionsDiv.attr("tabindex", -1);
      this.ui.userPermissionsDiv.addClass("binf-hidden");
    },
    _resetPermissionTableView: function(tabName) {
      tabName = tabName || "permissions";
      var responseCopy = JSON.parse(JSON.stringify(this.permissionSetResponseForLoggedInUser)), customCollectionOptions = {
        tabName: tabName,
        fetchedResponse: responseCopy
      };
      this._resetPermissionTableCollection(customCollectionOptions);
    },
    _showSearchedUsersBasicAndExtendedPermissions: function(searchedUserOrGroupName) {
      var me = this, modelAttributes = {
        nodeId: me.model.get("id")
      }, modelOptions = {
        nodeModel: me.model,
        connector: me.model.connector,
        accessorNameQueryParam: searchedUserOrGroupName
      };
      var userPermissionsModel = new PermissionsModel(modelAttributes, modelOptions);
      userPermissionsModel.fetch().done(function() {
        var accessorName = userPermissionsModel.get("accessorName"), translatedBasicPermission = me._getTranslatedBasicPermission(userPermissionsModel.get("basicPermission")), translatedExtendedPermissions = me._getTranslatedExtendedPermissions(userPermissionsModel.get("extendedPermissions"))["translatedString"], value = translatedExtendedPermissions === "" ? _.str.sformat(lang.userOrGroupBasicPermissionText, accessorName, translatedBasicPermission) : _.str.sformat(lang.userOrGroupBasicAndExtendedPermissionsText, accessorName, translatedBasicPermission, translatedExtendedPermissions), ariaLabel = value;
        if (translatedBasicPermission) {
          value = value.replace(translatedBasicPermission, "<span class='d2-highlight-text'>" + translatedBasicPermission + "</span>");
        }
        if (translatedExtendedPermissions && translatedExtendedPermissions !== "") {
          value = value.replace(translatedExtendedPermissions, "<span class='d2-highlight-text'>" + translatedExtendedPermissions + "</span>");
        }
        me.ui.userPermissionsValueSpan.html(value);
        me.ui.userPermissionsDiv.attr("aria-label", ariaLabel);
        me.ui.userPermissionsDiv.attr("tabindex", 0);
        me.ui.userPermissionsDiv.removeClass("binf-hidden");
      });
    },
    _getTranslatedBasicPermission: function(permissionCode) {
      if (permissionCode) {
        return lang[permissionCode] || "";
      }
      return "";
    },
    _getTranslatedExtendedPermissions: function(extendedPermissions) {
      if (extendedPermissions) {
        var extendedPermissionsArray = extendedPermissions.split(","), joinedExtendedPermissionsString = "", translatedArray = [];
        extendedPermissionsArray.forEach(function(permissionCode, index) {
          translatedArray[index] = {
            id: permissionCode,
            label: lang[permissionCode] || ""
          };
          joinedExtendedPermissionsString = index === 0 ? translatedArray[index]["label"] : _.str.sformat(lang.extendedPermissionsFormatter, joinedExtendedPermissionsString, translatedArray[index]["label"]);
        });
        return {
          translatedString: joinedExtendedPermissionsString,
          translatedArray: translatedArray
        };
      }
      return {
        translatedString: "",
        translatedArray: []
      };
    },
    _onPermissionSetTableChangePage: function() {
      this.ui.permissionSetTable.removeClass("more-than-10-rows");
      var remainingRowsInPage = this._calculateRemainingRowsInPage(), actualTableHeight = this._calculateActualTableHeight(remainingRowsInPage);
      this._applyBestFitHeightForTable(actualTableHeight);
    },
    _calculateRemainingRowsInPage: function() {
      var selectedPageSize = this.permissionSetTableView.paginationView.selectedPageSize, selectedPage = this.permissionSetTableView.paginationView.currentPageNum, remainingRowsInPage = this.permissionSetTableView.collection.totalCount - selectedPageSize * (selectedPage - 1);
      return remainingRowsInPage < selectedPageSize ? remainingRowsInPage : selectedPageSize;
    },
    _calculateActualTableHeight: function(rows) {
      return rows * this.permissionSetTableHeight.bodyRowHeight + this.permissionSetTableHeight.headerRowHeight + this.permissionSetTableHeight.paginationViewHeight + 64;
    },
    _applyBestFitHeightForTable: function(actualTableHeight) {
      if (this.$el.height() < actualTableHeight) {
        this.ui.permissionSetTable.addClass("more-than-10-rows");
      }
    }
  }, {
    enabled: function(options) {
      return !_.contains([ constants.Types.REPOSITORY, constants.Types.TASK, constants.Types.WORKFLOW ], options.node.get("type")) && !(options.node.get("id") === constants.NodeId.FAVORITES);
    }
  });
  return MetadataPermissionsView;
});