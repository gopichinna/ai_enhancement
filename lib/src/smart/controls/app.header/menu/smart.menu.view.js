/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette3", "nuc/lib/backbone", "smart/themes/theming", "hbs!smart/controls/app.header/menu/impl/smart.menu", "hbs!smart/controls/app.header/menu/impl/smart.menu.item", "hbs!smart/controls/app.header/menu/impl/smart.menu.group.item", "i18n!smart/controls/app.header/search/impl/nls/lang" ], function($, _, Marionette, Backbone, theming, template, menuItemTemplate, menuGroupItemTemplate, lang) {
  "use strict";
  var MenuItemView = Marionette.View.extend({
    tagName: function() {
      let tag = this.type === "group" ? "otc-menugroup" : this.type === "divider" ? "otc-menudivider" : "otc-menuitem";
      return tag;
    },
    attributes: function() {
      let attrs = {};
      if (this.type === "group") {
        attrs.name = this.model.get("groupByLabel");
      }
      let signature = this.model.get("signature");
      if (signature?.length > 0 && signature !== "-") {
        this?.options?.placeholderEle?.classList.add("binf-hidden");
        attrs["data-csui-command"] = signature.toLowerCase();
      }
      return attrs;
    },
    getTemplate: function() {
      return this.type === "group" ? menuGroupItemTemplate : menuItemTemplate;
    },
    events: {
      keydown: "_focusShift"
    },
    constructor: function MenuItemView(options = {}) {
      this.type = !!options.model.get("groupBy") ? "group" : options.model.get("signature") === "-" ? "divider" : "item";
      Marionette.View.prototype.constructor.apply(this, arguments);
    },
    onRender: function() {
      this.el.addEventListener("item-click", _.bind(function(event) {
        if (this.type === "group") {
          let ind = parseInt(event.target.getAttribute("data-index"), 10);
          event.model = this.model.attributes.list[ind];
        } else {
          event.model = this.model;
        }
        this.trigger("click:item", event);
      }, this));
    },
    _focusShift: function(e) {
      if (e.keyCode == 9 && this?.options?.parentEle?.nextElementSibling != null) {
        e.preventDefault();
        if (e.shiftKey) {
          this?.options?.parentEle?.focus();
        } else {
          this?.options?.parentEle?.nextElementSibling?.focus();
        }
      }
    },
    templateContext: function() {
      let name = this.model.get("name") ?? this.model.get("groupByLabel") ?? "";
      let messages = {
        name: name
      };
      if (this.type === "group") {
        const DEFAULT_SEQUENCE = 99999;
        messages.list = this.model.get("list").sort((item1, item2) => (item1.get("sequence") ?? DEFAULT_SEQUENCE) - (item2.get("sequence") ?? DEFAULT_SEQUENCE));
      }
      return messages;
    }
  });
  var MenuCollectionView = Marionette.CollectionView.extend({
    childView: MenuItemView,
    childViewOptions: function() {
      return {
        collection: this.collection,
        placeholderEle: this?.options?.placeholderEle,
        parentEle: this?.options?.parentEle
      };
    },
    childViewEvents: {
      "click:item": "_clickHandler"
    },
    _clickHandler: function(event) {
      this._processEvent(event);
    },
    _processEvent: function(event) {
      this.trigger("execute:action", event.model);
    },
    constructor: function MenuCollectionView(options = {}) {
      this.options = options;
      this.collection = this.options.collection;
      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
      this.listenTo(this.collection, "reset", this.render);
    }
  });
  let SmartMenuView = Marionette.View.extend({
    tagName: "div",
    template: template,
    templateContext: function() {
      let messages = {
        imgSrc: "",
        initials: "",
        buttonId: this.options.id
      };
      return messages;
    },
    performClickAction: false,
    className: "smart-app-header-wrapper",
    constructor: function SmartMenuView(options = {}) {
      Marionette.View.call(this, options);
      this.otcData = _.extend(this.otcData ?? {}, {
        id: this.id
      });
    },
    _isJATO: function() {
      return theming.isJATOTheme();
    },
    supportedAttributes: [ "image", "initials", "interactive", "icon", "size" ],
    onShow: function() {
      this.leadingView = new this.options.leadingView(this.options);
      this.leadingView.render();
      this.listenTo(this.leadingView, "data:synced", _.bind(function() {
        this.otcData = _.extend(this.otcData, this.leadingView.otcData);
        this.otcData.size = this._isJATO() ? "24" : "42";
        this.supportedAttributes.forEach(attr => {
          let targetEle = this.options.otcEl;
          targetEle.setAttribute(attr, this.otcData[attr] ?? "");
        });
        this.trigger("data:synced");
        if (this.menuCollectionView) {
          if (this.otcData?.collection?.models?.length) {
            this.menuCollection = new Backbone.Collection([ ...this.otcData?.collection?.models ?? [] ]);
            this._updateCollection();
            this.menuCollectionView.collection.reset(this.menuCollection.models);
          }
        } else {
          let menuEle = document.createElement("otc-menu");
          menuEle.setAttribute("id", this.id + "_menu");
          menuEle.setAttribute("buttonid", this.id);
          let menuplaceholderEle = document.createElement("otc-menuplaceholder");
          menuplaceholderEle.setAttribute("errortext", lang.loadingViewErrorText);
          menuplaceholderEle.setAttribute("loadingtext", lang.loadingText);
          $(menuplaceholderEle).appendTo(menuEle);
          $(menuEle).appendTo(this.options.target);
          let ele = menuEle, region = new Marionette.Region({
            el: ele,
            replace: false
          });
          this.menuCollection = new Backbone.Collection([ ...this.otcData?.collection?.models ?? [] ]);
          this._updateCollection();
          this.menuCollectionView = new MenuCollectionView({
            collection: this.menuCollection,
            el: ele,
            placeholderEle: menuplaceholderEle,
            parentEle: this?.options?.menuParentEle
          });
          this.listenTo(this.otcData.collection, "sync reset", this._updateCollection);
          region.show(this.menuCollectionView);
          this.listenTo(this.menuCollectionView, "execute:action", _.bind(function(model) {
            this.leadingView.trigger("execute:action", model);
          }, this));
        }
      }, this));
    },
    _updateCollection: function() {
      let tempModels = this.otcData?.collection?.models ? [ ...this.otcData?.collection?.models ] : [];
      let groups = {};
      const addGroup = (groupByValue, model, isLabel = false) => {
        if (groups[groupByValue] === undefined) {
          groups[groupByValue] = {
            groupBy: "",
            groupByLabel: "",
            list: []
          };
        }
        if (isLabel) {
          groups[groupByValue]["groupByLabel"] = model.get("name");
          groups[groupByValue]["groupBy"] = groupByValue;
        } else {
          if (model.get("signature")?.length) {
            model.attributes.signatureData = model.attributes.signature.toLowerCase();
          }
          groups[groupByValue]["list"].push(model);
        }
      };
      tempModels.forEach(model => {
        let isLabel = model.get("isLabel") ?? false, groupByValue = model.get("groupBy");
        if (groupByValue) {
          addGroup(groupByValue, model, isLabel);
        }
      });
      let groupKeys = Object.keys(groups);
      if (groupKeys.length) {
        let count = 0;
        let filteredModels = [];
        let filledKeys = [];
        let models = [ ...this.otcData.collection.models ];
        models.forEach(model => {
          let groupBy = model.get("groupBy");
          if (groupBy?.length) {
            let isLabel = model.get("isLabel") ?? false;
            if (!isLabel && filledKeys.indexOf(groupBy) === -1) {
              let tempModel = new Backbone.Model(groups[groupBy]);
              let tempDividerModel1 = new Backbone.Model({
                signature: "-"
              });
              let tempDividerModel2 = new Backbone.Model({
                signature: "-"
              });
              filteredModels.push(tempDividerModel1);
              filteredModels.push(tempModel);
              filteredModels.push(tempDividerModel2);
              filledKeys.push(groupBy);
            } else {}
          } else {
            filteredModels.push(model);
          }
        });
        filteredModels = filteredModels.filter((model, index) => {
          let allow = true;
          if (index > 0 && model.get("signature") === "-" && filteredModels[index - 1].get("signature") === "-") {
            allow = false;
          }
          return allow;
        });
        this.menuCollection.reset(filteredModels);
      }
    }
  });
  return SmartMenuView;
});