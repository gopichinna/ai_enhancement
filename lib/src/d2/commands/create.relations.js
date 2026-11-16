/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
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
      var dfd = $.Deferred(), me = this;
      require([ "d2/controls/stepper.wizard/stepper.wizard.view", "d2/dialogs/create.relation/create.relation.form.view" ], function(StepperWizard, CreateRelationFormView) {
        var context = status.context, connector = context.getObject(ConnectorFactory), view = CreateRelationFormView, node = me.parentNode, parentId = node.get("parent_id") === 0 ? node.get("parent_id_expand")?.id : node.get("parent_id"), wizard = new StepperWizard({
          steps: [ {
            id: "createRelation",
            title: function() {
              return lang.CreateRelationDialogueTitle;
            },
            viewClass: view,
            viewOptions: {
              hideSubjectRegion: true
            },
            buttons: [ {
              id: "next",
              label: function() {
                return lang.CreateButtonLabel;
              },
              disabled: function() {
                return this.isCreateButtonDisabled;
              },
              clickHandler: function() {
                this.node.connector = this.connector;
                var relationsModel = new RelationsModel();
                relationsModel.save(undefined, {
                  childNodes: this.options.selectedNodes,
                  reverseRelation: this.reverseRelation,
                  relationTypeModel: this.selectedRelationModel,
                  description: this.descriptionView ? this.descriptionView.getValues()["description_box"] : "",
                  parentNode: this.node
                }).done(function(childNodes, successList, failedList) {
                  status.nodes = childNodes;
                  options.errorMessages = {};
                  options.successIds = successList.map(function(item) {
                    return item.id;
                  });
                  _.each(failedList, function(eachNode) {
                    options.errorMessages[eachNode.id] = eachNode.output && eachNode.output.message;
                  });
                  wizard.close();
                  dfd.resolve();
                }).fail(function(err) {
                  dfd.reject();
                  wizard.close();
                  CommandHelper.showErrorPanel(wizard.currentView.options.node, err && err.responseJSON && err.responseJSON.message, err.responseJSON && err.responseJSON.details);
                });
              }
            } ],
            onCancel: function() {
              return CreationUtils.showConfirmationAlert.call(this, lang.ConfirmStopRelationTitle, lang.ConfirmStopRelationMsg, lang.ConfirmButtonlabel, "", true);
            }
          } ],
          data: {
            context: context,
            originatingView: CreateRelationFormView,
            container: status.container && status.container.get("container") && status.container.get("id") ? new NodeModel({
              id: status.container.get("id")
            }, {
              connector: connector
            }) : node.parent ? node.parent : new NodeModel({
              id: parentId
            }, {
              connector: connector
            }),
            node: node,
            connector: connector,
            relationTypes: options.relationTypes,
            selectedRelationModel: options.selectedRelationModel,
            status: status
          },
          className: "d2-create-relations-wizard"
        });
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