/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/jquery", "csui/utils/log", "csui/lib/backbone", "csui/lib/marionette", "csui/utils/nodesprites", "csui/utils/url", "csui/controls/node-type.icon/node-type.icon.view.ext", "smart/themes/theming", "i18n!csui/controls/node-type.icon/impl/nls/lang", "hbs!csui/controls/node-type.icon/node-type.icon", "csui/controls/icons.v2", "css!csui/controls/node-type.icon/impl/node-type.icon.view", "csui/lib/jquery.binary.ajax", "csui/lib/handlebars.helpers.xif" ], function(module, _, $, Log, Backbone, Marionette, nodeSpriteCollection, Url, NodeTypeIconViewExtension, theming, lang, template, iconRegistry) {
  "use strict";
  var log = new Log(module.id);
  function startsWith(text, start) {
    return text ? text.lastIndexOf(start, 0) === 0 : false;
  }
  var dummySrc = "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==";
  var config = module.config() || {};
  var excludedShortcutTypes = config.excludedShortcutTypes || [];
  if (!_.isArray(excludedShortcutTypes)) {
    excludedShortcutTypes = Array.prototype.concat.apply([], _.values(excludedShortcutTypes));
  }
  var NodeTypeIconModel = Backbone.Model.extend({
    constructor: function NodeTypeIconModel(attributes, options) {
      options || (options = {});
      this.node = options.node;
      this.options = options;
      this._useIconwithColorSchema = !!options.colorTheme;
      attributes || (attributes = {});
      _.extend(attributes, this._getAttributes());
      NodeTypeIconModel.__super__.constructor.call(this, attributes, options);
      this.listenTo(this.node, "change:id", this._updateModelFromNode).listenTo(this.node, "change:type", this._updateModelFromNode).listenTo(this.node, "change:size", this._updateModelFromNode).listenTo(this.node, "change:image_url", this._updateModelFromNode);
      if (this.node.imageAttribute && this.node.imageAttribute !== "image_url") {
        this.listenTo(this.node, "change:" + this.node.imageAttribute, this._updateModelFromNode);
      }
      if (this?.options?.originatingView?.collection) {
        this.listenTo(this.options.originatingView.collection, "change update", _.bind(function() {
          let coll = this.options.originatingView.collection, nodeSize = 0;
          if (coll.length > 0) {
            if (coll.length > 1 || coll.length === 1 && coll.models[0].get("id")) {
              nodeSize = coll.length;
            }
          }
          this.node.set("size", nodeSize);
        }, this));
      }
    },
    _getAttributes: function() {
      var node = this.node, original = node.original, exactNodeSprite = this.options.nodeSprite || nodeSpriteCollection.findByNode(node) || {}, exactClassName = exactNodeSprite.get("className"), withColorSchemaIconName = exactNodeSprite.get("withColorSchemaIconName"), exactIconName = this._useIconwithColorSchema ? withColorSchemaIconName ? withColorSchemaIconName : exactNodeSprite.get("iconName") : exactNodeSprite.get("iconName"), mainClassName = exactClassName, mainIconName = exactIconName, jatoIcon, displayThumbnail = this.options.displayThumbnailIcon !== false, overlayClassNames = [], overlayIconNames = [];
      var mimeTypeFromNodeSprite;
      if (theming.isJATOTheme() && exactNodeSprite.get("jatoIcon")) {
        jatoIcon = exactNodeSprite.get("jatoIcon");
      }
      if (exactNodeSprite.attributes) {
        mimeTypeFromNodeSprite = exactNodeSprite.get("mimeType");
      }
      var title = this.options.title || mimeTypeFromNodeSprite || node.get("type_name") || node.get("type");
      if (original && original.get("id") && _.indexOf(excludedShortcutTypes, node.get("type")) === -1) {
        var originalNodeSprite = nodeSpriteCollection.findByNode(original) || {};
        mainClassName = originalNodeSprite.get("className");
        withColorSchemaIconName = originalNodeSprite.get("withColorSchemaIconName");
        mainIconName = this._useIconwithColorSchema ? withColorSchemaIconName ? withColorSchemaIconName : originalNodeSprite.get("iconName") : originalNodeSprite.get("iconName");
        const jatoIconFromSprite = originalNodeSprite.get("jatoIcon");
        jatoIcon = theming.isJATOTheme() && jatoIconFromSprite ? jatoIconFromSprite : undefined;
        overlayClassNames.push("csui-icon");
        title = _.str.sformat(lang.shortcutTypeLabel, originalNodeSprite.get("mimeType") || original.get("type_name") || lang.nodeTypeUnknown);
        if (node.get("type") === 2) {
          title = _.str.sformat(lang.generationTypeLabel, originalNodeSprite.get("mimeType") || original.get("type_name") || lang.nodeTypeUnknown);
          overlayClassNames.push("csui-icon csui-icon-generation-overlay");
          overlayIconNames.push("csui_generation-overlay");
        } else if (this._useIconwithColorSchema) {
          overlayClassNames.push("csui-icon csui-icon-shortcut-overlay");
          overlayIconNames.push("csui_colorschema_shortcut-overlay");
        } else {
          overlayClassNames.push("csui-icon csui-icon-shortcut-overlay");
          overlayIconNames.push("csui_shortcut-overlay");
        }
      }
      var attributes = {
        imageUrl: displayThumbnail && makeAbsolute(node.get(node.imageAttribute || "image_url"), node.connector),
        title: title
      };
      if (original?.get("image_url")) {
        const imageUrl = original.get("image_url");
        attributes.imageUrl = displayThumbnail && makeAbsolute(imageUrl, node.connector);
      }
      _.extend(attributes, _.pick(this.options, [ "size", "jatoIconSize" ]));
      if (this._useIconwithColorSchema) {
        _.extend(attributes, _.pick(this.options, "colorTheme"));
      } else {
        _.extend(attributes, _.pick(this.options, "filter"));
      }
      if (this.options.selectable === false) {
        !this.options?.hideUnselectableOverlay && overlayIconNames.push("csui_nonselectable-overlay");
      }
      if (exactIconName) {
        attributes.iconName = exactIconName;
        if (mainIconName) {
          attributes.mainIconName = mainIconName;
        } else {
          attributes.mainClassName = mainClassName;
        }
        if (overlayIconNames.length > 0) {
          attributes.overlayIconNames = overlayIconNames;
        } else {
          attributes.overlayClassNames = overlayClassNames;
        }
      } else {
        attributes.className = exactClassName;
        attributes.mainClassName = mainClassName;
        attributes.overlayClassNames = overlayClassNames;
      }
      if (jatoIcon) {
        attributes.jatoIcon = jatoIcon;
        attributes.jatoIconSize = this.options.jatoIconSize ?? 24;
      }
      return attributes;
    },
    _updateModelFromNode: function() {
      this.clear({
        silent: true
      });
      this.set(this._getAttributes());
    }
  });
  var NodeTypeIconView = Marionette.ItemView.extend({
    tagName: "span",
    attributes: function() {
      var title = this.model.get("title");
      var cssClass = "csui-icon-group";
      var size = this.model.get("size");
      if (size) {
        var sizeClass = iconRegistry.getClassForSize({
          size: size
        });
        cssClass += " " + sizeClass;
      }
      return {
        class: cssClass,
        title: title
      };
    },
    template: template,
    ui: {
      imageElement: ".csui-node-type-image",
      iconElement: ".csui-node-type-icon"
    },
    constructor: function NodeTypeIconView(options) {
      options || (options = {});
      if (!options.model) {
        this.ownModel = true;
        options.model = new NodeTypeIconModel(undefined, options);
      }
      NodeTypeIconView.__super__.constructor.call(this, options);
      if (options.el) {
        $(options.el).attr(_.result(this, "attributes"));
      }
      this.listenTo(this.model, "change", this.render);
    },
    attachElContent: function() {
      var result = Marionette.ItemView.prototype.attachElContent.apply(this, arguments);
      if (this.model.attributes.mainIconName) {
        this.$(".csui-icon-v2__" + this.model.attributes.mainIconName).addClass("csui-node-type-icon");
      }
      return result;
    },
    onRender: function() {
      this._updateTitle();
      var imageElement = this.ui.imageElement;
      if (imageElement.length > 0) {
        var imageUrl = this.model.get("imageUrl");
        if (imageUrl) {
          var absoluteUrl = this.ownModel ? imageUrl : makeAbsolute(imageUrl, this.options.node.connector);
          imageElement.on("load", imageDone.bind(this, absoluteUrl)).on("error", imageDone.bind(this, null));
          if (setImgUrl.call(this, imageElement[0], absoluteUrl, this.options.node.connector)) {
            switchToImage.call(this);
          } else {
            if (this.ui.iconElement.length > 0) {
              switchToIcon.call(this);
            } else {
              imageElement[0].src = dummySrc;
            }
          }
        }
      }
    },
    onDestroy: function() {
      if (this.ownModel) {
        this.model.stopListening();
      }
      if (this.objUrl) {
        URL.revokeObjectURL(this.objUrl);
      }
    },
    _updateTitle: function() {
      var title = this.model.get("title");
      this.$el.attr("title", title);
    }
  });
  function makeAbsolute(imageUrl, connector) {
    if (imageUrl && connector) {
      if (!startsWith(imageUrl, "data:") && !startsWith(imageUrl, "blob:") && !new Url(imageUrl).isAbsolute()) {
        var connectUrl = connector.getConnectionUrl();
        if (startsWith(imageUrl, "/")) {
          return Url.combine(connectUrl.getOrigin(), imageUrl);
        } else {
          return Url.combine(connectUrl.getCgiScript(), imageUrl);
        }
      }
    }
    return imageUrl;
  }
  function needsAjax(absoluteUrl, connector) {
    if (absoluteUrl && connector) {
      if (startsWith(absoluteUrl, "data:") || startsWith(absoluteUrl, "blob:")) {
        return false;
      }
      return NodeTypeIconViewExtension.needsAjax.call(this, absoluteUrl);
    }
  }
  function callAjax(absoluteUrl, connector, callback) {
    connector.makeAjaxCall({
      url: absoluteUrl,
      dataType: "binary",
      connection: connector.connection
    }).always(function(response, statusText, jqxhr) {
      if (jqxhr.status === 200) {
        callback(true, response);
      } else {
        callback(false);
      }
    });
  }
  function imageDone(url) {
    if (this.ui.imageElement.length > 0) {
      var img = this.ui.imageElement[0];
      if (url) {
        switchToImage.call(this, img.src !== dummySrc || url === dummySrc);
      } else {
        switchToIcon.call(this);
      }
    }
  }
  function switchToImage(removeIcon) {
    if (this.ui.imageElement.length > 0) {
      this.ui.imageElement.removeClass("binf-hidden");
      if (removeIcon) {
        this.ui.iconElement.remove();
        this.ui.iconElement = $();
      } else {
        this.ui.iconElement.addClass("binf-hidden");
      }
    }
  }
  function switchToIcon() {
    if (this.ui.iconElement.length > 0) {
      this.ui.iconElement.removeClass("binf-hidden");
      this.ui.imageElement.addClass("binf-hidden");
    }
  }
  function setImgUrl(img, url, connector) {
    $(img).on("error", function() {
      var logurl = img.src.length > 200 ? img.src.substring(0, 200) + "..." : img.src;
      log.error("error loading image: {0}", logurl) && console.log(log.last);
    });
    if (needsAjax.call(this, url, connector)) {
      callAjax(url, connector, (ok, response) => {
        if (ok) {
          this.objUrl && URL.revokeObjectURL(this.objUrl);
          this.objUrl = URL.createObjectURL(response);
          img.src = this.objUrl;
        } else {
          $(img).trigger("error");
        }
      });
    } else {
      img.src = url;
      return {
        url: img.src
      };
    }
  }
  return NodeTypeIconView;
});