/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/lib/marionette", "csui/utils/base", "csui/behaviors/default.action/default.action.behavior", "csui/behaviors/item.error/item.error.behavior", "csui/utils/url", "csui/utils/contexts/factories/node", "csui/utils/defaultactionitems", "csui/utils/commands", "csui/utils/node.links/node.links", "hbs!csui/widgets/shortcuts/impl/shortcut/impl/small.shortcut", "hbs!csui/widgets/shortcuts/impl/shortcut/impl/medium.shortcut", "hbs!csui/widgets/shortcuts/impl/shortcut/impl/large.shortcut", "i18n!csui/widgets/shortcuts/impl/nls/lang", "csui/utils/high.contrast/detector!", "csui/controls/mixins/shortcuts.view/shortcuts.view.mixin", "csui/utils/contexts/factories/connector", "csui/controls/node-type.icon/node-type.icon.item.view.mixin", "smart/themes/theming", "csui/controls/node-type.icon/node-type.icon.view", "csui/themes/csui.jato.mime.icons", "css!csui/widgets/shortcuts/impl/shortcut/impl/shortcut", "css!csui/widgets/shortcuts/impl/shortcut/impl/small.shortcut", "css!csui/widgets/shortcuts/impl/shortcut/impl/medium.shortcut", "css!csui/widgets/shortcuts/impl/shortcut/impl/large.shortcut" ], function(_, $, Backbone, Marionette, base, DefaultActionBehavior, ItemErrorBehavior, Url, NodeModelFactory, defaultActionItems, commands, nodeLinks, smallShortcutTemplate, mediumShortcutTemplate, largeShortcutTemplate, lang, highContrast, ShortcutsViewMixin, ConnectorFactory, NodeTypeIconItemViewMixin, theming, NodeTypeIconView, jatoIcons) {
  "use strict";
  var ShortcutView = Marionette.ItemView.extend({
    constructor: function MiniShortcutView(options) {
      options || (options = {});
      options.model = options.model || new Backbone.Model();
      options.model.set(_.defaults(options.model.attributes, {
        icon: ShortcutView.DEFAULT_ICON,
        theme: "csui-shortcut-theme-grey-shade1",
        layout: "small",
        id: "",
        displayName: "",
        customBackgroundColor: "",
        customBackgroundImage: ""
      }));
      if (highContrast === 2) {
        options.model.set("icon", ShortcutView.BLACK_FOLDER_ICON);
      }
      Marionette.ItemView.prototype.constructor.call(this, options);
      this.node = this.model.get("node");
      if (!this.node) {
        this._ensureNode();
      }
      this._ensureNodeFetched();
    },
    tagName: "a",
    className: function() {
      var classArr = [], customBackgroundImage = this.model.get("customBackgroundImage"), customBackgroundColor = this.model.get("customBackgroundColor");
      classArr.push("csui-shortcut-item");
      classArr.push("csui-acc-focusable");
      classArr.push(this.model.get("theme"));
      classArr.push("csui-" + this.model.get("layout"));
      if (customBackgroundColor || customBackgroundImage) {
        classArr.push("cs-background-custom");
      }
      if (customBackgroundImage) {
        classArr.push("cs-background-image");
      }
      return classArr.join(" ");
    },
    getTemplate: function() {
      switch (this.model.get("layout")) {
       case "small":
        return smallShortcutTemplate;

       case "medium":
        return mediumShortcutTemplate;

       default:
        return largeShortcutTemplate;
      }
    },
    templateHelpers: function() {
      var scName = this.getName();
      return {
        icon: this.model.get("icon") || ShortcutView.DEFAULT_ICON,
        isJATOTheme: theming.isJATOTheme(),
        name: scName
      };
    },
    behaviors: {
      DefaultAction: {
        behaviorClass: DefaultActionBehavior
      },
      ItemError: {
        behaviorClass: ItemErrorBehavior,
        model: function() {
          return this.options.model.get("node");
        },
        errorViewOptions: function() {
          return {
            low: this.model.get("layout") === "small"
          };
        }
      }
    },
    modelEvents: {
      change: "render",
      "change:shortcutTheme": "_onThemeChange",
      "change:customBackgroundColor": "_onCustomBackgroundColorChange",
      "change:customBackgroundImage": "_onCustomBackgroundImageChange",
      "change:id": "_ensureNode",
      "change:type": "_ensureNode"
    },
    events: {
      click: "onClicked",
      keydown: "onKeyInView"
    },
    onRender: function() {
      this._updateElement();
      this._ensureBackgroundImageNodeThenApplyBackground();
      this._updateNodeState();
    },
    onKeyInView: function(event) {
      if (event.keyCode === 32 || event.keyCode === 13) {
        this.trigger("click");
      }
    },
    _generateImageUrlFromBWSNode: function() {
      const layout = this.model.get("layout") || "large";
      const elementForShortCutIcon = this.$el.find(".tile-icon>.icon");
      elementForShortCutIcon.removeClass(highContrast === 2 ? ShortcutView.BLACK_FOLDER_ICON : ShortcutView.DEFAULT_ICON);
      this.renderNodeTypeIconView(this.model.get("node"), elementForShortCutIcon, "", "", {
        size: layout,
        title: this.getName()
      });
      this.model.set("icon", "");
    },
    _updateElement: function() {
      var scName = this.getName();
      if (!!this.node) {
        this.$el.attr("href", nodeLinks.getUrl(this.node));
      }
      if (theming.isJATOTheme()) {
        this.iconView = new NodeTypeIconView({
          el: this.$el.find(".csui-shortcut-jato-icon"),
          node: this.node,
          jatoIconSize: "",
          title: this.node.attributes.name
        });
        this.iconView.render();
      } else {
        if (this.model.get("node")?.get("image_url")) {
          this._generateImageUrlFromBWSNode();
        }
      }
      this.$el.attr("class", _.result(this, "className")).attr("title", this.getName());
      this.$el.attr("aria-label", _.str.sformat(lang.shortcutPrefixAria, scName));
    },
    _onThemeChange: function() {
      this.trigger("change:shortcutTheme");
    },
    _onCustomBackgroundColorChange: function() {
      this.trigger("change:customBackgroundColor");
    },
    _onCustomBackgroundImageChange: function() {
      this.trigger("change:customBackgroundImage");
    },
    _ensureBackgroundImageNodeThenApplyBackground: function() {
      const backgroundImageNodeId = this.model.get("customBackgroundImage");
      if (!backgroundImageNodeId) {
        this.model.set("deploy_url", "");
      }
      if (this.options.perspectiveMode === "edit" && this.isUpdating && backgroundImageNodeId) {
        const self = this;
        const backgroundImageNode = this.createNode4BackgroundImage(backgroundImageNodeId);
        backgroundImageNode.fetch().done(function(node) {
          const {
            deploy_url
          } = node;
          self.model.set("deploy_url", deploy_url);
          self._applyBackgroundStyle(self.model.attributes);
        });
        return;
      }
      this._applyBackgroundStyle(this.model.attributes);
    },
    _applyBackgroundStyle: function({
      deploy_url,
      version_number,
      modify_date,
      customBackgroundColor
    }) {
      const modifiedStamp = encodeURIComponent(modify_date);
      const connector = this.options.context.getObject(ConnectorFactory);
      const url = connector.getConnectionUrl().getOrigin();
      const supportAssetImagePath = deploy_url ? `${url}${deploy_url}?m=${modifiedStamp}&v=${version_number}` : "";
      this.el.style.backgroundImage = `url(${supportAssetImagePath})`;
      this.el.style.backgroundColor = customBackgroundColor || "";
      this.el.style.backgroundBlendMode = customBackgroundColor && supportAssetImagePath ? "soft-light" : "normal";
    },
    onClicked: function(event) {
      if (base.isControlClick(event)) {} else {
        event.preventDefault();
        this.triggerMethod("execute:defaultAction", this.node);
      }
    },
    getName: function() {
      if ((this.model.get("displayName") || "").trim().length > 0) {
        return this.model.get("displayName");
      } else {
        return this.node.fetched ? this.node.get("name") : lang.loadingText;
      }
    },
    _ensureNode: function() {
      this.node = this.options.context.getModel(NodeModelFactory, {
        attributes: {
          id: this.options.model.get("id") || "volume",
          type: this.options.model.get("type") || 141
        }
      });
      ShortcutView.prepareModelToFetch(this.node);
      this.model.set("node", this.node, {
        silent: true
      });
      this.trigger("update:model", this.node);
      this._ensureNodeFetched();
    },
    _ensureNodeFetched: function() {
      this.listenToOnce(this.node, "change", this.render);
      this.node.ensureFetched({
        suppressError: true
      });
    },
    _updateErrorState: function() {
      if (this.node.error) {
        this.$el.addClass("csui-failed");
        this.$el.removeAttr("title");
      } else {
        this.$el.removeClass("csui-failed");
      }
    },
    _updateNodeState: function() {
      if (this.node.fetched && this.defaultActionController.hasAction(this.node)) {
        this.$el.removeClass("csui-disabled");
      } else {
        this.$el.addClass("csui-disabled");
      }
      this._updateErrorState();
    },
    focus: function() {
      this.$el.trigger("focus");
    }
  }, {
    prepareModelToFetch: function(model) {
      model.excludeResources();
      model.resetFields();
      model.setFields({
        properties: [ "container", "id", "name", "original_id", "type", "custom_view_search", "image_url" ],
        "versions.element(0)": [ "mime_type" ]
      });
      model.resetExpand();
      model.setExpand({
        properties: [ "original_id" ]
      });
      model.resetCommands();
      model.setCommands(defaultActionItems.getAllCommandSignatures(commands));
    },
    DEFAULT_ICON: "icon-folder",
    BLACK_FOLDER_ICON: "icon-folder-black"
  });
  _.extend(ShortcutView.prototype, ShortcutsViewMixin);
  NodeTypeIconItemViewMixin.mixin(ShortcutView.prototype);
  return ShortcutView;
});