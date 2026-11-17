/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/models/nodeancestors", "nuc/models/node/node.model", "nuc/models/nodes", "csui/controls/node-type.icon/node-type.icon.view", "csui/widgets/document.overview/document.overview.view", "csui/widgets/metadata/header.dropdown.menu.items", "csui/widgets/metadata/header.dropdown.menu.items.mask", "csui/widgets/favorites/favorite.star.view", "nuc/utils/base", "csui/utils/commandhelper", "csui/utils/contexts/factories/node", "csui/utils/contexts/factories/next.node", "csui/controls/table/cells/cell.registry", "esoc/widgets/tablecell/tablecell.view", "dctmw/utils/constants", "d2/server.adaptors/models/esoc/comments.utils", "d2/utils/node.version.utils", "d2/utils/rest.linkrels", "d2/utils/vdoc.utils", "hbs!d2/widgets/document.overview/impl/document.overview", "d2/widgets/document.overview/form.fields/version.navigator.field.view", "d2/widgets/document.overview/document.thumbnail.loader", "i18n!d2/widgets/document.overview/impl/nls/lang", "css!d2/widgets/document.overview/impl/document.overview" ], function(_, $, Backbone, Marionette, NodeAncestorCollection, NodeModel, NodeCollection, NodeTypeIconView, CSDocumentOverview, toolbarItems, ToolbarItemMasks, FavoriteStarView, Base, CommandHelper, NodeModelFactory, NextNodeModelFactory, TableCellRegistry, CommentView, Constants, CommentUtils, versionUtil, RestLinkrels, vdUtils, TemplateD2Overview, VersionNavigatorFieldView, ThumbnailLoader, lang) {
  "use strict";
  const AUTO_LAUNCH_VIEWER = Constants.UrlParams.OVERVIEW_PERSPECTIVE_LAUNCH_VIEWER_IF_CURRENT, PREVENT_AUTO_SWITCH = Constants.UrlParams.OVERVIEW_PERSPECTIVE_PREVENT_AUTO_VERSION_SWITCH;
  var D2DocumentOverview = CSDocumentOverview.extend({
    className: CSDocumentOverview.prototype.className + " d2-document-overview-wrapper",
    template: TemplateD2Overview,
    ui: _.extend({}, CSDocumentOverview.prototype.ui, {
      versions: ".versions-view"
    }),
    events: _.extend({}, CSDocumentOverview.prototype.events, {
      "click .thumbnail_section": "_handleClickThumbnail"
    }),
    templateHelpers: function() {
      var message = CSDocumentOverview.prototype.templateHelpers.apply(this, arguments);
      _.extend(message, {
        lang: lang,
        size_value: Base.formatFileSize(this.options.node.get("r_content_size")),
        size_full_value: Base.formatExactFileSize(this.options.node.get("r_content_size"))
      });
      return message;
    },
    constructor: function D2DocumentOverview(options) {
      options = options || {};
      if (!options.toolbarItemMask) {
        options.toolbarItemMask = new ToolbarItemMasks();
      }
      if (!options.toolbarItems) {
        options.toolbarItems = {
          dropdownMenuListInProperties: toolbarItems.nodeDropdownMenuList
        };
      }
      CSDocumentOverview.prototype.constructor.apply(this, arguments);
      this.options.thumbnail = new ThumbnailLoader(options);
      var nodeAttributesOfInterest = [ "id", "name", "owner_user_id", "modify_date", "mime_type", "type_name", "type", "r_content_size", "description", "reserved_user_id" ];
      this.stopListening(this.options.node, "change");
      this.listenTo(this.options.context, "sync", () => {
        this._tryLaunchingViewer();
      });
      this.listenTo(this.options.node, "change", function() {
        if (this.renderFinished) {
          var modifiedAttribs = _.keys(this.options.node.changedAttributes());
          if (!_.isEmpty(_.intersection(modifiedAttribs, nodeAttributesOfInterest))) {
            if (_.contains(modifiedAttribs, "id")) {
              if (!this.isInternalNavigation) {
                this._initParams();
              }
              this.attemptSwitchToCurrentVersion(this._handleNodeChange.bind(this));
            }
          }
        }
        if (!_.contains(modifiedAttribs, "reserved")) {
          this._showReserveRow();
        }
      });
      this.listenTo(this, "before:show", function() {
        if (versionUtil.isCurrentVersion(this.options.node) || this.blockAutomaticVersionSwitching) {
          this._handleNodeChange();
          this.renderFinished = true;
        }
      });
      this.nextNode = this.options.context.getModel(NextNodeModelFactory);
      this._initParams();
      this.attemptSwitchToCurrentVersion();
    },
    _handleNodeChange: function() {
      this.thumbnailSet = false;
      this.isReserved = false;
      if (this.isInternalNavigation) {
        this._syncParams();
        this.preventViewerLaunch = true;
        this.isInternalNavigation = false;
      } else {
        this.preventViewerLaunch = false;
      }
      this.render();
      this.addVersionsView();
    },
    _handleClickThumbnail: function(event) {
      event.stopImmediatePropagation();
      var button = this.$el.find(".d2-otc-btn.command-btn[type|=primary]");
      var signature = button?.data("signature");
      button?.is(":visible") && this._executeCommand(signature);
    },
    attemptSwitchToCurrentVersion: function(cbOnBlockedAutomaticSwitch) {
      if (!versionUtil.isCurrentVersion(this.options.node) && !this.blockAutomaticVersionSwitching) {
        this.fetchCurrentVersion(this.options.node).done(function(modelData) {
          if (modelData && modelData["r_object_id"]) {
            this.isInternalForwardNavigation = true;
            this.renderFinished = true;
            if (this.options.context.fetching) {
              this.listenToOnce(this.options.context, "sync", () => {
                this.nextNode.set({
                  id: modelData["r_object_id"]
                });
                this._syncParams();
              });
            } else {
              this.nextNode.set({
                id: modelData["r_object_id"]
              });
              this._syncParams();
            }
          } else if (_.isFunction(cbOnBlockedAutomaticSwitch)) {
            cbOnBlockedAutomaticSwitch();
          }
        }.bind(this)).fail(function() {
          if (_.isFunction(cbOnBlockedAutomaticSwitch)) {
            cbOnBlockedAutomaticSwitch();
          }
        }.bind(this));
      } else {
        if (_.isFunction(cbOnBlockedAutomaticSwitch)) {
          cbOnBlockedAutomaticSwitch();
        }
      }
    },
    fetchCurrentVersion: function(node) {
      var promise = $.Deferred();
      $.ajax(node.connector.extendAjaxOptions({
        url: RestLinkrels.getLink(node.get("links"), RestLinkrels.CURRENT_VERSION),
        success: function(response) {
          promise.resolve(response && response.properties);
        },
        error: function(request, textStatus, error) {
          promise.reject(error);
        }
      }));
      return promise.promise();
    },
    onRender: function() {
      CSDocumentOverview.prototype.onRender.apply(this, arguments);
      this._checkOpenAction();
      this.unblockActions();
    },
    _getParentNode: function() {
      if (this.parentNode === undefined) {
        this.parentNode = this.options.node.parent;
      }
      return this.parentNode;
    },
    _showCreatedByUserName: function() {
      var userOptions = {
        baseElement: this.ui.createdBy,
        userId: this.options.node.get("owner_user_id")
      };
      this._showUserName(userOptions);
    },
    addVersionsView: function() {
      var versionRegion = new Marionette.Region({
        el: this.$el.find(this.ui.versions)
      });
      if (this.versionNavigatorField) {
        this.stopListening(this.versionNavigatorField);
      }
      this.blockAutomaticVersionSwitching = false;
      this.versionNavigatorField = new VersionNavigatorFieldView({
        model: this.options.node,
        context: this.options.context,
        formView: this,
        blockingParentView: this,
        showOriginalDocumentLink: this.isInternalForwardNavigation
      });
      this.listenTo(this.versionNavigatorField, "version:navigate", function(isDirectionBackward) {
        this.isInternalForwardNavigation = !isDirectionBackward;
        this.blockAutomaticVersionSwitching = isDirectionBackward;
        this.isInternalNavigation = true;
      });
      versionRegion.show(this.versionNavigatorField);
      this.isInternalForwardNavigation = false;
    },
    _addLocationView: function() {
      var self = this, parentNode = this._getParentNode().clone();
      var locationRegion = new Marionette.Region({
        el: this.$el.find(this.ui.location)
      });
      var renderLocation = function() {
        require([ "csui/controls/table/cells/parent/impl/parent.with.text.view" ], _.bind(function(ParentCellView) {
          var field = new ParentCellView({
            model: parentNode,
            context: self.options.context
          });
          locationRegion.show(field);
          self.$(".location-container").show();
        }, this));
      };
      CommandHelper.findValidParentForNode({
        node: self.options.node,
        context: self.options.context
      }).done(function(validParent) {
        if (validParent !== undefined) {
          parentNode = validParent;
          var ancestors = new NodeAncestorCollection(undefined, {
            node: new NodeModel({
              id: validParent.get("id")
            }, {
              connector: self.options.node.connector
            }),
            autofetch: true,
            autofetchEvent: "change:id sync"
          });
          ancestors.fetch({
            ignoreHttp403: true
          }).done(function(ancestorInfo) {
            parentNode.attributes.name = ancestorInfo.pluck("name").join(" > ");
            renderLocation();
            self.unblockActions();
          });
        } else {
          self.$(".location-container").hide();
          self.unblockActions();
        }
      });
      this.blockActions();
    },
    _addCommentView: function() {
      var node = this.options.node;
      var commentOptions = _.defaults({
        model: node
      }, this.options);
      CommentView = TableCellRegistry.getCellView(new Backbone.Model({
        column_key: "wnd_comments"
      }));
      var commentView = new CommentView(commentOptions);
      var commentRegion = new Marionette.Region({
        el: this.ui.commentButtonRegion
      });
      commentView.once("render", function() {
        this.blockActions();
        CommentUtils.fetchTotalComments([ node ], this.options.node.connector).always(function() {
          this.unblockActions();
        }.bind(this));
      }.bind(this));
      commentRegion.show(commentView);
    },
    _addFavoriteView: function() {
      var node = this.options.node;
      var favoriteOptions = _.defaults({
        model: node
      }, this.options);
      favoriteOptions.popoverAtBodyElement = true;
      favoriteOptions.blockingParentView = this;
      var favoriteView = new FavoriteStarView(favoriteOptions);
      var favoriteRegion = new Marionette.Region({
        el: this.$el.find(".favoriteRegion")
      });
      favoriteRegion.show(favoriteView);
    },
    _checkOpenAction: function() {
      if (vdUtils.isVDSnapshot(this.options.node)) {
        this.$el.find(".command-btn[type=primary]").data("signature", "D2-OpenVDocSnapshot");
      }
      if (!this._checkPermissionForOpenCommand() || !this.options.node.get("a_content_type")) {
        this.$el.find(".command-btn[type=primary]").addClass("binf-hidden");
      }
    },
    _checkPermissionForOpenCommand: function() {
      var status = {
        context: this.options.context,
        nodes: new NodeCollection([ this.options.node ]),
        container: this.options.node.parent
      }, command;
      if (vdUtils.isVDSnapshot(this.options.node)) {
        command = this.commands.findWhere({
          signature: "D2-OpenVDocSnapshot"
        });
      } else {
        command = this.commands.findWhere({
          signature: "Open"
        });
      }
      return command?.enabled(status);
    },
    _checkPermissions: function() {
      var editCmdOptions = {
        signature: "D2-Edit",
        actionBtnEle: this.ui.editBtn
      }, downloadCmdOptions = {
        signature: "Download",
        actionBtnEle: this.ui.downloadBtn
      };
      this._checkPermForSpecificAction(editCmdOptions);
      this._checkPermForSpecificAction(downloadCmdOptions);
    },
    _destroyThumbnail: function() {
      if (this.thumbnail) {
        this.stopListening(this.thumbnail);
      }
      return CSDocumentOverview.prototype._destroyThumbnail.apply(this, arguments);
    },
    _showImage: function(thumbnailLoader, url) {
      var self = this, img = this.$el.find(".img-doc-preview"), thumbnailNotLoadedEl = this.$el.find(".thumbnail_not_loaded");
      this.ui.thumbnailContainer.removeClass("binf-hidden");
      img.prop("tabindex", "0");
      img.off();
      img.one("load", function(evt) {
        if (evt.target.height >= evt.target.width) {
          img.addClass("cs-form-img-vertical");
        } else {
          img.addClass("cs-form-img-horizontal");
        }
        img.addClass("cs-form-img-border");
        thumbnailNotLoadedEl.addClass("binf-hidden");
        img.removeClass("binf-hidden");
        var event = $.Event("tab:content:render");
        self.$el.trigger(event);
      });
      img.one("error", function() {
        self._showDefaultImage();
      });
      img.attr("src", url);
    },
    _showDefaultImage: function() {
      var img = this.$el.find(".img-doc-preview"), thumbnailNotLoadedEl = this.$el.find(".thumbnail_not_loaded");
      this.ui.thumbnailContainer.removeClass("binf-hidden");
      thumbnailNotLoadedEl.removeClass("thumbnail_empty");
      thumbnailNotLoadedEl.removeClass("csui-icon-notification-error");
      thumbnailNotLoadedEl.removeClass("binf-hidden");
      img.addClass("binf-hidden");
      var iconView = new NodeTypeIconView({
        el: thumbnailNotLoadedEl.find("span").get(0),
        node: this.options.node
      });
      iconView.render();
      var event = $.Event("tab:content:render");
      this.$el.trigger(event);
    },
    _currentlyFocusedElement: function() {},
    _initParams: function() {
      this.addInitialURLParamSupport();
      this._paramAutoLaunchViewer = this._canAutoLaunchViewer();
      this._paramBlockAutoVersionSwitch = this._isAutoSwitchToCurrentBlocked();
      this.canAutoLaunchViewer = this._paramAutoLaunchViewer;
      this.blockAutomaticVersionSwitching = this._paramBlockAutoVersionSwitch;
      this.isInternalNavigation = false;
    },
    _isCurrentVersion: function() {
      return versionUtil.isCurrentVersion(this.options.node);
    },
    _syncParams: function() {
      this.addInitialURLParamSupport();
      this.setViewStateProperty(AUTO_LAUNCH_VIEWER, this._paramAutoLaunchViewer, false);
      this.setViewStateProperty(PREVENT_AUTO_SWITCH, this._paramBlockAutoVersionSwitch, false);
    },
    _canAutoLaunchViewer: function() {
      return this.getViewStateModel().getViewState(AUTO_LAUNCH_VIEWER) === "true";
    },
    _isAutoSwitchToCurrentBlocked: function() {
      return this.getViewStateModel().getViewState(PREVENT_AUTO_SWITCH) === "true";
    },
    getViewStateModel: function() {
      return this.options.context.viewStateModel;
    },
    addInitialURLParamSupport: function() {
      this.addUrlParametersSupport([ AUTO_LAUNCH_VIEWER, PREVENT_AUTO_SWITCH ]);
      this.setViewStateProperty(AUTO_LAUNCH_VIEWER, false, true, false);
      this.setViewStateProperty(PREVENT_AUTO_SWITCH, false, true, false);
    },
    addUrlParametersSupport: function(urlParameters) {
      var viewStateModel = this.getViewStateModel();
      viewStateModel.addUrlParameters(urlParameters, this.options.context);
    },
    setViewStateProperty: function(propName, propValue, setToDefault, setToState) {
      var viewStateModel = this.getViewStateModel();
      setToDefault !== false && viewStateModel.setDefaultViewState(propName, propValue);
      setToState !== false && viewStateModel.setViewState(propName, propValue);
    },
    _tryLaunchingViewer: function() {
      if (this._isCurrentVersion() && this._paramAutoLaunchViewer && !this.preventViewerLaunch && this._checkPermissionForOpenCommand()) {
        this.preventViewerLaunch = true;
        this._executeCommand("Open");
      }
    }
  });
  return D2DocumentOverview;
});