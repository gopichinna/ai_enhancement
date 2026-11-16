/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/lib/underscore", "nuc/lib/jquery", "csui/utils/commands/properties", "nuc/models/nodes", "csui/utils/command.error", "csui/utils/commandhelper", "csui/utils/commands", "i18n!d2/commands/nls/localized.strings" ], function(require, Backbone, Marionette, _, $, PropertiesCommand, NodeCollection, CommandError, CommandHelper, commands, lang) {
  "use strict";
  var MetadataPropertiesCommand = PropertiesCommand.extend({
    defaults: {
      signature: "D2-metadataProperties",
      command_key: "D2-metadataProperties",
      openable: true,
      scope: "multiple",
      name: lang.CommandNameOpenLocations,
      commands: "csui/utils/commands"
    },
    execute: function(status, options) {
      return this._executeWithoutSaveState(status, options);
    },
    _executeWithoutSaveState: function(status, options) {
      var context = status.context || options && options.context, self = this, deferred = $.Deferred(), selected = status.nodes, container = status.container, navigationView = true, nodes;
      if (selected && selected.first() === container) {
        selected = container;
        navigationView = false;
      } else {
        nodes = this._getAtLeastOneNode(status);
      }
      var originatingView = status.originatingView || options && options.originatingView;
      require([ "csui/widgets/metadata/impl/metadatanavigation/metadatanavigation.view", "csui/widgets/metadata/metadata.view", "csui/controls/dialog/dialog.view", "csui/widgets/metadata/header.dropdown.menu.items", this.get("commands") ], function(MetadataNavigationWidget, MetadataView, DialogView, metadataDropdownMenuItems, commands) {
        if (originatingView?.options.refetchNodeActions && nodes) {
          const commandSignatures = commands.getSignatures(metadataDropdownMenuItems);
          nodes.each(function(node) {
            if (node.refetchNodeActions) {
              node.nonPromotedActionCommands = commandSignatures;
              node.set({
                csuiLazyActionsRetrieved: false
              }, {
                silent: true
              });
            }
          });
        }
        var metadata, showInDialogView = status.data && !!status.data.dialogView;
        if (navigationView) {
          if (status.collection && status.collection.models && status.collection.models.length > 0) {
            metadata = new MetadataNavigationWidget({
              container: container,
              containerCollection: status.collection,
              collection: nodes,
              selected: selected,
              originatingView: originatingView,
              context: context,
              commands: commands,
              nameAttribute: options ? options.nameAttribute : undefined,
              showCloseIcon: originatingView ? false : true,
              selectedTab: status.selectedTab,
              selectedProperty: status.selectedProperty,
              showThumbnails: status.showThumbnails,
              enableViewState: false,
              showDropdownMenu: false
            });
          } else {
            if (originatingView && originatingView.supportOriginatingView === undefined) {
              originatingView.supportOriginatingView = true;
            }
            metadata = new MetadataView({
              model: selected.get("id") ? selected : selected.models[0],
              navigationView: false,
              originatingView: originatingView,
              targetView: originatingView,
              context: context,
              commands: commands,
              showCloseIcon: originatingView ? false : true,
              showBackIcon: originatingView ? true : false,
              selectedTab: status.selectedTab,
              selectedProperty: status.selectedProperty
            });
            if (originatingView) {
              originatingView.metadataView = metadata;
            }
          }
        } else {
          if (originatingView && originatingView.supportOriginatingView === undefined) {
            originatingView.supportOriginatingView = true;
          }
          metadata = new MetadataView({
            model: selected,
            navigationView: false,
            originatingView: originatingView,
            targetView: originatingView,
            context: context,
            commands: commands,
            showCloseIcon: !originatingView,
            showBackIcon: originatingView ? true : false,
            selectedTab: status.selectedTab,
            selectedProperty: status.selectedProperty,
            enableViewState: false
          });
          if (originatingView) {
            originatingView.metadataView = metadata;
          }
        }
        if (originatingView && !showInDialogView) {
          self._setMetadataViewCollectionTitle(metadata);
          originatingView.triggerMethod("metadata:created", metadata);
          var _showOriginatingView, $csProperties;
          var $originatingView = originatingView.$el;
          $originatingView.parent().append("<div class='cs-properties-wrapper'></div>");
          $originatingView.parent().addClass("csui-node-properties-wrapper");
          $csProperties = $($originatingView.parent().find(".cs-properties-wrapper")[0]);
          $csProperties.hide();
          metadata.render();
          Marionette.triggerMethodOn(metadata, "before:show");
          $csProperties.append(metadata.el);
          _.isFunction(originatingView.unblockActions) && originatingView.unblockActions();
          $originatingView = $originatingView.parent().find(".cs-permissions-wrapper").length > 0 ? $originatingView.parent().find(".cs-permissions-wrapper") : $originatingView;
          $originatingView.hide();
          $csProperties.show();
          if (originatingView.permissionsView) {
            $originatingView.parent().find(".cs-permissions-wrapper").remove();
            originatingView.permissionsView && originatingView.permissionsView.destroy();
          }
          Marionette.triggerMethodOn(metadata, "show");
          $originatingView.promise().done(function() {
            originatingView.isDisplayed = false;
          });
          _showOriginatingView = function() {
            $csProperties.hide();
            originatingView.$el.show();
            originatingView.metadataView && originatingView.metadataView.destroy();
            originatingView.permissionsView && originatingView.permissionsView.destroy();
            originatingView.triggerMethod("dom:refresh");
            originatingView.isDisplayed = true;
            !!status.collection && (status.collection.requireSwitched = false);
            originatingView.trigger("properties:view:destroyed");
            $originatingView.parent().removeClass("csui-node-properties-wrapper");
            metadata.destroy();
            $csProperties.remove();
            deferred.resolve();
          };
          self.listenTo(metadata, "metadata:close", _.bind(_showOriginatingView, self));
          self.listenTo(metadata, "metadata:close:without:animation", function() {
            $originatingView.show();
            originatingView.triggerMethod("dom:refresh");
            !!status.collection && (status.collection.requireSwitched = false);
            metadata.destroy();
            $csProperties.remove();
            deferred.resolve();
          });
        } else {
          self.dialog = new DialogView({
            className: "cs-properties",
            largeSize: true,
            view: metadata
          });
          self.dialog.show();
          self.dialog.ui.header.hide();
          self.dialog.listenTo(metadata, "metadata:close", function() {
            self.dialog.destroy();
          });
          self.dialog.listenTo(metadata, "metadata:close:without:animation", function() {
            self.dialog.destroy();
          });
          self.dialog.listenTo(self.dialog, "before:hide", function() {
            deferred.resolve();
          });
        }
      }, function(error) {
        deferred.reject(new CommandError(error));
      });
      return deferred.promise();
    },
    _setMetadataViewCollectionTitle: function(view) {
      view.mdn.options.data.title = view.selectedTab;
    },
    _getAtLeastOneNode: function(status) {
      if (status.collection && status.nodes.length === 1) {
        return status.collection;
      }
      return status.nodes;
    }
  });
  return MetadataPropertiesCommand;
});