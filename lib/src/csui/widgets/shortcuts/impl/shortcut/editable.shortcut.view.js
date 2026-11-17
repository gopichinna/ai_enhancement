/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/lib/marionette", "csui/widgets/shortcuts/impl/shortcut/shortcut.view", "csui/models/widget/widget.model", "csui/utils/base", "csui/utils/perspective/perspective.util", "i18n!csui/widgets/shortcuts/impl/nls/lang", "i18n!csui/widgets/shortcuts/impl/nls/shortcuts.manifest", "json!csui/widgets/shortcuts/impl/shortcut/shortcut.manifest.json", "hbs!csui/widgets/shortcuts/impl/shortcut/impl/add.shortcut.icon", "csui/controls/node-type.icon/node-type.icon.view", "smart/themes/theming", "csui/themes/csui.jato.mime.illustrations" ], function(require, _, $, Backbone, Marionette, MiniShortcutView, WidgetModel, base, PerspectiveUtil, lang, manifestLang, shortcutManifest, addShortcutTemplate, NodeTypeIconView, theming, jatoIllustrations) {
  "use strict";
  shortcutManifest = WidgetModel.resolveLocalizedManifest("shortcut.manifest", shortcutManifest, manifestLang);
  var EditableMiniShortcutView = MiniShortcutView.extend({
    constructor: function EditableMiniShortcutView(options) {
      options || (options = {});
      options.model = options.model || new Backbone.Model();
      this._injectConfigurationBehaviour(options);
      if (options.container.options.data.___pman_isdropped && options.collection.getShortcuts().length === 0) {
        options.model.set("___pman_opencallout", true, {
          silent: true
        });
      }
      if (options.context && options.context.perspective) {
        options.type = options.context.perspective.type;
      }
      MiniShortcutView.prototype.constructor.apply(this, arguments);
      this._registerEventHandlers();
    },
    tagName: "div",
    modelEvents: _.defaults({
      "refresh:mask": "onRefreshMask"
    }, _.result(MiniShortcutView.prototype, "modelEvents")),
    onRefreshMask: function() {
      var configOptions = this._getDefaultWidgetConfig();
      this.trigger("refresh:mask", configOptions);
    },
    popoverOpened: function() {
      this.el?.classList?.add("csui-add-shortcut-widget-selected");
    },
    popoverClosed: function() {
      this.el?.closest(".cs-perspective")?.querySelectorAll(".csui-add-shortcut-widget-selected")?.forEach(element => element?.classList?.remove("csui-add-shortcut-widget-selected"));
    },
    attachElContent: function(html) {
      var flyoutConfig = this.$el.find(".csui-configure-perspective-widget .pman-widget-popover");
      if (flyoutConfig.length) {
        this.$el.children().not(".csui-configure-perspective-widget").remove();
        this.$el.prepend($(html));
      } else {
        this.$el.html(html);
      }
      return true;
    },
    _getDefaultWidgetConfig: function(options) {
      options || (options = this.options);
      var shortcutItemsInGroup = lang.groupAria + " ";
      options.collection.getShortcuts().forEach(function(shortcut, index) {
        if (index > 0) {
          shortcutItemsInGroup += ", ";
        }
        shortcutItemsInGroup += shortcut.get("displayName") || shortcut.get("node").get("name");
      });
      var configOptions = {
        allowReplace: false,
        notifyUpdatesImmediatly: true,
        useEnterToConfigure: this._isNewPlaceholder(options),
        ItemsInGroupAriaLabel: shortcutItemsInGroup
      };
      if (options.collection.getShortcuts().length > 1) {
        configOptions = _.extend(configOptions, {
          removeConfirmTitle: lang.removeShortcut,
          removeConfirmMsg: lang.removeShortcutCnfrmMsg,
          confirmOnRemove: false
        });
      }
      return configOptions;
    },
    _injectConfigurationBehaviour: function(options) {
      var configOptions = this._getDefaultWidgetConfig(options);
      let manifest;
      let hasSysAdminRights = !!options.context._user?.get("privilege_system_admin_rights");
      if (options.perspectiveMode === "personalize" || !hasSysAdminRights) {
        manifest = structuredClone(shortcutManifest);
        delete manifest.options.fields["customBackgroundColor"];
        delete manifest.options.fields["customBackgroundImage"];
        delete manifest.schema.properties["customBackgroundColor"];
        delete manifest.schema.properties["customBackgroundImage"];
      } else {
        manifest = shortcutManifest;
      }
      this.behaviors = _.defaults({
        PerspectiveWidgetConfig: _.extend({
          behaviorClass: require("csui/perspective.manage/behaviours/pman.widget.config.behaviour"),
          widgetConfig: function() {
            return {
              options: options.model.attributes
            };
          },
          manifest: manifest
        }, configOptions)
      }, this.behaviors);
    },
    isShortcutValid: function(options) {
      var isValid = true;
      if (this.collection.getShortcuts().length === 0 && this.options.perspectiveMode === "edit") {
        isValid = this.isOptionsValid(options);
      }
      return isValid;
    },
    validateConfiguration: function(options) {
      var isValid = this.isShortcutValid(options);
      var action = !isValid ? "addClass" : "removeClass";
      this.$el.find(".tile-group")[action]("binf-hidden");
      this.$el[action]("csui-pman-shortcut-error");
      return isValid;
    },
    isOptionsValid: function(options) {
      return !!options.id || !!options.type;
    },
    _updateShortcut: function(args) {
      if (this.isShortcutValid(args.options)) {
        this.$el.find(".csui-configure-perspective-widget").removeClass("binf-perspective-has-error");
      }
    },
    _registerEventHandlers: function() {
      this.listenTo(this, "delete:widget", function() {
        delete this.options.container.options.data.___pman_opencallout;
        this._notifyPerspectiveChanges();
      });
      this.listenTo(this, "update:widget:options", this._updateShortcut);
      this.listenTo(this, "replace:widget", this._notifyPerspectiveChanges);
      this.listenTo(this, "show:popover", this.popoverOpened);
      this.listenTo(this, "hide:popover", this.popoverClosed);
      this.listenTo(this.options.context, "perspective:save:success", () => this.notified = false);
    },
    _updateElement: function() {
      if (theming.isJATOTheme()) {
        if (!this?.node?.get("name")) {
          this.iconView = new Marionette.ItemView({
            el: this.$el.find(".csui-shortcut-jato-icon"),
            className: "csui-add-shortcut-jato",
            template: addShortcutTemplate,
            templateHelpers: function() {
              return {
                addShortcutJatoIcon: jatoIllustrations.illustrationsDragDropSmall
              };
            },
            constructor: function AddShortcutIcon() {
              Marionette.ItemView.prototype.constructor.apply(this, arguments);
            }
          });
        } else {
          this.iconView = new NodeTypeIconView({
            el: this.$el.find(".csui-shortcut-jato-icon"),
            node: this.node,
            title: this.node.attributes.name,
            jatoIconSize: 56
          });
        }
        this.iconView.render();
      } else {
        if (this.model.get("node")?.get("image_url")) {
          this._generateImageUrlFromBWSNode();
        }
      }
      this.$el.attr("class", _.result(this, "className"));
    },
    _notifyPerspectiveChanges: function() {
      PerspectiveUtil.notifyPerspectiveChanges.call(this);
    },
    _ensureNode: function() {
      if (!this._isNewPlaceholder()) {
        MiniShortcutView.prototype._ensureNode.apply(this, arguments);
      } else {
        this.node = new Backbone.Model();
      }
    },
    _ensureNodeFetched: function() {
      if (!this._isNewPlaceholder()) {
        this.isUpdating = true;
        MiniShortcutView.prototype._ensureNodeFetched.apply(this, arguments);
        delete this.isUpdating;
      }
    },
    _updateNodeState: function() {
      if (!this._isNewPlaceholder()) {
        MiniShortcutView.prototype._updateErrorState.apply(this, arguments);
      }
    },
    getName: function() {
      if (!this._isNewPlaceholder()) {
        return MiniShortcutView.prototype.getName.apply(this, arguments);
      } else {
        return lang.addShortcut;
      }
    },
    onRender: function() {
      MiniShortcutView.prototype.onRender.apply(this, arguments);
      if (this._isNewPlaceholder()) {
        this.$el.addClass("csui-pman-shortcut-new");
      }
      this.$el.addClass("csui-pman-editable-widget");
      if (!this.$el.find(".binf-popover").length) {
        base.clearFocusables(this.$el);
      }
    },
    onDomRefresh: function() {
      var wrapperBtn = this.$el.find(".wrapper-button");
      if (!this.$el.find(".binf-popover").length) {
        base.clearFocusables(this.$el);
      }
      if (this._isNewPlaceholder()) {
        wrapperBtn.attr("aria-label", lang.addShortcutToGroupAria);
      } else {
        var shortcutName = this.model.get("displayName") || this.model.get("node").get("name");
        wrapperBtn.attr("aria-label", _.str.sformat(lang.accessShortcutActionsAria, shortcutName));
        this.$el.find(".icon-edit").attr("aria-label", _.str.sformat(lang.shortcutSettingsAria, shortcutName));
        this.$el.find(".clear-icon").attr("aria-label", _.str.sformat(lang.removeShortcutItemAria, shortcutName));
      }
    },
    onClicked: function(event) {
      event.preventDefault();
      if (!this.$el.find(".pman-widget-popover").has(event.target).length) {
        event.stopPropagation();
      }
    },
    _isNewPlaceholder: function(options) {
      return (options || this.options).model.isAddShortcut();
    },
    focus: function() {
      this.$el.find(".csui-configure-perspective-widget .wrapper-button").trigger("focus");
    }
  });
  return EditableMiniShortcutView;
});