/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/utils/base", "csui/models/node/node.model", "csui/controls/table/inlineforms/base/views/textfield/textfield.view", "csui/utils/commands", "csui/models/nodeancestors", "csui/utils/defaultactionitems", "i18n!csui/controls/table/inlineforms/base/impl/nls/lang", "hbs!csui/controls/table/inlineforms/base/views/nodepicker/impl/inlineform.nodepicker.field", "css!csui/controls/table/inlineforms/base/views/nodepicker/impl/inlineform.nodepicker.field" ], function(_, $, base, NodeModel, TextFieldView, commands, NodeAncestorCollection, defaultActionItems, lang, basetemplate) {
  var InlineNodePickerFieldView = TextFieldView.extend({
    template: basetemplate,
    templateContext: function() {
      var data = {
        id: this.parentView.model.get("classificationId"),
        anchorTitleShort: this.parentView.model.get("anchorTitleShort"),
        anchorTitle: this.parentView.model.get("anchorTitle"),
        namePlaceholder: this.model.get("namePlaceholder"),
        prefix: this.fieldName,
        isRequired: this.model.get("required"),
        browseIconAriaLabelTooltip: `${lang.browseIconAriaLabel} ${this.fieldName ? this.fieldName : ""}`,
        clearIconAriaLabelTooltip: `${lang.clearIconAriaLabel} ${this.fieldName ? this.fieldName : ""}`
      };
      return data;
    },
    constructor: function InlineNodePickerFieldView(options) {
      options = options || {};
      options.connector = options.parentView && options.parentView.model && options.parentView.model.connector;
      TextFieldView.prototype.constructor.apply(this, arguments);
      this.node = new NodeModel(undefined, {
        connector: this.connector,
        autofetch: true,
        commands: defaultActionItems.getAllCommandSignatures(commands)
      });
      this.ancestors = new NodeAncestorCollection(undefined, {
        node: this.node,
        autofetch: true
      });
      this.listenTo(this.node, "sync", this._renderNode).listenTo(this.node, "error", this._renderError);
      this.listenTo(this.ancestors, "sync", this._renderNode).listenTo(this.ancestors, "error", this._renderError);
      this._isReadyToSave = true;
    },
    ui: function() {
      return _.extend({}, TextFieldView.prototype.ui, {
        browseIcon: ".icon-cs-browse",
        clearIcon: ".formfield_clear",
        writeArea: ".cs-inline-nodepicker"
      });
    },
    events: function() {
      return _.extend({}, TextFieldView.prototype.events, {
        "click @ui.browseIcon": "_showNodePicker",
        "click @ui.writeArea": "_showNodePicker",
        "click @ui.clearIcon": "onClickClearIcon",
        "keydown @ui.browseIcon": "onKeyDownBrowseIcon"
      });
    },
    onKeyDownBrowseIcon: function(event) {
      if (event.keyCode === 13 || event.keyCode === 32) {
        this._showNodePicker(event);
      }
    },
    _showNodePicker: function(event) {
      if (!this._isReadyToSave) {
        return;
      }
      this._isReadyToSave = false;
      this._getNodePicker(event).then(_.bind(function(nodePicker) {
        nodePicker.show().done(_.bind(function(args) {
          var newNode = args.nodes[0], newId = newNode.get("id");
          this.node = newNode;
          this.pickerArgs = args;
          this.editVal = newId;
          this.mapNodeIdToFieldValue(newId).then(_.bind(function(data) {
            this.updateFieldModel(newId);
            this._renderNode();
            this.ui.writeArea.addClass("csui-inline-nodepicker-hasvalue");
            if (this.editVal && !this.model.get("required")) {
              this.ui.clearIcon.trigger("focus");
            } else {
              this.ui.browseIcon.trigger("focus");
            }
            this.options.parentView.trigger("enable:save:btn");
          }, this));
        }, this)).fail(_.bind(function() {}, this)).always(_.bind(function() {
          if (this.editVal && !this.model.get("required")) {
            this.ui.clearIcon.trigger("focus");
          } else {
            this.ui.browseIcon.trigger("focus");
          }
          this._isReadyToSave = true;
        }, this));
      }, this));
    },
    _getNodePicker: function(event) {
      var deferred = $.Deferred(), self = this;
      require([ "csui/dialogs/node.picker/node.picker" ], function(NodePicker) {
        var parameters = self.model.get("parameters"), dialogTitle = parameters.dialogTitle || self.fieldName || "", nodePickerOptions = {
          connector: self.connector,
          dialogTitle: _.str.sformat(dialogTitle.toLowerCase()),
          selectableTypes: parameters.select_types || "",
          unselectableTypes: parameters.nonselect_types || "",
          globalSearch: false,
          context: self.options.context,
          initialContainer: {
            id: parameters.initial_container || ""
          },
          unselectableNodes: parameters.unselectable_nodes || "",
          startLocation: parameters.start_location || "",
          startLocations: parameters.start_locations || "",
          resolveShortcuts: true,
          resultOriginalNode: true,
          isKeyEvent: event?.type === "keydown" ?? false
        };
        _.extend(nodePickerOptions, parameters);
        var nodePicker = new NodePicker(nodePickerOptions);
        deferred.resolve(nodePicker);
      }, function(error) {
        deferred.reject(error);
      });
      return deferred.promise();
    },
    mapNodeIdToFieldValue: function(nodeId) {
      return $.Deferred().resolve(nodeId).promise();
    },
    updateFieldModel: function(newValue) {
      this.model.set({
        validField: true,
        value: newValue,
        id: this.editVal
      });
      this.parentView.model.set({
        classificationId: newValue
      }, {
        silent: true
      });
      return true;
    },
    onClickClearIcon: function(event) {
      if (event.type === "keydown" && (event.keyCode === 13 || event.keyCode === 32) || event.type === "click") {
        this.ui.writeArea.removeClass("csui-inline-nodepicker-hasvalue");
        this.editVal = "";
        this.model.set({
          validField: false,
          value: "",
          id: this.editVal
        });
        this._isReadyToSave = true;
        this.node = new NodeModel(undefined, {
          connector: this.connector,
          autofetch: true,
          commands: defaultActionItems.getAllCommandSignatures(commands)
        });
        this._renderNode();
        this.ui.browseIcon.trigger("focus");
      }
    },
    _renderNode: function() {
      var anchorTitle = this.ancestors.pluck("name").join(" > ");
      var anchorShortTitle = this._prepareFieldText();
      this.parentView.model.set({
        anchorTitle: anchorTitle,
        anchorTitleShort: anchorShortTitle
      }, {
        silent: true
      });
      this._renderField(anchorTitle, anchorShortTitle);
    },
    _renderError: function() {
      this._renderField(lang.originalNodeUnavailableTooltip, lang.originalNodeUnavailable);
    },
    _renderField: function(title, shortTitle) {
      var buttonDisabled, disabledClass;
      this.model.attributes.options = {};
      _.extend(this.model.attributes.options, {
        buttonDisabled: buttonDisabled,
        disabledClass: disabledClass,
        anchorTitle: title,
        anchorTitleShort: shortTitle
      });
      this.render();
    },
    _prepareFieldText: function() {
      var path = this.node.get("name");
      return path;
    },
    onInputValueChanged: function(event) {
      this._isReadyToSave = true;
    },
    isReadyToSave: function() {
      this.model?.get("id") ? "" : this.parentView.model?.get("classificationId") ? this.model?.set("id", this.parentView.model?.get("classificationId")) : "";
      let isValidInput = this.model?.get("required") ? this.model?.get("required") && !!this.model?.get("id") : true;
      return !!isValidInput;
    }
  });
  return InlineNodePickerFieldView;
});