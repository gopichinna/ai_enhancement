/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "d2/controls/globalmessage/globalmessage", "csui/utils/commandhelper", "d2/utils/constants", "d2/utils/rest.linkrels", "dctmw/utils/utils", "dctmw/server.adaptors/converters/node", "d2/controls/globalmessage/impl/progresspanel/node.creation.success.message.view", "i18n!d2/dialogs/create.folder/impl/nls/lang" ], function(_, $, GlobalMessage, CommandHelper, constants, RestLinkrels, utils, nodeConverter, NodeCreationSuccessMessageView, lang) {
  "use strict";
  var NAME_FIELD = "object_name", TYPE_FIELD = "r_object_type";
  return {
    mixin: function(prototype) {
      return _.extend(prototype, {
        _performAction: function(isSaveButton, embedMode, status) {
          var me = this, dfd = $.Deferred(), node = me.model ? me.model : me.newNode, typeData = node.get("typeData"), inputName, fieldModel = me.baseInlineFormView && me.baseInlineFormView.collection.findWhere({
            fieldName: "name"
          }), container = node.collection && node.collection.node ? node.collection.node : status.container, errorHandler = _.bind(me._handleError, me, status);
          inputName = fieldModel && fieldModel.get("value") || (status && status.folderName ? status.folderName : "");
          if (inputName) {
            node.set({
              name: inputName
            }, {
              silent: true
            });
          }
          var folderTypes = typeData.folderTypes, defaultType = typeData.defaultType, successHandler = function(nodeProps) {
            if (!embedMode && me.baseInlineFormView) {
              me.baseInlineFormView._saveNewModel = me._saveNewModel;
              me.baseInlineFormView._save(nodeProps).done(function(node) {
                me.showSuccessMsg(container, node, status);
                dfd.resolve(node);
              }).fail(function(err) {
                errorHandler(err);
                dfd.reject(err);
              });
            } else {
              me._saveNewModel(nodeProps).done(function(node) {
                me.showSuccessMsg(container, node, status);
                dfd.resolve(node);
              }).fail(function(err) {
                errorHandler(err);
                dfd.reject(err);
              });
            }
          };
          if (isSaveButton === true && folderTypes.length === 1 && !embedMode) {
            me._fetchPropertyPageData(node, folderTypes[0].name).done(function(propertyPageData) {
              var hasOtherRequiredFields = false;
              _.each(propertyPageData.propertiesConfig, function(form) {
                if (form.expressions) {
                  for (var key in form.expressions) {
                    if (Object.prototype.hasOwnProperty.call(form.expressions, key) && !key.match(new RegExp("[.]?" + NAME_FIELD + "$")) && !_.isUndefined(form.expressions[key].setRequired) && form.expressions[key].setRequired !== false) {
                      hasOtherRequiredFields = true;
                      return false;
                    }
                  }
                }
              });
              if (!hasOtherRequiredFields) {
                var attrs = {};
                attrs[TYPE_FIELD] = folderTypes[0].name;
                attrs[NAME_FIELD] = inputName;
                successHandler(attrs);
              } else {
                me._showWizard({
                  node: node,
                  folderTypes: folderTypes,
                  defaultType: defaultType,
                  propertyPageData: propertyPageData
                }).done(successHandler).fail(function(err) {
                  errorHandler(err);
                  dfd.reject(err);
                });
              }
            }).fail(errorHandler);
          } else {
            me._showWizard({
              node: node,
              folderTypes: folderTypes,
              defaultType: defaultType
            }).done(successHandler).fail(function(err) {
              errorHandler(err);
              dfd.reject(err);
            });
          }
          return dfd.promise();
        },
        showSuccessMsg: function(container, node, status) {
          if (status && status.suppressD2SuccessMessage === true) {
            return;
          }
          var me = this, model = me.model ? me.model : me.newNode;
          var msgCode = node.get("type") === constants.Types.CABINET ? lang.CabinetCreationSuccessMessage : lang.FolderCreationSuccessMessage;
          var linkLabel = node.get("type") === constants.Types.CABINET ? lang.CreateCabinetDoneCommandLabel : lang.CreateFolderDoneCommandLabel;
          var showLink = false;
          var parentIds = node.get("i_folder_id") || [];
          if (container && !_.contains(parentIds, container.get("id"))) {
            showLink = true;
            if (node.get("type") === constants.Types.FOLDER) {
              var fldPaths = node.get("r_folder_path") || [];
              if (fldPaths[0]) {
                var flds = fldPaths[0].split("/");
                flds.pop();
                node._foldername = flds.pop();
              }
              msgCode = lang.FolderCreationSuccessMessageInFolder;
              model.collection && model.collection.remove(node);
            } else if (nodeConverter.isNonDCTMNode(container)) {
              showLink = false;
            } else {
              model.collection && model.collection.remove(node);
            }
          }
          GlobalMessage._showMessageView(NodeCreationSuccessMessageView, {
            showLink: showLink,
            node: node,
            context: model.context,
            successMessageFormat: msgCode,
            linkLabel: linkLabel,
            link_command_signature: "Browse"
          });
        },
        _handleError: function(status, error) {
          if (this.cancel && _.isFunction(this.cancel)) {
            this.cancel();
          }
          if (status && status.suppressD2FailMessage === true) {
            return;
          }
          if (_.isString(error)) {
            GlobalMessage.showMessage("error", error);
          } else if (error && error.message) {
            GlobalMessage.showMessage("error", error.message, error.errorDetails);
          }
        },
        _saveNewModel: function(attributes) {
          var me = this, deferred = $.Deferred(), node = me.model ? me.model : me.newNode, widgetConfig = {}, url = RestLinkrels.getLink(node.get("links"), RestLinkrels.D2_FOLDERS);
          if (!attributes[NAME_FIELD]) {
            attributes[NAME_FIELD] = node.get("name");
          }
          if (node.collection && node.collection.options) {
            widgetConfig.widgetType = node.collection.widgetType;
            widgetConfig.widgetName = node.collection.options.widgetName;
          }
          $.ajax(node.connector.extendAjaxOptions({
            url: url,
            method: "POST",
            contentType: constants.MediaTypes.DCTM_JSON,
            data: JSON.stringify({
              properties: attributes
            }),
            success: function(response) {
              var newNodeId = response.properties.r_object_id;
              var folderPaths = response.properties.r_folder_path || [];
              if (node.inlineFormView) {
                delete node.inlineFormView;
              }
              node.set({
                id: newNodeId
              });
              if (node.get("type") === constants.Types.CABINET) {
                widgetConfig = undefined;
              }
              CommandHelper.refreshNode(node, widgetConfig).done(function() {
                if (!node.has("r_folder_path")) {
                  node.set({
                    r_folder_path: folderPaths
                  }, {
                    silent: true
                  });
                }
                deferred.resolve(node);
              }).fail(deferred.reject);
            },
            error: function(xhr, textStatus, errorThrown) {
              deferred.reject(utils.parseAjaxError(xhr, textStatus, errorThrown));
            }
          }));
          return deferred.promise();
        },
        _showWizard: function(options) {
          var deferred = $.Deferred();
          require([ "d2/controls/stepper.wizard/stepper.wizard.view", "d2/dialogs/create.folder/properties.step.view" ], function(StepperWizard, CreateFolderPropertiesStepView) {
            var wizard = new StepperWizard({
              steps: [ {
                id: "properties",
                title: options.node.get("type") === constants.Types.CABINET ? lang.CabinetPropertyPageTitle : lang.FolderPropertyPageTitle,
                viewClass: CreateFolderPropertiesStepView,
                viewOptions: options,
                buttons: [ {
                  id: "next",
                  label: lang.AddButton,
                  disabled: function() {
                    return !this.isValidForm();
                  },
                  clickHandler: function() {
                    this.next();
                  }
                } ]
              } ],
              data: {},
              className: "d2-create-folder-wizard"
            });
            wizard.show().on("wizard:closed", function(isCancel) {
              if (isCancel) {
                deferred.reject();
              } else {
                deferred.resolve(wizard.data.properties);
              }
            });
          }, deferred.reject);
          return deferred.promise();
        }
      });
    }
  };
});