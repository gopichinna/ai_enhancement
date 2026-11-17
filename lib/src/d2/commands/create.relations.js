/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/utils/url", "csui/utils/commandhelper", "d2/controls/globalmessage/globalmessage", "csui/utils/commands/node", "nuc/models/node/node.model", "d2/commands/node.progress.command", "d2/models/relation.model", "d2/models/relation.types.model", "csui/utils/contexts/factories/connector", "d2/controls/globalmessage/impl/progresspanel/node.creation.success.message.view", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/utils/creation.utils", "i18n!d2/commands/nls/localized.strings" ], function(require, _, $, Backbone, Url, CommandHelper, GlobalMessage, NodeCommand, NodeModel, NodeProgressCommand, RelationsModel, RelationTypesModel, ConnectorFactory, NodeCreationSuccessMessageView, WizardTabableRegionBehavior, CreationUtils, lang) {
  "use strict";
  return NodeProgressCommand.extend({
    defaults: {
      signature: "D2-CreateRelations",
      command_key: "D2-CreateRelations",
      name: lang.CreateRelationCommandName,
      scope: "single"
    },
    preProcess: function(status, options) {
      var me = this, dfd = $.Deferred();
      options = options || {};
      this.inRelationsView = status.context.viewStateModel.get(status.context.viewStateModel.CONSTANTS.STATE) && status.context.viewStateModel.get(status.context.viewStateModel.CONSTANTS.STATE).dropdown === "relations";
      _.extend(options, {
        suppressProgress: true,
        hideSuccessMessage: this.inRelationsView ? false : true,
        hideFailureMessage: false,
        connector: status.context.getObject(ConnectorFactory)
      });
      this.parentNode = CommandHelper.getJustOneNode(status);
      return this._getRelationsList(this.parentNode, options).then(function(res) {
        options.relationTypes = res;
        return me.showWizardForCreatingRelation(status, options);
      }).done(dfd.resolve).fail(dfd.reject);
    },
    doAction: function(node, options) {
      if (_.contains(options.successIds, node.get("id"))) {
        return $.Deferred().resolve().promise();
      } else {
        return $.Deferred().reject(options.errorMessages[node.get("id")] || " ").promise();
      }
    },
    _getRelationsList: function(node, options) {
      var deferred = $.Deferred();
      this.model = new RelationTypesModel(options);
      this.model.set("links", node.get("links"));
      this.model.fetch().done(function(response) {
        if (response.entries && response.entries.length > 0) {
          deferred.resolve(response.entries);
        } else {
          GlobalMessage.showMessage("error", lang.NoRelationTypesConfiguredMsg);
          deferred.reject();
        }
      }).fail(function(err) {
        deferred.reject(err);
        GlobalMessage.showMessage("error", lang.RelationTypeFailMsg, err);
      });
      return deferred.promise();
    },
    showWizardForCreatingRelation: function(status, options) {
      var dfd = $.Deferred(), me = this, relationCollection = new Backbone.Collection();
      require([ "d2/controls/stepper.wizard/stepper.wizard.view", "d2/dialogs/create.relation/create.relation.form.view", "d2/dialogs/create.relation/properties/create.relation.multi.properties.view" ], function(StepperWizard, CreateRelationFormView, ImportMetadataPropertiesView) {
        var context = status.context, connector = context.getObject(ConnectorFactory), view = CreateRelationFormView, node = me.parentNode, parentId = node.get("parent_id") === 0 ? node.get("parent_id_expand")?.id : node.get("parent_id"), wizardConfigOptions = {
          context: context,
          connector: connector,
          view: view,
          node: node,
          parentId: parentId,
          ImportMetadataPropertiesView: ImportMetadataPropertiesView,
          relationCollection: relationCollection,
          CreateRelationFormView: CreateRelationFormView,
          options: options,
          status: status,
          dfd: dfd
        }, wizard = new StepperWizard(me.getWizardConfigs(wizardConfigOptions));
        wizard.show().on("wizard:closed", function(isCancel) {
          if (isCancel) {
            dfd.reject();
          }
        }).on("wizard:forceclose", function() {
          dfd.reject();
        });
      });
      return dfd.promise();
    },
    getWizardConfigs: function(wizardConfigOptions) {
      let wizardConfigs = {
        steps: [ {
          id: "createRelation",
          title: function() {
            return lang.CreateRelationDialogueTitle;
          },
          viewClass: wizardConfigOptions.view,
          viewOptions: {
            hideSubjectRegion: true
          },
          nextStepId: function() {
            wizardConfigOptions.relationCollection.reset(this.options.selectedNodes.models);
            return "Properties";
          },
          buttons: [ {
            id: "next",
            label: function() {
              return this.selectedRelationModel && !_.isEmpty(this.selectedRelationModel.get("propertyPage")) ? lang.ContinueButtonLabel : lang.CreateButtonLabel;
            },
            disabled: function() {
              return this.isCreateButtonDisabled;
            },
            clickHandler: function() {
              let self = this;
              if (_.isString(this.selectedRelationModel.get("propertyPage")) && !_.isEmpty(this.selectedRelationModel.get("propertyPage"))) {
                this.options.shareableOptions["selectedRelationModel"] = this.selectedRelationModel;
                this.options.shareableOptions["descriptionView"] = this.descriptionView;
                this.options.shareableOptions["reverseRelation"] = this.reverseRelation;
                this.options.shareableOptions["hideItemSelectRegion"] = this.options.selectedNodes.length === 1;
                this.options.wizard && this.options.wizard.nextStep();
              } else {
                let relationsModel = new RelationsModel();
                let relationOptions = {
                  childNodes: this.options.selectedNodes,
                  reverseRelation: this.reverseRelation,
                  relationTypeModel: this.selectedRelationModel,
                  description: this.descriptionView ? this.descriptionView.getValues()["description_box"] : "",
                  parentNode: this.node
                };
                relationsModel.save(undefined, relationOptions).done(function(childNodes, successList, failedList) {
                  wizardConfigOptions.status.nodes = childNodes;
                  wizardConfigOptions.options.errorMessages = {};
                  wizardConfigOptions.options.successIds = successList.map(function(item) {
                    return item.id;
                  });
                  _.each(failedList, function(eachNode) {
                    wizardConfigOptions.options.errorMessages[eachNode.id] = eachNode.output && eachNode.output.message;
                  });
                  self.options.wizard.close();
                  wizardConfigOptions.dfd.resolve();
                }).fail(function(err) {
                  wizardConfigOptions.dfd.reject();
                  self.options.wizard.close();
                  CommandHelper.showErrorPanel(self.options.wizard.currentView.options.node, err && err.responseJSON && err.responseJSON.message, err.responseJSON && err.responseJSON.details);
                });
              }
            }
          } ],
          onCancel: function() {
            return CreationUtils.showConfirmationAlert.call(this, lang.ConfirmStopRelationTitle, lang.ConfirmStopRelationMsg, lang.ConfirmButtonlabel, "", true);
          }
        }, {
          id: "Properties",
          viewClass: wizardConfigOptions.ImportMetadataPropertiesView,
          title: function() {
            return this.getTitle();
          },
          subTitle: function() {
            return this.getSubTitle();
          },
          isPropertyPageType: true,
          viewOptions: {
            collection: wizardConfigOptions.relationCollection,
            multiItemSelect: true,
            hideMultiItemView: function() {
              return this.shareableOptions.hideItemSelectRegion;
            }
          },
          nextStepId: function() {
            return "finish";
          },
          buttons: [ {
            id: "nextFile",
            className: "nextFileBtn",
            isPrimary: true,
            label: function() {
              return this.nextFileCaption;
            },
            disabled: function() {
              return this.nextFileButtonDisabled;
            },
            hidden: function() {
              return this.nextFileButtonHidden;
            },
            clickHandler: function() {
              this.nextItem();
            }
          }, {
            id: "next",
            className: "nextBtn",
            label: function() {
              return lang.CreateButtonLabel;
            },
            disabled: function() {
              return this.nextButtonDisabled;
            },
            hidden: function() {
              return this.nextButtonHidden;
            },
            clickHandler: function() {
              let self = this;
              this.multiItemView.validateSelectedItem().done(function(isValid) {
                if (isValid) {
                  let relationsModel = new RelationsModel();
                  let relationOptions = {
                    childNodes: this.collection,
                    reverseRelation: this.options.shareableOptions.reverseRelation,
                    relationTypeModel: this.options.shareableOptions.selectedRelationModel,
                    description: this.options.shareableOptions.descriptionView ? this.options.shareableOptions.descriptionView.getValues()["description_box"] : "",
                    parentNode: this.options.node
                  };
                  var formValues = {};
                  _.each(this.collection.models, function(model) {
                    formValues[model.get("id")] = _.omit(model.get("properties"), [ "relation_name", "child_label", "child_id", "r_object_id", "permanent_link" ]);
                  });
                  _.extend(relationOptions, {
                    formValues: formValues
                  });
                  relationsModel.save(undefined, relationOptions).done(function(childNodes, successList, failedList) {
                    wizardConfigOptions.status.nodes = childNodes;
                    wizardConfigOptions.options.errorMessages = {};
                    wizardConfigOptions.options.successIds = successList.map(function(item) {
                      return item.id;
                    });
                    _.each(failedList, function(eachNode) {
                      wizardConfigOptions.options.errorMessages[eachNode.id] = eachNode.output && eachNode.output.message;
                    });
                    self.options.wizard.close();
                    wizardConfigOptions.dfd.resolve();
                  }).fail(function(err) {
                    wizardConfigOptions.dfd.reject();
                    self.options.wizard.close();
                    CommandHelper.showErrorPanel(self.options.wizard.currentView.options.node, err && err.responseJSON && err.responseJSON.message, err.responseJSON && err.responseJSON.details);
                  });
                }
              }.bind(this));
            }
          }, {
            id: "applyToRemaining",
            className: "applyToRemainingBtn",
            type: "binf-icon",
            toolTip: function() {
              return this.applyToRemainingCaption;
            },
            ariaLabel: function() {
              return this.applyToRemainingCaption;
            },
            disabled: function() {
              return this.applyRemainingBtnDisabled;
            },
            hidden: function() {
              return this.applyRemainingBtnHidden;
            },
            clickHandler: function() {
              this.applyToRemaining();
            }
          } ],
          onCancel: function() {
            return CreationUtils.showConfirmationAlert.call(this, lang.ConfirmStopRelationTitle, lang.ConfirmStopRelationMsg, lang.ConfirmButtonlabel, "", true);
          }
        } ],
        data: {
          collection: wizardConfigOptions.relationCollection,
          context: wizardConfigOptions.context,
          originatingView: wizardConfigOptions.CreateRelationFormView,
          container: wizardConfigOptions.status.container && wizardConfigOptions.status.container.get("container") && wizardConfigOptions.status.container.get("id") ? new NodeModel({
            id: wizardConfigOptions.status.container.get("id")
          }, {
            connector: wizardConfigOptions.connector
          }) : wizardConfigOptions.node.parent ? wizardConfigOptions.node.parent : new NodeModel({
            id: wizardConfigOptions.parentId
          }, {
            connector: wizardConfigOptions.connector
          }),
          node: wizardConfigOptions.node,
          connector: wizardConfigOptions.connector,
          relationTypes: wizardConfigOptions.options.relationTypes,
          selectedRelationModel: wizardConfigOptions.options.selectedRelationModel,
          status: wizardConfigOptions.status,
          shareableOptions: {
            isCreateRelation: true
          }
        },
        className: "d2-create-relations-wizard"
      };
      return wizardConfigs;
    },
    getMessageOptions: function(options) {
      var msgOpts = {
        oneFileSuccess: _.str.sformat(lang.RelationSuccessMessage, this.parentNode.get("name")),
        multiFileSuccess: _.str.sformat(lang.RelationsSuccessMessage, "{0}", this.parentNode.get("name")),
        oneFileFailure: _.str.sformat(lang.RelationsOneFailure, this.parentNode.get("name")),
        multiFileOneFailure: _.str.sformat(lang.RelationsMultiFileOneFailure, this.parentNode.get("name")),
        multiFileFailure: _.str.sformat(lang.RelationsMultiFileManyFailure, "{0}", this.parentNode.get("name")),
        multipleFileFailureOneFileSuccess: _.str.sformat(lang.RelationsMultiFileManyFailure, "{0}", this.parentNode.get("name")),
        actionType: "CREATE_RELATIONS"
      };
      if (options && options.multiFileAllFailed === true) {
        msgOpts.multiFileFailure = _.str.sformat(lang.RelationsMultiFileAllFailure, this.parentNode.get("name"));
      }
      return msgOpts;
    },
    _getWidgetConfig: function(options) {
      var widgetConfig = {}, collection = options.originatingView && options.originatingView.collection || options.collection;
      if (collection && collection.options) {
        widgetConfig.widgetType = collection.widgetType;
        widgetConfig.widgetName = collection.options.widgetName;
      }
      return widgetConfig;
    },
    handleResults: function(results, options) {
      var successCnt = 0, msg, nodeIds = [];
      _.each(results, function(result) {
        if (result instanceof Backbone.Model) {
          ++successCnt;
          nodeIds.push(result.get("id"));
        }
      });
      if (!this.inRelationsView && results.length === successCnt) {
        if (successCnt === 1) {
          msg = _.str.sformat(lang.RelationSuccessMessage, this.parentNode.get("name"));
        } else {
          msg = _.str.sformat(lang.RelationsSuccessMessage, successCnt, this.parentNode.get("name"));
        }
        GlobalMessage._showMessageView(NodeCreationSuccessMessageView, {
          showLink: true,
          node: this.parentNode,
          context: options.context,
          originatingView: options.originatingView,
          successMessageFormat: msg,
          link_command_signature: "D2-OpenRelations",
          linkLabel: lang.RelationsMsgLinkLabel,
          linkCommandOptions: {
            task: options.task,
            selectedNodeId: options.selectedNodeId,
            selectedFileTab: options.selectedFileTab,
            selectedMetaTab: "relations"
          }
        });
      }
      if (nodeIds.length > 0) {
        nodeIds.push(this.parentNode.get("id"));
        options.context.trigger("d2:add:relation", nodeIds);
      }
    }
  });
});