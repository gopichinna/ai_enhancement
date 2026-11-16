/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "require", "csui/lib/jquery", "csui/lib/underscore", "csui/utils/log", "csui/models/command", "csui/models/node/node.model", "csui/utils/commands/add/add.mixin", "i18n!csui/utils/commands/nls/localized.strings" ], function(module, require, $, _, log, CommandModel, NodeModel, AddMixin, lang) {
  "use strict";
  var config = module.config(), supportTypes = [ 0, 136, 140, 144, 298, 1307, 1308, 800, 801 ], noFormTypes = [ 144, 801, 1307 ], extSignatures = [], extSupportTypes = config.extSupportTypes || {}, extNoFormTypes = config.extNoFormTypes || {}, extAddCommandsSignatures = config.extAddCommandSignatures || {};
  supportTypes = Array.prototype.concat.apply(supportTypes, _.values(extSupportTypes));
  noFormTypes = Array.prototype.concat.apply(noFormTypes, _.values(extNoFormTypes));
  extSignatures = Array.prototype.concat.apply(extSignatures, _.values(extAddCommandsSignatures));
  var AddCommand = CommandModel.extend({
    defaults: {
      signature: "Add"
    },
    enabled: function(status) {
      status || (status = {});
      if (status.container && status.container.get("container")) {
        if (status.container.get("type") === 298) {
          return false;
        }
        status.data || (status.data = {});
        var addableTypes = status.data.addableTypes;
        return addableTypes && _.any(supportTypes, function(type) {
          return !!addableTypes.get(type);
        });
      }
      return false;
    },
    execute: function(status, options) {
      if (options && options.addableType === undefined) {
        throw new Error("Missing options.addableType");
      }
      var newNode, promise, addableTypeName = this._getAddableTypeName(status, options);
      switch (options.addableType) {
       case 0:
       case 298:
       case 1308:
       case 800:
       case 136:
        status.forwardToTable = true;
        newNode = new NodeModel({
          type: options.addableType,
          type_name: addableTypeName,
          container: true,
          name: ""
        }, {
          connector: status.container.connector,
          collection: status.collection
        });
        promise = $.Deferred().resolve(newNode).promise();
        break;

       case 140:
        status.forwardToTable = true;
        newNode = new NodeModel({
          type: options.addableType,
          type_name: addableTypeName,
          container: false,
          name: ""
        }, {
          connector: status.container.connector,
          collection: status.collection
        });
        promise = $.Deferred().resolve(newNode).promise();
        break;

       case 144:
       case 1307:
       case 801:
        status.suppressSuccessMessage = true;
        options.actionType = "UPLOAD";
        promise = this._selectFilesForUpload(status, options);
        break;

       default:
        promise = this._executeExtCommands(status, options);
      }
      return promise;
    },
    _executeExtCommands: function(status, options) {
      var def = $.Deferred(), self = this;
      require([ "csui/utils/commands" ], function(commands) {
        for (var i = 0; i < extSignatures.length; i++) {
          var command = commands.get(extSignatures[i]);
          if (command.supportTypes && _.indexOf(command.supportTypes, options.addableType) > -1) {
            command.execute(status, options).done(def.resolve).fail(def.reject);
            break;
          }
        }
        if (i === extSignatures.length) {
          self.noAddCommandMessage(options).fail(def.reject);
        }
      });
      return def.promise();
    },
    noAddCommandMessage: function(options) {
      var errMsg = 'The "Add" action for the addableType ' + options.addableType + " is not implemented";
      log.debug(errMsg) && console.log(log.last);
      return $.Deferred().reject({
        error: errMsg,
        commandSignature: this.signature
      }).promise();
    }
  }, {
    isAddableTypeWithoutInlineForm: function(addableType) {
      return noFormTypes.indexOf(addableType) !== -1;
    }
  });
  AddMixin.mixin(AddCommand.prototype);
  return AddCommand;
});