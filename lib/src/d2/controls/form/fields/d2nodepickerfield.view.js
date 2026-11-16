/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/models/node/node.model", "csui/utils/contexts/factories/node", "csui/controls/form/fields/base/csformfield.view", "nuc/utils/url", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "csui/controls/form/pub.sub", "csui/dialogs/file.open/file.open.dialog", "dctmw/utils/authenticators/session", "csui/utils/commandhelper", "d2/utils/constants", "d2/utils/node.utils", "d2/utils/content.assist", "d2/controls/form/impl/d2nodepicker/d2nodepickerselection.view", "i18n!d2/controls/form/impl/nls/lang", "i18n!d2/server.adaptors/models/impl/nls/lang", "hbs!d2/controls/form/impl/d2nodepicker/d2nodepickerfield", "css!d2/controls/form/impl/d2nodepicker/d2nodepickerfield" ], function(_, $, Backbone, Marionette, NodeModel, NodeModelFactory, FormFieldView, Url, RestResources, RestLinkrels, PubSub, FileOpenDialog, Session, CommandHelper, constants, nodeUtils, ContentAssist, D2NodePickerSelectionView, lang, langAdaptor, template) {
  "use strict";
  var D2NodePickerFieldView = FormFieldView.extend({
    constructor: function D2NodePickerFieldView(options) {
      FormFieldView.prototype.constructor.apply(this, arguments);
      this.originatingView = options.originatingView || {};
      var context = this.options?.context || Session.get().getContext();
      this.connector = context.getObject("connector");
      this.node = null;
      this.stopListening(this.model);
      this.listenTo(this.model, "change", this._raiseValueChanged);
      this.container = new NodeModel(undefined, {
        connector: this.connector,
        autofetch: true
      });
      this.multiSelect = this.alpacaField && this.alpacaField.options && !!this.alpacaField.options.multiSelect;
      this.retriveFullPath = this.alpacaField && this.alpacaField.options && !!this.alpacaField.options.retriveFullPath;
      if (this.multiSelect) {
        var preSelectedNodes = this.model.get("data") || [];
        if (preSelectedNodes && preSelectedNodes.length > 0 && preSelectedNodes[preSelectedNodes.length - 1].parent) {
          this.container.set(preSelectedNodes[preSelectedNodes.length - 1].parent.attributes);
        }
        this.nodes = new Backbone.Collection(preSelectedNodes);
        this.nodes.length && this.setValue(this.getMultiValueForNodes(), false);
        this.nodes.on("update", this.onNodeCollectionUpdate.bind(this));
      } else {
        var id = this.model.get("data");
        this.curVal = id;
        if (id) {
          if (this.alpacaField && this.alpacaField.options && this.alpacaField.options.objectId && this.alpacaField.options.objectName) {
            this.node = new NodeModel({
              id: this.alpacaField.options.objectId,
              name: this.alpacaField.options.objectName
            }, {
              connector: this.connector,
              autofetch: true
            });
          } else {
            var attrs = {
              id: id
            };
            var sharedNode = context.getModel(NodeModelFactory, {
              attributes: attrs,
              temporary: true
            });
            this.node = new NodeModel(undefined, {
              connector: this.connector,
              autofetch: true
            });
            this.listenToOnce(this.node, "sync", function() {
              if (this.originatingView._container === id) {
                this.container.set(this.node.attributes, {
                  silent: true
                });
              }
              this._renderNode();
            }.bind(this)).listenToOnce(this.node, "error", this._renderNode);
            if (this.originatingView && _.isFunction(this.originatingView.blockActions)) {
              this.originatingView.blockActions();
            }
            this.node.set(sharedNode.attributes);
          }
        }
        if (this.originatingView._container && this.originatingView._container !== id) {
          var _attrs = {
            id: this.originatingView._container
          };
          var _sharedNode = context.getModel(NodeModelFactory, {
            attributes: _attrs,
            temporary: true
          });
          this.container.set(_sharedNode.attributes);
        }
      }
      var dataModel = this.multiSelect && this.model.get("data") ? this.nodes.at(this.nodes.length - 1) : this.model, pathIdsString = dataModel.get("pathIds") || "", pathIdsArray = pathIdsString.split("/"), parentPathId = pathIdsArray.length > 2 ? pathIdsArray[pathIdsArray.length - 2] : parentPathId;
      if (parentPathId) {
        this.container.set({
          id: parentPathId
        });
      }
      this.originatingView._data = this.originatingView._data || {};
    },
    className: "cs-formfield d2-nodepicker-field",
    template: template,
    ui: {
      writeArea: ".cs-field-write",
      writeField: ".cs-field-write input",
      readArea: ".cs-field-read",
      readField: ".cs-field-read button",
      fileopen: ".icon-browse",
      clear: ".icon-clear",
      multiSelection: ".multi-node-selection",
      showMore: '.d2-list-toolbar [data-d2-list-toolbar-action="showMore"]',
      showLess: '.d2-list-toolbar [data-d2-list-toolbar-action="showLess"]',
      multipleSelectedReadonlyList: ".cs-field-read .multiple-selected-list"
    },
    events: {
      "keypress @ui.fileopen": "onKeyPressRead",
      "keypress @ui.clear": "onKeyPressRead",
      "keydown @ui.fileopen": "onKeydownFileOpen",
      "click @ui.fileopen": "onFileOpenBtnClicked",
      "click @ui.clear": "onFileClearClicked",
      "click @ui.showMore": "_showAllItems",
      "click @ui.showLess": "_showOnlyLimitedItems"
    },
    onKeyPressRead: function(event) {
      if (event.keyCode === 13) {
        event.stopPropagation();
        event.preventDefault();
        if (event.currentTarget.id === "openfilebtn") {
          this.onFileOpenBtnClicked();
        } else if (event.currentTarget.id === "clearfilebtn") {
          this.onFileClearClicked();
        }
      }
    },
    onKeydownFileOpen: function(event) {
      if (event.keyCode === 9 && event.shiftKey === false && this.multiSelect === true && this.nodes && this.nodes.length > 0) {
        this.ui.multiSelection.find(".d2-nodes-selectedvalues > li > a").first().trigger("focus");
        event.stopPropagation();
        event.preventDefault();
      }
    },
    onFileClearClicked: function() {
      this.node = null;
      this.setValue(null, true);
      this.render();
      this.ui.writeField.trigger("focus");
    },
    getContentAssistOptions: function(NodePicker, deferred) {
      var me = this;
      ContentAssist.getContentAssistOptions(this.options).done(function(config) {
        if (!_.isEmpty(config)) {
          me.setContentAssistOptions(config.label_value, config.properties.has_browse_assist, config.properties.has_favorites_assist, config.properties.has_search_assist);
        } else {
          me.setContentAssistOptions("", true, false, false);
        }
        me.displayContentAssist(NodePicker, deferred);
      }).fail(function(error) {
        deferred.reject(error);
      });
    },
    setContentAssistOptions: function(title, includeBrowse, includeFavorites, globalSearch) {
      this.options.title = title;
      this.options.includeBrowse = includeBrowse;
      this.options.includeFavorites = includeFavorites;
      this.options.globalSearch = globalSearch;
      if (!this.options.includeBrowse && !this.options.includeFavorites && !this.options.globalSearch) {
        this.options.includeBrowse = true;
      }
    },
    displayContentAssist: function(NodePicker, deferred) {
      var pickerOptions = {
        dialogTitle: this.options.title,
        connector: this.connector,
        container: this.container,
        initialContainer: this.container,
        context: this.options.context,
        selectMultiple: !!this.multiSelect,
        globalSearch: this.options.globalSearch,
        includeBrowse: this.options.includeBrowse,
        includeFavorites: this.options.includeFavorites,
        selectType: this.options.selectType,
        dataId: this.options.dataId,
        restoreContainer: this.options?.alpaca?.options?.restoreContainer,
        storeContainer: this.options?.alpaca?.options?.storeContainer
      };
      if (this.alpacaField && this.alpacaField.options && this.alpacaField.options.subTypeFilters) {
        pickerOptions.subTypeFilters = this.alpacaField.options.subTypeFilters;
      }
      if (!pickerOptions.dialogTitle || pickerOptions.dialogTitle.length === 0) {
        pickerOptions.dialogTitle = lang.addContent;
      }
      if (this.multiSelect === true) {
        var selectedValues = this.nodes.pluck("id");
        if (selectedValues && selectedValues.length > 0) {
          pickerOptions.disabledNodeIds = selectedValues;
          pickerOptions.disabledSelectionState = true;
        }
      }
      pickerOptions.startLocations = [];
      if (pickerOptions.includeBrowse) {
        pickerOptions.startLocations.push("current.location");
      }
      if (pickerOptions.includeFavorites) {
        pickerOptions.startLocations.push("favorites");
      }
      if (this.options && this.options.alpacaField && this.options.alpacaField.options && this.options.alpacaField.options.nodeSelectWidgetName && this.options.alpacaField.options.includeWorkflowTemplates) {
        pickerOptions.startLocations = [];
        pickerOptions.globalSearch = false;
        pickerOptions.includeBrowse = false;
        pickerOptions.includeFavorites = false;
        pickerOptions.includeWorkflowTemplates = true;
        pickerOptions.widgetName = this.options.alpacaField.options.nodeSelectWidgetName;
      }
      if (this.options && this.options.alpacaField && this.options.alpacaField.options && this.options.alpacaField.options.subTypeFilters) {
        pickerOptions.subTypeFilters = this.options.alpacaField.options.subTypeFilters;
      }
      if (this.options && this.options.alpacaField && this.options.alpacaField.options && this.options.alpacaField.options.container) {
        pickerOptions.container = this.options.alpacaField.options.container;
        pickerOptions.initialContainer = this.options.alpacaField.options.container;
      }
      this.nodePicker = new NodePicker(pickerOptions);
      var me = this;
      this.nodePicker.show().done(function(selectedNodes) {
        deferred.resolve(selectedNodes.nodes);
        if (me.multiSelect === true) {
          var selectedObjectIds = me.nodes.pluck("id"), addedNodes = [], ancestorsPath = me.getAncestorsPathData(selectedNodes.ancestors);
          _.each(selectedNodes.nodes, function(node) {
            if (!_.contains(selectedObjectIds, node.get("id"))) {
              var nodeId = node.get("id"), clonedNode = node.clone(), parentPathIds = ancestorsPath && ancestorsPath.idPaths || clonedNode.parent && clonedNode.parent.get("idPath"), parentPathNames = ancestorsPath && ancestorsPath.namePaths || clonedNode.parent && clonedNode.parent.get("namePath"), pathIds, pathNames;
              if (nodeId.indexOf("0c") === 0) {
                pathIds = "/" + node.get("id");
                pathNames = "/" + node.get("name");
              } else if (parentPathIds && parentPathNames) {
                if (parentPathIds.indexOf("/") !== 0) {
                  parentPathIds = "/" + parentPathIds;
                }
                if (parentPathNames.indexOf("/") !== 0) {
                  parentPathNames = "/" + parentPathNames;
                }
                pathIds = parentPathIds + "/" + node.get("id");
                pathNames = parentPathNames + "/" + node.get("name");
              }
              if (pathIds && pathNames) {
                clonedNode.set("pathIds", pathIds);
                clonedNode.set("pathNames", pathNames);
              }
              me.originatingView._data[nodeId] = clonedNode;
              addedNodes.push(clonedNode);
            }
          });
          me.nodes.add(addedNodes);
          var value = me.getMultiValueForNodes();
          me.setValue(value, false);
        } else {
          me.node = selectedNodes.nodes[0];
          if (me.originatingView) {
            me.originatingView._data[me.node.get("id")] = me.node;
          }
          me.setValue(me.node.get("id"), false);
          me.render();
          me.ui.writeField.trigger("focus");
        }
      }).fail(function() {
        if (me.multiSelect === true) {
          me.setFocusOnMultiSelectChange();
        } else {
          me.ui.fileopen.trigger("focus");
        }
        deferred.reject(arguments);
      });
    },
    getMultiValueForNodes: function() {
      var me = this, value = "";
      if (this.nodes && this.nodes.length > 0) {
        if (this.retriveFullPath === true) {
          value = me.nodes.map(function(node) {
            if (node.has("pathIds")) {
              return node.get("pathIds");
            } else {
              return node.get("id");
            }
          });
        } else {
          value = me.nodes.pluck("id");
        }
      }
      return value;
    },
    getAncestorsPathData: function(ancestors) {
      if (ancestors && ancestors.length > 0) {
        var parentIdPaths = [], parentNamePaths = [];
        ancestors.each(function(ancestor) {
          if (ancestor.get("id") !== "repository") {
            parentIdPaths.push(ancestor.get("id"));
            parentNamePaths.push(ancestor.get("name"));
          }
        });
        return {
          idPaths: parentIdPaths.join("/"),
          namePaths: parentNamePaths.join("/")
        };
      }
    },
    setFocusOnMultiSelectChange: function() {
      if (this.nodes && this.nodes.length > 0) {
        this.ui.multiSelection.find(".d2-nodes-selectedvalues li").first().find("a").trigger("focus");
      } else {
        this.ui.fileopen.trigger("focus");
      }
    },
    getPlaceholderForInput: function() {
      var placeHolder = lang.selectFieldEmptyFieldLabel;
      if (this.multiSelect === true) {
        if (this.alpacaField && this.alpacaField.options && this.alpacaField.options.emptyPlaceHolder && this.nodes.length === 0) {
          placeHolder = this.alpacaField.options.emptyPlaceHolder;
        }
      }
      return placeHolder;
    },
    onNodeCollectionUpdate: function() {
      var value = this.getMultiValueForNodes();
      this.setValue(value, true);
      this.checkNodeCollectionLength();
      this.setFocusOnMultiSelectChange();
    },
    checkNodeCollectionLength: function() {
      var placeHolder = this.getPlaceholderForInput();
      if (this.nodes.length > 0) {
        this.ui.multiSelection.removeClass("binf-hidden");
      } else {
        this.ui.multiSelection.addClass("binf-hidden");
      }
      this.ui.writeField.attr("placeholder", placeHolder);
    },
    onShow: function() {
      if (this.multiSelect === true) {
        this.ui.writeField.attr("disabled", "disabled");
      }
    },
    onRender: function() {
      if (this.multiSelect === true) {
        if (!this.nodePickerSelectionView) {
          this.$el.addClass("d2-nodepicker-multi-select");
          this.nodeLocationMap = {};
          if (this.alpacaField && this.alpacaField.schema && this.alpacaField.schema.disabled === true) {
            this.nodes.disabled = true;
          }
          this.nodePickerSelectionView = new D2NodePickerSelectionView({
            collection: this.nodes,
            nodeLocationMap: this.nodeLocationMap,
            mode: this.mode
          });
          var nodePickerSelectionViewEl = this.nodePickerSelectionView.render().el;
          this.ui.multiSelection.html(nodePickerSelectionViewEl);
          this.ui.writeField.attr("readonly", true);
        }
        this.checkNodeCollectionLength();
        this.model.get("data") && this.ui.readField.addClass("binf-hidden");
        if (this.mode === "readonly") {
          this._checkReadonlyListLimit();
        }
      } else {
        this.ui.multiSelection.addClass("binf-hidden");
      }
    },
    onFileOpenBtnClicked: function() {
      var me = this, deferred = $.Deferred();
      if (this.options.isFileOpenDialog) {
        var fileOpenDialog = new FileOpenDialog({
          multiple: false
        });
        fileOpenDialog.listenTo(fileOpenDialog, "add:files", function(files) {
          var filename = files[0].name, baseName = filename.substring(0, filename.lastIndexOf("."));
          me.node = new NodeModel({
            name: baseName
          }, {
            connector: me.connector,
            autofetch: true
          });
          me.setValue(files[0], false);
          me.render();
          fileOpenDialog.destroy();
        });
        fileOpenDialog.show();
      } else {
        require([ "d2/dialogs/target.browse/target.browse" ], function(NodePicker) {
          me.getContentAssistOptions(NodePicker, deferred);
        }, function(error) {
          deferred.reject(error);
        });
      }
      return deferred.promise();
    },
    setValue: function(value, validate, silent) {
      var bIsValid = true;
      if (this.alpacaField) {
        bIsValid = this.alpacaField.setValueAndValidate(value, validate);
      }
      if (bIsValid) {
        this.$el.removeClass("cs-formfield-invalid");
        if (value !== this.curVal) {
          this.curVal = value;
        }
        this.model.set("data", value, {
          silent: !!silent
        });
        this.$el.trigger($.Event("field:valid"), this);
      } else {
        this.$el.addClass("cs-formfield-invalid");
        var event = $.Event("field:invalid");
        this.$el.trigger(event);
      }
      return bIsValid;
    },
    _raiseValueChanged: function() {
      var data = {
        fieldvalue: this.getValue(),
        fieldid: this.options.dataId,
        fieldpath: this.options.path,
        targetfieldpath: this.options.path
      };
      this.trigger("field:changed", data);
      PubSub.trigger(this.options.dataId + "dependentattrchanged", this);
      var event = $.Event("field:changed");
      _.extend(event, data);
      this.$el.trigger(event);
    },
    getValue: function() {
      if (this.multiSelect === true) {
        return this.getMultiValueForNodes();
      } else {
        return this.node && this.node.get("id") || null;
      }
    },
    getEditValue: function() {
      return this.getValue();
    },
    allowEditOnEnter: function() {
      return false;
    },
    allowEditOnClickReadArea: function() {
      return false;
    },
    templateHelpers: function() {
      var nodeName = "";
      if (this.multiSelect) {
        var modelOptions = this.model.get("options");
        modelOptions.placeholder = this.getPlaceholderForInput();
      } else {
        if (this.node) {
          nodeName = this.node.get("name") || this.node.get("id");
        }
        var config = nodeUtils.getSpecialNodeConfig(this.node);
        if (config && !config.treeEnabled && config.homeCabinetEnabled && this.node && this.node.get("id") === nodeUtils.getHomeCabinetId()) {
          nodeName = langAdaptor.homeCabinetNodeName;
        }
      }
      var object = _.extend(FormFieldView.prototype.templateHelpers.apply(this), {
        data: nodeName,
        clearTitle: lang.clear,
        browseTitle: this.alpacaField && this.alpacaField.options && this.alpacaField.options.browseTooltip || lang.browse,
        placeholder: lang.selectFieldEmptyFieldLabel,
        hasData: !_.isNull(this.node),
        enabled: !this.alpacaField.schema.disabled,
        labelledBy: this.options.labelId ? this.options.labelId : "",
        multipleSelectObjects: this.multiSelect ? this.nodes.pluck("name") : [],
        showMoreLabel: lang.showMore,
        showLessLabel: lang.showLess
      });
      return object;
    },
    enableDisableField: function() {
      this.ui.writeField.attr("readonly", true);
    },
    _renderNode: function() {
      this.render();
      if (this.originatingView && _.isFunction(this.originatingView.unblockActions)) {
        this.originatingView.unblockActions();
      }
    },
    _checkReadonlyListLimit: function() {
      if (this.nodes && this.nodes.length > 5) {
        this._showOnlyLimitedItems();
      }
    },
    _showOnlyLimitedItems: function() {
      this.ui.showLess.addClass("binf-hidden");
      this.ui.showMore.removeClass("binf-hidden");
      this.ui.multipleSelectedReadonlyList.find("li").eq(4).nextAll().addClass("binf-hidden");
    },
    _showAllItems: function() {
      this.ui.showLess.removeClass("binf-hidden");
      this.ui.showMore.addClass("binf-hidden");
      this.ui.multipleSelectedReadonlyList.find("li").eq(4).nextAll().removeClass("binf-hidden");
    }
  });
  return D2NodePickerFieldView;
});