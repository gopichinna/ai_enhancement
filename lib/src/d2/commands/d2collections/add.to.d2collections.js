/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "csui/models/command", "nuc/models/nodes", "csui/utils/commandhelper", "i18n!d2/commands/nls/localized.strings", "d2/utils/rest.linkrels", "csui/controls/form/pub.sub", "nuc/models/node/node.model", "dctmw/utils/utils", "d2/utils/content.assist", "i18n!d2/controls/form/impl/nls/lang", "d2/utils/constants", "dctmw/utils/rest.resources", "nuc/utils/url", "d2/controls/globalmessage/impl/progresspanel/node.creation.success.message.view", "csui/models/fileuploads", "d2/controls/globalmessage/globalmessage", "csui/utils/contexts/factories/connector" ], function(require, _, $, Backbone, CommandModel, NodeCollection, CommandHelper, lang, RestLinkrels, PubSub, NodeModel, utils, ContentAssist, ctrLang, constants, RestResources, Url, NodeCreationSuccessMessageView, UploadFileCollection, GlobalMessage, ConnectorFactory) {
  "use strict";
  return CommandModel.extend({
    selectedNode: "",
    defaults: {
      signature: "D2-AddToCollections",
      command_key: "D2-AddToCollections",
      name: lang.CommandNameAddToCollection,
      verb: lang.CommandNameAddToCollection,
      scope: "multiple"
    },
    isInCollectionPerspective: false,
    _blockActions: function(view) {
      view && _.isFunction(view.blockActions) && view.blockActions();
    },
    _unblockActions: function(view) {
      view && _.isFunction(view.unblockActions) && view.unblockActions();
    },
    execute: function(status, options, from) {
      this.isInCollectionPerspective = status.originatingView.options.isInCollectionPerspective ? true : false;
      if (status.data && status.data.menuId === "menuContextAddToCollectionItems") {
        from = "browser";
      }
      if (from === "browser") {
        this.fetchContentAssistOptions(status, options, from).then(function(res) {
          var selModel = status.toolItem ? status.toolItem.status.nodes.models[0] : status.originatingView.selectedModel;
          if (res.me.action === "createCollection") {
            res.me.action = "";
            res.me.createCollection(res.status, res.me.newCollectionName, res.nodes.map(node => node.attributes.id), res.me.action);
          } else {
            res.me.addItemsToCollection(selModel.get("r_object_id"), res.nodes, res.status);
          }
        });
      } else {
        this.action = from;
        var me = this;
        let selModel = status.toolItem ? status.toolItem.status.nodes.models[0] : status.originatingView.selectedModel;
        this._fetchDialogMetaData(selModel).then(function(result) {
          me._showDialog(status, options, from, result);
        });
      }
      return $.Deferred().resolve().promise();
    },
    _fetchDialogMetaData(_collectionModel) {
      return $.Deferred().resolve().promise();
    },
    _showDialog: function(collection, options, from, dialogMetaData) {
      var self = this, selModel = collection.toolItem ? collection.toolItem.status.nodes.models[0] : collection.originatingView.selectedModel, dfd = $.Deferred();
      require([ "dctmw/dialogs/modal.alert.custom.content/customizable.modal.alert", "d2/dialogs/add.collections/add.to.collection.view", "d2/dialogs/share.collections/share.collection.view" ], function(ModelAlert, AddToCollectionView, ShareCollectionView) {
        if (!options) {
          options = new Object();
        }
        var formContent = self._getFormContent(from, dialogMetaData), modalView = getModalView(self);
        function getModalView(self) {
          if (self.get("signature") === "D2-share-collection" || self.get("signature") === "D2-manageshare-collection") {
            return new ShareCollectionView({
              context: collection.context,
              formContent: formContent,
              signature: self.get("signature")
            });
          } else {
            return new AddToCollectionView({
              context: collection.context,
              sourceCollectionModel: selModel,
              collection: collection.collection,
              formContent: formContent,
              signature: self.get("signature")
            });
          }
        }
        function getYesButton() {
          var $modelContent = modalView.$el.closest(".binf-modal-content");
          return $modelContent.find(".binf-modal-footer .csui-yes");
        }
        function enableYesButtton() {
          var $addToCollectionEnableButton = getYesButton();
          $addToCollectionEnableButton.removeAttr("disabled");
        }
        function enableNoButton() {
          var createCollectionButton = modalView.$el.closest(".binf-modal-content").find(".binf-modal-footer .csui-no");
          return createCollectionButton.removeAttr("disabled");
        }
        function disableNoButton() {
          var createCollectionButton = modalView.$el.closest(".binf-modal-content").find(".binf-modal-footer .csui-no");
          return createCollectionButton.attr("disabled", "disabled");
        }
        function disableYesButtton() {
          var $addToCollectionDisableButton = getYesButton();
          $addToCollectionDisableButton.attr("disabled", "disabled");
        }
        function onFieldValueUpdate() {
          var selectedValue;
          selectedValue = self._getSelectedValue(modalView, from);
          if (self._validateForm(modalView, from, selModel)) {
            self._setSelectedFormData(modalView, options, selectedValue);
            enableYesButtton();
            if (from === "createCollection") enableNoButton();
          } else {
            disableYesButtton();
            if (from === "createCollection") disableNoButton();
          }
        }
        function onRenderForm() {
          const formInterval = setInterval(() => {
            if ($(".binf-modal-footer").is(":visible")) {
              $(".binf-modal-footer").children().each(function(idx, el) {
                if (el.id !== "btn-cancel") {
                  $(el).attr("disabled", "disabled");
                }
              });
              clearInterval(formInterval);
            }
          }, 500);
        }
        self.listenToOnce(modalView, "render:form", onRenderForm);
        self.listenToOnce(PubSub, "dctm:custom:modal:alert:show", disableYesButtton);
        self.listenTo(modalView, "d2:change:formValidation", onFieldValueUpdate);
        ModelAlert.confirmQuestion(function(result) {
          if (result !== undefined) {
            if ((!options["data"].selectedCollection || options["data"].selectedCollection.r_object_id !== options["data"].collectionName) && collection.nodes && Object.keys(collection.nodes).length > 0) {
              from = "createCollectionAndAddItem";
            }
            self.handleResult(collection, result, from, options, self);
            dfd.resolve();
          } else {
            options.hideFailureMessage = true;
            dfd.reject(new Error());
          }
        }, "", self._getTitle(from, selModel), {
          buttons: self._getButtonsList(from, selModel),
          contentView: modalView,
          modalClass: self._getModalClassName()
        });
      });
      return dfd.promise();
    },
    _getModalClassName() {
      return "d2-add-to-collection-model";
    },
    _getSelectedValue(modalView, from) {
      if (from === "createCollection") {
        return modalView.getValues()["create_collection"];
      } else {
        return modalView.getValues()["add_to_collections_list"];
      }
    },
    _validateForm(modalView, from, _model) {
      let selectedValue = this._getSelectedValue(modalView, from);
      return Array.isArray(selectedValue) && selectedValue.length > 0 || typeof selectedValue === "string" && selectedValue.trim();
    },
    _setSelectedFormData(modalView, options, selectedValue) {
      options["data"] = {
        collectionName: selectedValue
      };
      if (modalView.userData && modalView.userData.hasOwnProperty(selectedValue)) {
        options["data"].selectedCollection = modalView.userData[selectedValue];
      }
    },
    _getTitle: function(from, _model) {
      return from === "createCollection" ? lang.createCollectionModelTitle : lang.AddToCollectionModelTitle;
    },
    _getFormContent: function(from, _dialogMetaData) {
      return from === "createCollection" ? this._getCreateCollectionForm() : this._getAddToCollectionForm();
    },
    _getAddToCollectionForm: function() {
      var collectionForm = {
        dialog: {
          content: {
            order: 1,
            "combo-editable": {
              id: "add_to_collections_list",
              label: lang.AddToCollectionFormLabelCollection,
              assistance_type: "custom",
              asynchronous: true,
              condition_required: true,
              order: 1,
              autoselect_single: true
            }
          }
        }
      };
      return collectionForm;
    },
    _getCreateCollectionForm: function() {
      var collectionForm = {
        dialog: {
          content: {
            order: 1,
            text: {
              id: "create_collection",
              label: lang.createCollectionTextLabel,
              assistance_type: "custom",
              asynchronous: true,
              condition_required: true,
              order: 1,
              autoselect_single: true
            }
          }
        }
      };
      return collectionForm;
    },
    _getButtonsList: function(from, _model) {
      var buttons;
      if (from === "createCollection") {
        buttons = {
          showYes: true,
          labelYes: lang.createAndAddItemsButtonLabel,
          showNo: true,
          labelNo: lang.createButtonLabel,
          showCancel: true
        };
      } else {
        buttons = {
          showYes: true,
          labelYes: lang.AddToCollectionModelButtonLabel,
          showNo: false,
          showCancel: true
        };
      }
      return buttons;
    },
    handleResult(status, result, from, options, self) {
      if (from === "createCollection") {
        self.newCollectionName = options.data.collectionName;
        if (result === false) {
          self.createCollection(status, options.data.collectionName, [], from);
          self.action = null;
        } else if (result === true) {
          self.execute({
            context: status.context,
            originatingView: status.originatingView,
            collection: status.originatingView.collection
          }, {
            commandKey: "D2-AddToCollections"
          }, "browser");
        }
      } else if (from === "createCollectionAndAddItem") {
        let items = status.nodes.models.map(node => node.attributes.id);
        self.createCollection(status, options.data.collectionName, items, from);
        self.action = null;
      } else {
        let collectionId = options.data.collectionName;
        self.addItemsToCollection(collectionId, status.nodes, status, options);
      }
    },
    createCollection: function(status, collectionName, collectionItems, from) {
      var self = this;
      var deferred = $.Deferred();
      var url = this._getCreateCollectionUrl(), payload = {
        properties: {
          object_name: collectionName.trim(),
          items_object_id: collectionItems
        }
      };
      this._blockActions(status.originatingView);
      $.ajax(status.originatingView.collection.connector.extendAjaxOptions({
        url: url,
        type: "POST",
        contentType: constants.MediaTypes.DCTM_JSON,
        dataType: "json",
        data: JSON.stringify(payload),
        success: function(response) {
          _.extend(response.properties, {
            name: response.properties.object_name,
            id: response.properties.r_object_id,
            type: constants.Types.COLLECTIONS,
            links: response.links
          });
          let newModel = null;
          self.action = null;
          let model = null;
          if (!status.nodes || status.nodes && Object.keys(status.nodes).length === 0) {
            status.originatingView.collection.unshift(response.properties);
            model = status.originatingView.collection.where({
              r_object_id: response.properties.r_object_id
            })[0];
            status.originatingView.collection.allModels.unshift(model);
            if (status.originatingView.collection.length === 1 && self.isInCollectionPerspective) {
              status.originatingView.updateTableEmptyViewVisibility();
              status.originatingView.loadTableView(model);
            } else {
              status.originatingView.listView.onClickItem(status.originatingView.listView.children.findByModelCid(model.cid));
            }
          }
          if (from === "createCollectionAndAddItem") {
            let docItems = status.nodes.models.length == 1 ? '"' + status.nodes.models[0].attributes.name + '"' : status.nodes.models.length + " items";
            if (window.location.href.indexOf("#d2/collection?") > -1) {
              status.originatingView.d2CollectionsListsWrapperView.myCollectionsListView.collection.unshift(response.properties);
              newModel = status.originatingView.d2CollectionsListsWrapperView.myCollectionsListView.collection.where({
                r_object_id: response.properties.r_object_id
              })[0];
              newModel.set("isSharedCollection", false);
              newModel.fetch().done(() => {
                status.originatingView.d2CollectionsListsWrapperView.myCollectionsListView.collection.allModels.unshift(newModel);
                let newModelView = status.originatingView.d2CollectionsListsWrapperView.myCollectionsListView.listView.children.findByModelCid(newModel.cid);
                status.originatingView.d2CollectionsListsWrapperView.myCollectionsListView.listView._setCssItemSelected(newModelView.$el);
                status.originatingView.d2CollectionsListsWrapperView.myCollectionsListView.listView.scrollToCollection(newModel.get("r_object_id"));
                status.originatingView.loadTableView(newModel);
              });
            }
            if (Object.prototype.hasOwnProperty.call(status.originatingView, "allSelectedNodes")) {
              status.originatingView.allSelectedNodes().reset();
            } else {
              PubSub.trigger("d2collections:landing-page:widget:refetch");
            }
            if (window.location.href.indexOf("#d2/collection?") == -1) {
              if (newModel === null && response.properties) {
                newModel = new Backbone.Model(response.properties);
              }
              GlobalMessage._showMessageView(NodeCreationSuccessMessageView, {
                showLink: true,
                node: newModel,
                context: status.context,
                successMessageFormat: _.str.sformat(lang.addToCollSuccessMsg, docItems, collectionName),
                linkLabel: lang.goToCollectionsLink,
                originatingView: status.originatingView,
                link_command_signature: "D2-GoToD2Collection"
              });
            } else {
              GlobalMessage.showMessage("success", _.str.sformat(lang.addToCollSuccessMsg, docItems, collectionName));
            }
          } else {
            PubSub.trigger("collectionList:updated", model, true);
            GlobalMessage.showMessage("success", _.str.sformat(lang.createCollectionSuccessMsg, response.properties.object_name));
          }
          if (status.originatingView?.updateTitleCount) {
            status.originatingView.updateTitleCount();
          } else if (status.originatingView?.myCollectionsListView?.updateTitleCount) {
            status.originatingView.myCollectionsListView.updateTitleCount();
          }
          self._unblockActions(status.originatingView);
          deferred.resolve(response);
        },
        error: function(xhr, message, statusText) {
          CommandHelper.showErrorPanel(status.originatingView.collection, message, utils.parseAjaxErrorAsString(xhr, statusText, message));
          self._unblockActions(status.originatingView);
          deferred.reject();
        }
      }));
      return deferred.promise();
    },
    _getAddItemsToCollectionUrl(collection_r_Object_id) {
      var url = RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.SELF);
      url = Url.combine(url, "collections/" + collection_r_Object_id + "/items");
      return url;
    },
    addItemsToCollection(collection_r_Object_id, itemNodes, status, formData) {
      this._blockActions(status.originatingView);
      let connector = status.originatingView.context.getObject(ConnectorFactory);
      let items = itemNodes.map(node => node.attributes.id);
      var me = this;
      var deferred = $.Deferred();
      var url = this._getAddItemsToCollectionUrl(collection_r_Object_id), payload = {
        items_object_id: items,
        move_from_collection: ""
      };
      let selModel = status.toolItem ? status.toolItem.status.nodes.models[0] : status.originatingView.selectedModel;
      status.originatingView = status.originatingView.options.originatingView || status.originatingView;
      $.ajax(connector.extendAjaxOptions({
        url: url,
        type: "POST",
        contentType: constants.MediaTypes.DCTM_JSON,
        dataType: "json",
        data: JSON.stringify(payload),
        success: function(response) {
          let docItems = itemNodes.length == 1 ? '"' + itemNodes.at(0).attributes.name + '"' : itemNodes.length + " items";
          let collectionName = null;
          if (formData) {
            collectionName = formData["data"] && formData["data"].selectedCollection ? formData["data"].selectedCollection.object_name : formData.nodes.get("object_name");
          } else {
            collectionName = selModel.get("object_name");
          }
          if (response.warnings && response.warnings.length > 0) {
            let title = response.warnings.length + lang.addToCollWarningMsg;
            let warnings = response.warnings.map(warning => {
              return {
                collectionItemModel: itemNodes.find(item => item.attributes.id === warning.r_object_id),
                warnMessage: warning["rest-error"].message
              };
            });
            me._showErrorMessage(warnings, title, status.originatingView.collection.connector);
          } else {
            if (window.location.href.indexOf("#d2/collection?") == -1) {
              GlobalMessage._showMessageView(NodeCreationSuccessMessageView, {
                showLink: true,
                node: selModel,
                context: status.context,
                successMessageFormat: _.str.sformat(lang.addToCollSuccessMsg, docItems, collectionName),
                linkLabel: lang.goToCollectionsLink,
                originatingView: status.originatingView,
                link_command_signature: "D2-GoToD2Collection"
              });
            } else {
              GlobalMessage.showMessage("success", _.str.sformat(lang.addToCollSuccessMsg, docItems, collectionName));
            }
          }
          if (status.originatingView.allSelectedNodes) {
            me.unselectSuccessfulItemModels(status.originatingView.allSelectedNodes(), response.warnings?.map(warn => warn.r_object_id));
          }
          if (status.originatingView.selectedModel && status.originatingView.selectedModel.attributes.r_object_id === collection_r_Object_id) {
            _.forEach(itemNodes, function(node) {
              if (status.originatingView.collection.where({
                id: node.get("id")
              }).length === 0) status.originatingView.collection.unshift(node, {
                connector: status.originatingView.collection.connector,
                parentLinks: status.originatingView.selectedModel.get("links")
              });
              status.originatingView.collection.fetch({
                reload: true,
                skipSWCache: true
              });
            });
          }
          me._unblockActions(status.originatingView);
          deferred.resolve(response);
        },
        error: function(xhr, message, statusText) {
          CommandHelper.showErrorPanel(status.originatingView.collection, message, utils.parseAjaxErrorAsString(xhr, statusText, message));
          deferred.reject();
        }
      }));
      return deferred.promise();
    },
    _showErrorMessage: function(warnings, title, connector) {
      var queueItems = warnings.map(function(warning) {
        return {
          name: warning.collectionItemModel.get("name"),
          state: "rejected",
          errorMessage: warning.warnMessage,
          count: 1,
          total: 1,
          node: warning.collectionItemModel
        };
      });
      var nodeCollection = new UploadFileCollection(queueItems, {
        connector: connector
      });
      nodeCollection.each(function(item) {
        item.node = item.get("node");
        item.unset("node");
      });
      GlobalMessage.showProgressPanel(nodeCollection, {
        multiFileFailure: title,
        actionType: "SHARE"
      });
    },
    unselectSuccessfulItemModels: function(selectedNodes, r_objectIdsToRetain) {
      if (!r_objectIdsToRetain) {
        selectedNodes.reset();
      } else {
        var nodesToUnselect = selectedNodes.filter(node => {
          return r_objectIdsToRetain.indexOf(node.get("id")) === -1;
        });
        selectedNodes.remove(nodesToUnselect);
      }
    },
    _getCreateCollectionUrl: function() {
      var url = RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.SELF);
      url = Url.combine(url, "collections/my-collections");
      return url;
    },
    fetchContentAssistOptions: function(status, options, from) {
      var deferred = $.Deferred(), me = this, container = new NodeModel(undefined, {
        connector: status.originatingView.collection.connector,
        autofetch: true
      });
      ContentAssist.getContentAssistOptions(status).done(function(config) {
        var title = config ? config.label_value : "";
        var includeBrowse = config && config.properties ? config.properties.has_browse_assist : true;
        var includeFavorites = config && config.properties ? config.properties.has_favorites_assist : false;
        var globalSearch = config && config.properties ? config.properties.has_search_assist : false;
        me._displayContentAssist(status, options, title, includeBrowse, includeFavorites, globalSearch, container).done(function(selectedNodes) {
          deferred.resolve({
            me: me,
            from: from,
            nodes: selectedNodes.nodes,
            status: status
          });
        }).fail(function() {
          deferred.reject();
        });
      }).fail(function(error) {
        deferred.reject(utils.parseAjaxErrorAsString(error));
      });
      return deferred.promise();
    },
    _displayContentAssist: function(status, options, title, includeBrowse, includeFavorites, globalSearch, container) {
      var deferred = $.Deferred();
      require([ "d2/dialogs/target.browse/target.browse" ], function(NodePicker) {
        var pickerOptions = {
          dialogTitle: title,
          connector: status.originatingView.collection.connector,
          container: container,
          initialContainer: container,
          context: status.context,
          selectMultiple: true,
          includeBrowse: includeBrowse,
          globalSearch: globalSearch,
          includeFavorites: includeFavorites
        };
        pickerOptions.connector.context = pickerOptions.context;
        pickerOptions.storeContainer = true;
        pickerOptions.restoreContainer = true;
        pickerOptions.dataId = constants.StorageKey.ADD_TO_D2_COLLECTIONS_COMMAND + constants.StorageKey.ANCESTOR_INFO;
        if (!pickerOptions.dialogTitle || pickerOptions.dialogTitle.length === 0) {
          pickerOptions.dialogTitle = ctrLang.addContent;
        }
        pickerOptions.startLocations = [];
        if (pickerOptions.includeBrowse) {
          pickerOptions.startLocations.push("current.location");
        }
        if (pickerOptions.includeFavorites) {
          pickerOptions.startLocations.push("favorites");
        }
        if (utils.isMobile()) {
          pickerOptions.defaultBrowseSubHeader = "target-browse";
          pickerOptions.closeOnSelection = false;
        }
        var nodePicker = new NodePicker(pickerOptions);
        nodePicker.show().done(function(selectedNodes) {
          deferred.resolve(selectedNodes);
        }).fail(function() {
          deferred.reject();
        });
        if (utils.isMobile()) {
          options._targetbrowsePromise = $.Deferred();
          options._targetbrowsePromise.always(nodePicker.close.bind(nodePicker));
        }
      });
      return deferred.promise();
    }
  });
});