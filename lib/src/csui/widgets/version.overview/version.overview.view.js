/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "module", "csui/lib/underscore", "csui/lib/marionette", "csui/lib/jquery", "csui/utils/log", "csui/utils/contexts/factories/version", "csui/utils/commands/versions", "csui/utils/base", "csui/utils/thumbnail/thumbnail.object", "csui/models/node.actions", "csui/widgets/document.overview/document.overview.view", "csui/controls/progressblocker/blocker", "i18n!csui/widgets/version.overview/impl/nls/lang", "hbs!csui/widgets/version.overview/impl/version.overview", "csui/themes/csui.jato.action.icons", "smart/themes/theming", "csui/themes/carbonfiber/ot-icons/icons_csui_action", "css!csui/widgets/version.overview/impl/version.overview", "css!csui/widgets/document.overview/impl/document.version.overview" ], function(require, module, _, Marionette, $, log, VersionModelFactory, VersionCommands, base, Thumbnail, NodeActionCollection, DocumentOverviewView, BlockingView, lang, VersionOverviewTemplate, jatoIcons, theming) {
  "use strict";
  log = log(module.id);
  var config = _.extend({
    fileActionSettings: []
  }, require.moduleConfig("csui/utils/commands/open.document/delegates/open.document.delegates"));
  var VersionOverviewView = DocumentOverviewView.extend({
    className: "cs-form csui-general-form cs-version-overview-wrapper",
    template: VersionOverviewTemplate,
    templateHelpers: function() {
      var sizeFullValue = this.options.node.get("file_size"), sizeValue = this.getFormattedSizeValue(sizeFullValue), versionName = this.options.node.get("version_number_name"), locked = this.options.node.get("locked");
      var messages = DocumentOverviewView.prototype.templateHelpers.call(this);
      _.extend(messages, {
        size_value: sizeValue,
        size_full_value: sizeFullValue,
        versionText: _.str.sformat(lang.versionText, versionName),
        versionAria: _.str.sformat(lang.versionAria, versionName),
        locked: locked,
        lockedBy: lang.lockedBy,
        back_button: this.back_button,
        backButtonIconSVG: jatoIcons.actionArrowLeft,
        isJATO: theming.isJATOTheme()
      });
      return messages;
    },
    ui: function() {
      return _.extend({}, DocumentOverviewView.prototype.ui, {
        creadyByUser: ".csui-version-overview-created-by-user",
        createdByPic: ".csui-version-overview-created-by-pic",
        modifiedByUser: ".csui-version-overview-modified-by-user",
        modifiedByPic: ".csui-version-overview-modified-by-pic",
        downloadBtn: ".csui-version-overview-download-btn",
        lockInfo: ".lock_info",
        lockUser: ".csui-version-overview-lock-user",
        lockBtn: ".csui-version-overview-lock-btn",
        locationContainer: ".location-container",
        descriptionSection: ".description_section",
        descriptionSectionBtn: ".description_section button",
        descriptionField: ".description_section span.cs-field-textarea-data",
        playBtn: ".play-btn"
      });
    },
    constructor: function VersionOverviewView(options) {
      options || (options = {});
      BlockingView.imbue(this);
      options.data || (options.data = {});
      if (!options.node) {
        options.node = options.context.getModel(VersionModelFactory);
      }
      this.options = options;
      var viewStateModel = options.context && options.context.viewStateModel;
      this.back_button = viewStateModel && viewStateModel.hasRouted();
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.commands = VersionCommands;
      this.isReloading = false;
      this.parentNode = undefined;
      this.supportOriginatingView = true;
      this.listenTo(this.options.node, "change:id change:version_number", _.bind(this.handleFetch, this));
      this.listenTo(this.options.node.actions, "reset", _.bind(this._checkPermissions, this));
      this.listenTo(this.options.node, "change", _.bind(this._handleNodeChange, this));
      this.listenTo(this.options.node, "change:modify_date", _.bind(this._updateModifyDateAndTimeStamp, this));
      this.listenTo(this.options.node, "change:description", _.bind(this._updateDescription, this));
      this.listenTo(this.options.node, "delete", _.bind(this._navigateToParent, this));
      this.blockActions();
      this._showThumbnail();
    },
    onRender: function() {
      if (!this.options.node.fetched) {
        return;
      }
      this._showMetadataItemName();
      this._addLocationView();
      this._showCreatedByUserName();
      this._showModifiedByUserName();
      this._checkPermissions();
      this._showLockRow();
      setTimeout(() => {
        this._currentlyFocusedElement();
      }, 1e3);
    },
    _handleNodeChange: function() {
      if (!!this.options.node.isLockedClicked || this.options.node.isUnlockedClicked) {
        this._updateModifyDateAndTimeStamp();
        this._checkPermissions();
        this._showLockRow();
        this.options.node.isLockedClicked = false;
        this.options.node.isUnlockedClicked = false;
      } else if (this.options.node.changed.csuiDelayedActionsRetrieved) {
        this.isLocked = false;
        this._updateReserveField();
        this._checkPermissions();
      } else {
        this.render();
      }
    },
    handleFetch: function() {
      if (this.isReloading) {
        return;
      }
      this.isReloading = true;
      this.thumbnailSet = false;
      this.backButtonClicked = false;
      this.render();
    },
    _showMetadataItemName: function() {
      require([ "csui/widgets/metadata/impl/header/item.name/metadata.item.name.view" ], _.bind(function(MetadataItemNameView) {
        if (this.metadataItemNameView) {
          this.metadataItemNameView.destroy();
        }
        this.metadataItemNameView = new MetadataItemNameView({
          model: this.options.node,
          container: this.options.node.parent,
          containerCollection: this.options.containerCollection,
          collection: this.options.collection,
          context: this.options.context,
          nameSchema: {},
          commands: this.commands,
          originatingView: this,
          showDropdownMenu: true,
          showPropertiesCommand: true,
          noMetadataNavigation: true
        });
        var inv = this.metadataItemNameView.render();
        Marionette.triggerMethodOn(inv, "before:show", inv, this);
        this.ui.titleContainer.append(inv.el);
        Marionette.triggerMethodOn(inv, "show", inv, this);
        this._unblockActions();
        if (this.isReloading) {
          this.isReloading = false;
        }
      }, this));
    },
    _updateDescription: function() {
      var newDescription = this.options.node.get("description");
      if (!newDescription) {
        this.ui.descriptionSectionBtn.removeAttr("aria-label");
        this.ui.descriptionField.text(null);
        this.ui.descriptionSection.addClass("binf-hidden");
      } else {
        this.ui.descriptionSectionBtn.attr("aria-label", lang.description + ":" + newDescription);
        this.ui.descriptionField.text(newDescription);
        this.ui.descriptionSection.removeClass("binf-hidden");
      }
    },
    _showThumbnail: function() {
      if (!this.isReloading) {
        this.thumbnail = this.options.thumbnail || new Thumbnail({
          node: this.options.node
        });
        this.listenTo(this.thumbnail, "loadUrl", this._showImage);
        this.listenTo(this.thumbnail, "error", this._showDefaultImage);
        this.listenTo(this, "destroy", _.bind(this._destroyThumbnail, this));
      }
      if (!this.thumbnailSet) {
        var self = this;
        this.thumbnailSet = true;
        if (this.thumbnail.hasOwnProperty("imgUrl") && !!this.thumbnail.imgUrl) {
          this._showImage();
        } else {
          this.thumbnail.loadUrl();
        }
      }
    },
    _showImage: function() {
      this.$el.addClass("cs-version-overview-wrapper-with-thumbnail");
      this.ui.thumbnailContainer.removeClass("binf-hidden");
      this.trigger("thumbnail:show:image");
      var self = this, img = this.ui.thumbnailImg;
      img.attr("src", this.thumbnail.imgUrl);
      img.prop("tabindex", "0");
      img.one("load", function(evt) {
        if (evt.target.clientHeight >= evt.target.clientWidth) {
          img.addClass("cs-form-img-vertical");
        } else {
          img.addClass("cs-form-img-horizontal");
        }
        img.addClass("cs-form-img-border");
        img.removeClass("binf-hidden");
        var event = $.Event("tab:content:render");
        self.$el.trigger(event);
      });
    },
    _addLocationView: function() {
      var self = this, renderLocation = function() {
        require([ "csui/controls/table/cells/parent/parent.view" ], _.bind(function(ParentCellView) {
          self.parentContainer = self.ancestors.at(self.ancestors.length - 2);
          if (self.parentContainer && self.parentContainer.attributes) {
            var field = new ParentCellView({
              parent: self.parentContainer.attributes,
              context: self.options.context,
              nameEdit: false,
              iconSize: "contain",
              el: self.$el.find(self.ui.location),
              connector: self.options.node.connector
            });
            field.render();
          }
        }, this));
      };
      this.ancestors = this.options.context.getCollection("ancestors");
      if (!this.ancestors) {
        this._hideLocationField();
        return;
      }
      this.listenTo(this.ancestors, "sync", function() {
        renderLocation();
      });
      this.listenTo(this.ancestors, "error", this._hideLocationField);
      renderLocation();
    },
    _hideLocationField: function() {
      this.ui.locationContainer.addClass("binf-hidden");
    },
    _showCreatedByUserName: function() {
      var userOptions = {
        baseElement: this.ui.createdBy,
        userId: this.options.node.get("owner_id")
      };
      this._showUserName(userOptions);
    },
    _showModifiedByUserName: function() {
      const userOptions = {
        baseElement: this.ui.modifiedBy,
        userId: this.options.node?.get("id_expand")?.modify_user_id
      };
      this._showModifiedUserName(userOptions);
    },
    _checkPermissions: function() {
      var downloadCmdOptions = {
        signature: "VersionDownload",
        actionBtnEle: this.ui.downloadBtn
      }, openCmdOptions = {
        signature: "OpenVersionDelegate",
        actionBtnEle: this.ui.openBtn
      }, playCmdOptions = {
        signature: "OpenVideo",
        actionBtnEle: this.ui.playBtn
      }, cmdData = {
        exclude: [ "OpenVersionPerspective", "Download" ]
      };
      let self = this, excludeBrowserCommand = config.fileActionSettings.filter(function(command) {
        if (command.Action === "Download") {
          self.orderOfDownload = command.order;
        }
        if (self.orderOfDownload && command.Action === "OpenInBrowser" && self.orderOfDownload < command.order) {
          return true;
        }
      });
      if (excludeBrowserCommand && excludeBrowserCommand.length) {
        cmdData.exclude.push("OpenInBrowser");
      }
      this._checkPermForSpecificAction(playCmdOptions);
      if (this.ui.playBtn.hasClass("binf-hidden")) {
        this._checkPermForSpecificAction(openCmdOptions, cmdData);
      }
      this._checkPermForSpecificAction(downloadCmdOptions);
    },
    getFormattedSizeValue: function(value) {
      return base.formatFriendlyFileSize(value);
    },
    _showLockRow: function() {
      this._updatelockField();
    },
    _updatelockField: function() {
      var isNodeLocked = this.options.node.get("locked");
      if (isNodeLocked && !this.isLocked) {
        this.ui.lockInfo.removeClass("binf-hidden");
        var opts = {
          context: this.options.context,
          tableView: this,
          versionOverview: true,
          model: this.options.node || this.options.model
        }, self = this;
        require([ "csui/controls/node.state/impl/locked/locked.view" ], function(LockButtonFieldView) {
          self.lockFieldView = new LockButtonFieldView(_.extend(opts));
          var lockFieldRegion = new Marionette.Region({
            el: self.ui.lockBtn
          });
          lockFieldRegion.show(self.lockFieldView);
          self.$el.find("li.csui-node-state-locked").attr("role", "none").find("button").removeAttr("tabindex");
          self._getUserField({
            userid: self.options.node.get("locked_user_id"),
            placeholder: self.ui.lockUser,
            showUserProfileLink: true
          });
          self.isLocked = true;
        });
      } else if (!isNodeLocked && !!this.isLocked) {
        this.lockFieldView && this.lockFieldView.destroy();
        this._cleanAndInitLockRow();
        this.isLocked = false;
      }
    },
    _cleanAndInitLockRow: function() {
      this.ui.lockInfo.addClass("binf-hidden");
      this.lockFieldView.$el.html();
      this.ui.lockUser.html();
    },
    _handleClickThumbnail: function(event) {
      event.stopImmediatePropagation();
      this._executeCommand("OpenVersionDelegate");
    },
    _navigateToParent: function() {
      var parentId = this.parentContainer.get("id") || this.options.node.get("id_expand") && this.options.node.get("id_expand").parent_id;
      if (parentId) {
        this._setNextNodeModelFactory(parentId);
      }
    }
  });
  return VersionOverviewView;
});