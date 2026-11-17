/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/models/node/node.model", "smart/controls/node.picker/impl/select.view/impl/inlineform/smart.inline.form.view", "hbs!smart/controls/node.picker/impl/select.view/impl/addable.types/impl/addable.types", "hbs!smart/controls/node.picker/impl/select.view/impl/addable.types/impl/addable.type.item", "hbs!smart/controls/node.picker/impl/select.view/impl/addable.types/impl/lazy.loading.template", "i18n!smart/controls/node.picker/impl/nls/lang", "smart/themes/theming", "smart/themes/jato.icons/smart.jato.action.icons", "css!smart/controls/node.picker/impl/select.view/impl/inlineform/smart.inline.form" ], function(_, $, Backbone, Marionette, NodeModel, SmartInlineForm, moretemplate, itemViewTemplate, lazyloadingTemplate, lang, theming, jatoIcons) {
  var addableTypeItemView = Marionette.ItemView.extend({
    template: itemViewTemplate,
    tagName: "otc-menugroup",
    templateHelpers: function() {
      return {
        addItemtooltip: lang.addItemTooltip,
        id: _.uniqueId("addable-types"),
        addIconAria: _.str.sformat(lang.addIconAria, this.model.get("type_name"), this.options.title),
        lazyLoading: _.isFunction(this.options?.requestLazyAddableTpes)
      };
    },
    constructor: function addableTypeItemView(options = {}) {
      this.options = options;
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      let self = this;
      this.listenToOnce(this.options.parentView, "destroy", function() {
        self.trigger("destroy");
      });
    }
  });
  var addableTypesDropdownView = Marionette.CompositeView.extend({
    className: "smart-addable-types",
    template: moretemplate,
    childView: addableTypeItemView,
    childViewOptions: function() {
      return {
        options: this.options,
        parentView: this
      };
    },
    childViewContainer: ".smart-addable-types-menu",
    templateHelpers: function() {
      return {
        addItemtooltip: lang.addItemTooltip,
        id: _.uniqueId("addable-types"),
        isJATO: theming.isJATOTheme(),
        jatoActionAddIcon: jatoIcons.actionAdd
      };
    },
    events: {
      "click .smart-toolitem": "_addAddbaleTypeModel",
      "click .smart-toggle": "_onClickAddButton",
      "keydown .smart-toggle": "_handleClickAddButton",
      keyup: "onKeyInView"
    },
    constructor: function addableTypesDropdownView(options = {}) {
      var self = this;
      this.options = options;
      this.collection = options.addableTypeColl;
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
      this.listenTo(this, "append:lazyaddables", _.bind(moreAddables => {
        self._addMoreAddableTypes(moreAddables);
        self.stopLazyLoading();
      }, self));
      this.listenToOnce(this, "destroy", _.bind(function() {
        this.stopListening(this, "append:lazyaddables");
      }, this));
    },
    onRender: function() {
      if (this.options?.addableTypeColl?.length > 1) {
        this.el.querySelector("otc-menu").classList.remove("binf-hidden");
        this.el.querySelector("otc-menu")?.removeEventListener("open", this._handleEventsOnDDOpen.bind(this));
        this.el.querySelector("otc-menu")?.addEventListener("open", this._handleEventsOnDDOpen.bind(this));
      }
    },
    _handleEventsOnDDOpen: function() {
      this.trigger("addtoolbar:shown", this);
    },
    onKeyInView: function(event) {
      if (event.keyCode === 27) {
        if (this.menuOpen) {
          event.preventDefault();
          this.menuOpen = false;
          return false;
        } else {
          return true;
        }
      }
    },
    _onClickAddButton: function() {
      if (this.options.addableTypeColl.length === 1) {
        this.$el.find("otc-menu .smart-toolitem")[0].click();
      } else {
        this.menuOpen = true;
        this.el.querySelector("otc-menu").classList.remove("binf-hidden");
      }
    },
    _handleClickAddButton: function(event) {
      if (event?.keyCode === 13) {
        this._onClickAddButton();
      }
    },
    cancelExistingForms: function() {
      var inlineForms = this.options?.listViewCollection?.filter(function(model) {
        return !!model.inlineFormView;
      });
      this.options.listViewCollection.remove(inlineForms);
    },
    _getAddableType: function(type_name) {
      var index = this.options?.addableTypeColl?.findIndex(i => i.get("type_name")?.trim() === type_name?.replace(/\n/g, "").trim());
      return this.options?.addableTypeColl?.models[index]?.get("type");
    },
    _getAddableTypeName: function(event) {
      if (this.options?.addableTypeColl?.length > 1) {
        return event.target.innerText;
      }
      return this.options?.addableTypeColl?.models[0]?.get("type_name");
    },
    _hasCustomInlineForm: function(type_name) {
      let index = this.options?.addableTypeColl?.findIndex(i => i.get("type_name")?.trim() === type_name?.replace(/\n/g, "").trim());
      return this.options?.addableTypeColl?.models[index]?.get("hasinlineform");
    },
    _getNewNodeModel: function(addableTypeInfo) {
      if (this.options && this.options?.addableTypeColl === undefined) {
        throw new Error("Missing options.addableType");
      }
      let newNode, addableTypeName = addableTypeInfo.type_name, addableType = addableTypeInfo.type;
      newNode = new NodeModel({
        type: addableType,
        type_name: addableTypeName,
        container: true,
        name: ""
      }, {
        connector: this.options.container.connector,
        collection: this.options.collection
      });
      return newNode;
    },
    _addAddbaleTypeModel: function(event) {
      let newNode;
      this.cancelExistingForms();
      const getDisplayFormObj = {
        type: this._getAddableType(this._getAddableTypeName(event)),
        type_name: this._getAddableTypeName(event),
        parent_id: this.options.container.get("id"),
        container: this.options.container,
        collection: this.options.listViewCollection
      };
      if (this._hasCustomInlineForm(getDisplayFormObj.type_name)) {
        const getDisplayFormPromise = new Promise(_.bind(resolve => {
          resolve(this.options?.showCustomInlineForm(getDisplayFormObj));
        }, this));
        getDisplayFormPromise.then(newNode => {
          this._bindEventListeners(newNode);
        });
      } else {
        newNode = this._getNewNodeModel(getDisplayFormObj);
        newNode.set("parent_id", this.options.container.get("id"));
        newNode.isLocallyCreated = true;
        newNode.inlineFormView = SmartInlineForm;
        this.options.listViewCollection.add(newNode, {
          at: 0
        });
        this._bindEventListeners(newNode);
      }
    },
    _bindEventListeners: function(newNode) {
      this.listenTo(newNode, "save:form", function() {
        this.options?.masterView?.trigger("save:form", newNode);
      });
      this.listenTo(newNode, "cancel:edit:form", function() {
        this.cancelExistingForms();
      });
      this.listenTo(newNode, "destroy:form", function() {
        if (this.options?.masterView?.isKeyEvent) {
          this.el?.querySelector(".smart-add-toolbar")?.focus();
        }
      });
      let self = this;
      this.listenToOnce(this, "destroy", function() {
        self.stopListening(newNode, "save:form cancel:edit:form destroy:form");
      });
    },
    _addMoreAddableTypes: function(moreAddables) {
      var self = this;
      _.each(moreAddables.models, function(addableItem) {
        self.options?.addableTypeColl?.models.push(addableItem);
      });
      self.options?.addableTypeColl?.reset(self.options?.addableTypeColl?.models);
    },
    startLazyLoading: function() {
      this.$el.find("otc-menu").append(lazyloadingTemplate);
    },
    stopLazyLoading: function() {
      var blockingEle = this.el.querySelector(".csui-loading-parent-wrapper");
      blockingEle?.remove();
    }
  });
  return addableTypesDropdownView;
});