/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "d2/controls/globalmessage/globalmessage", "csui/dialogs/modal.alert/modal.alert", "nuc/models/nodes", "nuc/utils/url", "csui/utils/commandhelper", "csui/utils/commands/node", "d2/commands/vdoc/vdoc.mixin", "d2/utils/constants", "d2/utils/creation.utils", "csui/models/widget/search.results/search.facets", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "d2/utils/vdoc.utils", "d2/utils/vdoc.creation.utils", "d2/utils/content.assist", "i18n!d2/commands/nls/localized.strings", "i18n!d2/controls/form/impl/nls/lang" ], function(require, _, $, Backbone, GlobalMessage, ModalAlert, NodeModel, Url, CommandHelper, NodeCommand, VDocCommandMixin, constants, CreationUtils, SearchFacetCollection, RestResources, RestLinkrels, VdocUtils, vDocCreationUtils, ContentAssist, lang, ctrlLang) {
  "use strict";
  var VDocInheritedChildren = NodeCommand.extend({
    defaults: {
      signature: "D2-VDocInheritedChildren",
      command_key: "D2-VDocInheritedChildren",
      name: lang.CommandVDocInheritedChildren,
      scope: "single"
    },
    STEPS: Object.freeze({
      VDOC_TEMPLATE: "vdoc_templates",
      ASYNC_OPERATION: "async_operation"
    }),
    getContentAssistOptions: function(me, status, container, options, deferred) {
      ContentAssist.getContentAssistOptions(status).done(function(config) {
        var title = config ? config.label_value : "";
        var includeBrowse = config && config.properties ? config.properties.has_browse_assist : true;
        var includeFavorites = config && config.properties ? config.properties.has_favorites_assist : false;
        var globalSearch = config && config.properties ? config.properties.has_search_assist : false;
        if (!includeBrowse && !includeFavorites && !globalSearch) {
          includeBrowse = true;
        }
        me.displayContentAssist(title, includeBrowse, includeFavorites, globalSearch, status, container, options, deferred);
      }).fail(function(error) {
        deferred.reject(error);
      });
    },
    displayContentAssist: function(title, includeBrowse, includeFavorites, globalSearch, status, container, options, dfd) {
      var node = CommandHelper.getJustOneNode(status), self = this;
      require([ "d2/dialogs/target.browse/target.browse" ], function(NodePicker) {
        container.ensureFetched().done(function() {
          var pickerOptions = {
            dialogTitle: title,
            connector: container.connector,
            container: container,
            initialContainer: container,
            context: status.context,
            selectMultiple: false,
            includeBrowse: includeBrowse,
            globalSearch: globalSearch,
            includeFavorites: includeFavorites,
            selectType: "virtualType",
            selectTypeValue: true,
            url_filter: "type(dm_folder) or r_is_virtual_doc = 1",
            selectButtonLabel: lang.CommandVDocInheritedChildrenNextButtonLabel
          };
          pickerOptions.storeContainer = true;
          pickerOptions.restoreContainer = true;
          pickerOptions.dataId = constants.StorageKey.INSERT_INHERITED_CHILDREN_COMMAND + constants.StorageKey.ANCESTOR_INFO;
          if (!pickerOptions.dialogTitle || pickerOptions.dialogTitle.length === 0) {
            pickerOptions.dialogTitle = ctrlLang.addContent;
          }
          pickerOptions.searchFacets = new SearchFacetCollection();
          pickerOptions.searchFacets.filters = [ {
            id: "r_is_virtual_doc",
            values: [ {
              id: "r_is_virtual_doc",
              uniqueid: "r_is_virtual_doc",
              facetvalue: 1,
              facetid: "r_is_virtual_doc",
              parentid: "",
              query: "r_is_virtual_doc%1"
            } ]
          } ];
          pickerOptions.startLocations = [];
          if (pickerOptions.includeBrowse) {
            pickerOptions.startLocations.push("current.location");
          }
          if (pickerOptions.includeFavorites) {
            pickerOptions.startLocations.push("favorites");
          }
          pickerOptions.container.widgetConfig.widget_type = "";
          self.nodePicker = new NodePicker(pickerOptions);
          self.nodePicker.show().done(function(selectedNodes) {
            var childNode = selectedNodes["nodes"][0];
            self._checkSameNameOverride(status, node, childNode).done(function(replaceInherited) {
              self._fetchVDTemplates(childNode.get("id"), container.connector).done(function(VdocTemplateList) {
                if (VdocTemplateList.length === 0) {
                  var buttonOptions = {
                    context: status.context
                  };
                  ModalAlert.showError(function(result) {
                    dfd.resolve(result);
                  }, lang.CommandVDocInheritedChildrenNoVDMessage, lang.CommandVDocInheritedChildren, buttonOptions);
                } else {
                  node.vdocTemplates = VdocTemplateList;
                  status.selectedNode = childNode;
                  self.openWizard(status, options, childNode.get("id"), node, replaceInherited).done(function(data) {
                    dfd.resolve(data);
                  }).fail(function(err) {
                    if (!err.isCancelled) {
                      self._errorMessage(err, node);
                    }
                    dfd.reject(err);
                  });
                }
              }).fail(function(err) {
                self._errorMessage(new Error(lang.CommandVDocInheritedChildrenNoVDErrorMessage), node);
                dfd.reject(err);
              });
            }).fail(function(err) {
              dfd.reject(err);
            });
          }).fail(function(err) {
            if (!err.cancelled) {
              self._errorMessage(err, node);
            }
            dfd.reject(err);
          });
        }.bind(self));
      }, dfd.reject);
    },
    execute: function(status, options) {
      status.suppressFailMessage = true;
      status.suppressSuccessMessage = true;
      var dfd = $.Deferred();
      var node = CommandHelper.getJustOneNode(status), nodeModel = status.data && status.data.useContainer ? status.container : node;
      var container = nodeModel.parent;
      this.getContentAssistOptions(this, status, container, options, dfd);
      return dfd.promise();
    },
    _checkSameNameOverride: function(status, nodeModel, selectedNode) {
      var dfd = $.Deferred();
      var sameObjectList = status.collection.getChildrenOf(nodeModel).filter(function(item) {
        return item.get("name") === selectedNode.get("name");
      });
      if (sameObjectList.length > 0) {
        ModalAlert.confirmQuestion(function(result) {
          if (result !== undefined) {
            dfd.resolve(result);
          } else {
            dfd.reject({
              isCancelled: true
            });
          }
        }, _.str.sformat(lang.CommandVDocInheritedChildrenSameMessage, selectedNode.get("name")), lang.CommandVDocInheritedChildrenSameTitle, {
          buttons: {
            showYes: true,
            labelYes: lang.CommandVDocInheritedChildrenSameYesLabel,
            showNo: true,
            labelNo: lang.CommandVDocInheritedChildrenSameNoLabel,
            showCancel: true
          }
        });
      } else {
        dfd.resolve(false);
      }
      return dfd.promise();
    },
    setVdocTemplateForNode: function(nodeModel, vdocTemplate, inheritedId, replaceInherited) {
      var dfd = $.Deferred();
      vDocCreationUtils.performLockPrecheck([ nodeModel ]).done(function() {
        if (vdocTemplate && vdocTemplate.get("id") && inheritedId) {
          var url = CommandHelper.getOriginalActionLink(nodeModel, this.get("signature"), RestLinkrels.D2_VD_INSERT_INHERITED_COMPONENT);
          if (!url) {
            dfd.reject(lang.MissingVDocTemplateLinkrel);
            return dfd.promise();
          }
          var urlParam = {
            "inherited-id": inheritedId,
            "vd-template-id": vdocTemplate.get("id"),
            "track-async-operation": true,
            "override-inherited-vd-root": replaceInherited
          };
          url = Url.appendQuery(url, Url.combineQueryString(urlParam));
          $.ajax(nodeModel.connector.extendAjaxOptions({
            url: url,
            type: "POST",
            headers: {
              "Content-Type": constants.MediaTypes.DCTM_JSON
            },
            success: function(response) {
              var asyncObjectUrl = RestLinkrels.getLink(response.links, RestLinkrels.ASYNC_OPERATION);
              if (asyncObjectUrl) {
                nodeModel.asyncURL = asyncObjectUrl;
              }
              dfd.resolve(nodeModel);
            },
            error: function(request) {
              dfd.reject(request);
            }
          }));
        } else {
          dfd.reject(lang.MissingVDocTemplateLinkrel);
        }
      }.bind(this)).fail(dfd.reject);
      return dfd.promise();
    },
    showSuccessAndClose: function(node, status, wizard) {
      var self = this, deferred = $.Deferred();
      self._announceOperationEnd(wizard, status);
      if (wizard) {
        wizard.close({
          success: true
        });
      }
      var originalNode = CommandHelper.getJustOneNode(status), vdmNumber = VdocUtils.getVDMNumber(originalNode);
      if (!VdocUtils.isVirtualDoc(originalNode)) {
        vdmNumber = VdocUtils.getParentVDMNumber(originalNode);
      }
      status.collection.refresh({
        vdmNumber: vdmNumber,
        force: true
      }).done(function() {
        status.collection.trigger("children:added", VdocUtils.getVDMNumber(originalNode));
        deferred.resolve();
      }).fail(function(err) {
        deferred.reject(err);
      });
      GlobalMessage.showMessage("success", _.str.sformat(lang.CommandVDocInheritedChildrenSuccesMessage, status.selectedNode.get("name")));
      return deferred.promise();
    },
    onCancel: function() {
      return CreationUtils.showCancelAlertForImport.call(this, lang.CommandVDocInheritedChildrenCancelAlertMessage, "", lang.CommandVDocInheritedChildrenCancelAlertButtonLabelYes, true);
    },
    openWizard: function(status, options, inheritedId, node, replaceInherited) {
      var deferred = $.Deferred(), action = this;
      action.wizard = null;
      require([ "csui/utils/contexts/perspective/perspective.context", "d2/controls/stepper.wizard/stepper.wizard.view", "d2/dialogs/new.file/create/create.select.vdoc.template.view", "d2/dialogs/new.file/vdoc.async.view" ], function(PerspectiveContext, StepperWizard, VdocTemplateView, VDOCAsyncView) {
        function showWizard(stepPage) {
          action.wizard.show(stepPage).on("wizard:closed", function(isCancel, arg) {
            status.results = arg;
            status.isCancelled = isCancel;
            if (!isCancel && arg && arg.success === true) {
              deferred.resolve(status, options);
            } else {
              deferred.reject(status, options);
            }
          }).on("wizard:forceclose", function() {
            deferred.reject(status, options);
          });
        }
        var stepOptions = {
          steps: [ {
            id: action.STEPS.VDOC_TEMPLATE,
            viewClass: VdocTemplateView,
            title: function() {
              return this.getTitle();
            },
            subTitle: "",
            viewOptions: {
              templates: new Backbone.Collection()
            },
            nextStepId: function() {
              return action.stepId;
            },
            buttons: [ {
              id: "next",
              disabled: function() {
                return this.nextButtonDisabled;
              },
              clickHandler: function() {
                var view = this;
                action.setVdocTemplateForNode(node, view._vdocTemplate, inheritedId, replaceInherited).then(function(nodeModel) {
                  if (nodeModel.asyncURL) {
                    action.stepId = action.STEPS.ASYNC_OPERATION;
                    action.wizard.nextStep();
                  } else {
                    action.showSuccessAndClose(node, status, action.wizard).done(function() {
                      deferred.resolve();
                    }).fail(function(err) {
                      deferred.reject(err);
                    });
                  }
                }).fail(function(err) {
                  deferred.reject(err);
                });
              }
            } ],
            onCancel: function() {
              return action.onCancel();
            }
          }, {
            id: action.STEPS.ASYNC_OPERATION,
            viewClass: VDOCAsyncView,
            transient: true,
            title: function() {
              return this.getTitle();
            },
            nextStepId: function() {
              action.showSuccessAndClose(node, status, action.wizard).done(function() {
                deferred.resolve();
              }).fail(function(err) {
                deferred.reject(err);
              });
              return "";
            },
            viewOptions: {},
            buttons: [ {
              id: "previous",
              hidden: true
            }, {
              id: "cancel",
              hidden: true
            }, {
              id: "next",
              hidden: true
            }, {
              id: "minimize_wizard",
              align: "end",
              isPrimary: true,
              label: function() {
                return this.minimizeButtonLabel;
              },
              hidden: function() {
                return !(status.context instanceof PerspectiveContext);
              },
              clickHandler: function() {
                this.minimize();
              }
            } ],
            onCancel: function() {
              if (!this.isCancellable()) {
                return action.onCancel();
              }
            }
          } ],
          data: {
            node: node,
            context: status.context,
            container: status.container
          },
          className: "d2-inherited-children-wizard"
        };
        if (node.vdocTemplates.length === 1) {
          action.setVdocTemplateForNode(node, node.vdocTemplates.models[0], inheritedId, replaceInherited).then(function(nodeModel) {
            if (nodeModel.asyncURL) {
              action.wizard = new StepperWizard(stepOptions);
              showWizard(action.STEPS.ASYNC_OPERATION);
            } else {
              action.showSuccessAndClose(node, status, action.wizard).done(function() {
                deferred.resolve();
              }).fail(function(err) {
                deferred.reject(err);
              });
            }
          }).fail(function(err) {
            deferred.reject(err);
          });
        } else {
          action.wizard = new StepperWizard(stepOptions);
          showWizard(action.STEPS.VDOC_TEMPLATE);
        }
      });
      return deferred.promise();
    },
    _announceOperationStart: function(wizard, status) {
      var view = wizard || status.originatingView;
      if (view && view.blockActions) {
        view.blockActions();
      }
    },
    _announceOperationEnd: function(wizard, status) {
      var view = wizard || status.originatingView;
      if (view && view.unblockActions) {
        view.unblockActions();
      }
    },
    _fetchVDTemplates: function(inheritedId, connector) {
      var dfd = $.Deferred();
      require([ "d2/dialogs/new.file/create/vdoc.templates" ], function(VdocTemplatesCollection) {
        var vdocTemplatesCollection = new VdocTemplatesCollection(undefined, {
          connector: connector,
          inheritedId: inheritedId,
          orderBy: "name asc",
          autoreset: true
        });
        vdocTemplatesCollection.fetch().then(function() {
          dfd.resolve(vdocTemplatesCollection);
        }, function(error) {
          dfd.reject(error);
        });
      });
      return dfd.promise();
    },
    _errorMessage: function(error, node) {
      CommandHelper.showErrorPanel(node, lang.CommandVDocInheritedChildrenErrorMessage, _.isString(error) ? error : error && (error.responseJSON && error.responseJSON.details || error.message));
    }
  });
  VDocCommandMixin.mixin(VDocInheritedChildren.prototype);
  return VDocInheritedChildren;
});