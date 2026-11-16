/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/models/node/node.model", "csui/utils/commands", "csui/utils/contexts/factories/connector", "csui/widgets/nodestable/toolbaritems", "d2/models/creation.presets.value.config", "d2/utils/constants", "dctmw/utils/rest.resources", "d2/widgets/shortcut/shortcut.behavior", "i18n!d2/widgets/shortcuts/impl/nls/lang" ], function(NodeModel, commands, ConnectorFactory, NodesTableToolItems, PresetValueConfigModel, constants, RestResources, ShortcutBehavior, lang) {
  "use strict";
  var ActionTilesShortcutBehavior = ShortcutBehavior.extend({
    constructor: function ActionTilesShortcutBehavior(options) {
      ActionTilesShortcutBehavior.__super__.constructor.apply(this, arguments);
      options = options || {};
      this.connector = options.context.getObject(ConnectorFactory);
    },
    onRender: function() {
      this.viewModel.set("enabled", false);
      this._updateCreateImportPrivilege();
    },
    _getPresetModel: function(options, mode) {
      var presetConfigName = options.data[constants.PRESET_PROFILE.KEY_PRESET_NAME], presetUniqueID = options.data[constants.PRESET_PROFILE.KEY_PRESET_VALUE_CONFIG_ID];
      if (presetConfigName && presetUniqueID) {
        return PresetValueConfigModel.create(presetConfigName, presetUniqueID, {
          mode: mode,
          connector: this.connector,
          isOperatingModePreset: true,
          inheritableSourceNode: new NodeModel({
            id: options.data.landingPageId
          }, {
            connector: this.connector
          })
        });
      }
      return null;
    },
    _fetchImportCreateLabel: function(signature) {
      var actionModels = NodesTableToolItems.addToolbar.collection;
      return actionModels.find(function(action) {
        var actionSignature = action.get("signature");
        if (actionSignature === signature) {
          return action.get("name");
        }
      });
    },
    _updateCreateImportPrivilege: function() {
      var clientCapability = RestResources.getCurrentUser().get("properties").client_capability;
      if (clientCapability > 1) {
        if (this.model instanceof PresetValueConfigModel) {
          this.model.ensureFetched({
            ignoreHttp403: true
          }).done(function() {
            this.viewModel.set("enabled", true);
            this.options.data.title = this.model.get("name");
            this.viewModel.set("name", this.options.data.title);
          }.bind(this)).fail(this._showActionTileError.bind(this));
        } else {
          this.viewModel.set("enabled", true);
        }
      } else {
        this._showActionTileError();
      }
    },
    _showActionTileError: function(error) {
      var title;
      if (error) {
        title = error.responseJSON ? error.responseJSON.message : error;
      }
      if (!title) {
        title = this._getInvalidPrivilegeErrorTitle();
      }
      this.viewModel.set("error", {
        message: lang.itemCannotbeAccessed,
        title: title
      });
    },
    _getInvalidPrivilegeErrorTitle: function() {
      return lang.invalidNewContentPrivilege;
    },
    _getActionSignature: function() {
      return "";
    },
    onClick: function() {
      var signature = this._getActionSignature();
      if (signature) {
        var options = {
          context: this.options.context
        };
        var status = {
          context: this.options.context,
          connector: this.connector,
          landingPageId: this.options.data.landingPageId,
          presetModel: this.model
        };
        var actionCommand = commands.get(signature);
        actionCommand && actionCommand.execute(status, options);
      }
    }
  });
  return ActionTilesShortcutBehavior;
});