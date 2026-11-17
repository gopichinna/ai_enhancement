/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/side.panel/side.panel.view", "nuc/models/node/node.model", "csui/models/version", "csui/utils/contexts/factories/connector", "nuc/utils/base", "d2/utils/constants", "dctmw/utils/authenticators/session", "d2/widgets/miniviewer/node.preview.view", "css!d2/dialogs/document.preview/impl/document.preview" ], function(_, $, Backbone, Marionette, SidePanelView, NodeModel, VersionModel, ConnectorFactory, base, constants, session, NodePreviewView) {
  "use strict";
  var previewModel = null, instance = null, HIGHLIGHT_CLASS_NAME = "csui-doc-preview-state";
  var PreviewModel = NodeModel.extend({
    constructor: function(attributes, options) {
      NodeModel.prototype.constructor.call(this, attributes, options);
      var originalIsFetchable = this.isFetchable;
      this.isFetchable = function() {
        if (constants.Types.RENDITION === this.get("type")) {
          return false;
        } else {
          return originalIsFetchable.apply(this, arguments);
        }
      };
    },
    _fetchAutomatically: function() {
      if (this.isFetchable()) {
        NodeModel.prototype._fetchAutomatically.apply(this, arguments);
      } else {
        this.fetched = true;
        this.trigger("sync");
      }
    }
  });
  var previewNodes = new Backbone.Collection();
  var DocPreviewView = SidePanelView.extend({
    className: function() {
      var zuper = DocPreviewView.__super__, className = "d2-doc-preview";
      var clazz = _.isString(zuper.className) ? zuper.className : _.isFunction(zuper.className) ? zuper.className.call(this, this.options) : "";
      className += " " + clazz;
      if (this.options && this.options.className) {
        className += " " + _.result(this.options, "className");
      }
      return className;
    },
    constructor: function DocPreviewView(options) {
      options = options || {};
      this.context = options.context;
      if (this.context && !previewModel) {
        previewModel = DocPreviewView.getPreviewModel(this.context);
      }
      previewModel.fetched = false;
      this.miniviewer = new NodePreviewView({
        context: this.context,
        model: previewModel
      });
      this.miniviewer.layoutState = {};
      _.extend(options, {
        openFrom: "right",
        layout: {
          header: false,
          footer: false,
          mask: false,
          resize: true
        },
        thresholdWidth: 90,
        content: this.miniviewer,
        contentView: this.miniviewer
      });
      SidePanelView.prototype.constructor.call(this, options);
      this.isPreviewShowing = false;
      this.panelShrinkWidth = 0;
      this.listenTo(this, "before:show", function() {
        this.previousFocus = $(document.activeElement);
      }.bind(this)).listenTo(this, "after:show", function() {
        this.isPreviewShowing = true;
        $("body").removeClass("csui-sidepanel-open");
      }.bind(this)).listenTo(this, "before:hide", function() {
        this.isPreviewShowing = false;
        this.previousFocus && this.previousFocus.trigger("focus");
        this._removePreviewHighlight();
      }.bind(this)).listenTo(this, "before:destroy", this._onBeforeDestroy).listenTo(this.miniviewer, "viewer:close", function(e) {
        e && e.preventDefault();
        this.hide();
      }.bind(this)).listenTo(this.context, "sync change:perspective", this.hide).listenTo(this.context, "d2:objects:deleted", function(deletedIds) {
        if (_.contains(deletedIds, previewModel.get("id"))) {
          this.hide();
        }
      }.bind(this)).listenTo(previewModel, "change:id", function() {
        this._removePreviewHighlight();
        if (this.highlightElement instanceof $ || this.highlightElement instanceof Element) {
          $(this.highlightElement).addClass(HIGHLIGHT_CLASS_NAME);
        }
      }).listenTo(previewModel, "update:viewer:markup:count", function(count) {
        this.options.node.set("viewer_markup_count", count);
      }).listenTo(previewNodes, "update:viewer:markup:count", function(count) {
        this.options.nodes.trigger("update:viewer:markup:count", count);
      }).listenTo(session.get(), "end", function() {
        this.hide();
      });
      this.listenTo(this.miniviewer, "overlay:panel:expand", function() {
        var widthInPercent = this.$el.find(".csui-sidepanel-container").width() / window.innerWidth * 100;
        this.panelShrinkWidth = widthInPercent;
        this.$el.find(".csui-sidepanel-container").width("100%");
      }.bind(this));
      this.listenTo(this.miniviewer, "overlay:panel:collapse", function() {
        if (this.panelShrinkWidth && this.panelShrinkWidth > 0) {
          this.$el.find(".csui-sidepanel-container").width(this.panelShrinkWidth + "%");
        } else {
          this.$el.find(".csui-sidepanel-container").width("");
        }
      }.bind(this));
      this._getStepperWizardEventChannel().vent.on("wizard:shown", this.hide, this);
    },
    _removePreviewHighlight: function() {
      $("." + HIGHLIGHT_CLASS_NAME).removeClass(HIGHLIGHT_CLASS_NAME);
    },
    _getStepperWizardEventChannel: function() {
      return Backbone.Wreqr.radio.channel("stepper_wizard");
    },
    _onBeforeDestroy: function() {
      this.miniviewer && this.miniviewer.destroy();
      this._getStepperWizardEventChannel().vent.off(null, null, this);
    },
    doDestroy: function(callback) {
      base.onTransitionEnd(this.$el, function() {
        _.isFunction(callback) && callback.call(this);
      }, this);
      this.$el.removeClass("csui-sidepanel-visible");
    },
    destroy: function() {
      this.hide(function() {
        Marionette.LayoutView.prototype.destroy.call(this);
      }.bind(this));
    }
  }, {
    show: function(options) {
      options = options || {};
      var dfd = $.Deferred(), done = function() {
        if (options.node instanceof NodeModel || options.node instanceof VersionModel) {
          if (previewModel.get("id") === options.node.get("id")) {
            previewModel.unset("id", {
              silent: true
            });
          }
          previewModel.widgetDetails = options.node.collection?.widgetPreference || options.widgetDetails;
          previewModel.set(_.clone(options.node.attributes));
        } else {
          previewModel.clear({
            silent: true
          });
          previewModel.trigger("change:id", previewModel);
        }
        dfd.resolve(previewModel);
      };
      if (!instance || instance.isDestroyed) {
        instance = new DocPreviewView(options);
      } else {
        instance.options.node = options.node;
        instance.options.nodes = options.nodes;
      }
      var hasMiniviewerNodes = instance.miniviewer.previewNodes && instance.miniviewer.previewNodes.length > 1 ? true : false;
      if (options.nodes && !hasMiniviewerNodes || !options.nodes && hasMiniviewerNodes || options.nodes && hasMiniviewerNodes && options.nodes.at(0)["previewType"] !== instance.miniviewer.previewNodes.at(0)["previewType"]) {
        instance.miniviewer.viewer && instance.miniviewer.viewer.trigger("destroy");
      }
      if (options.nodes && options.nodes.length > 1) {
        var firstNode = options.nodes.at(0);
        if (firstNode.previewType === constants.ComparableDocumentPreviewTypes.TEXT_COMPARE || firstNode.previewType === constants.ComparableDocumentPreviewTypes.GRAPHICAL_COMPARE || firstNode.previewType === constants.ComparableDocumentPreviewTypes.MULTI_FILE_VIEW) {
          previewModel.previewType = firstNode.previewType;
        }
        previewNodes.reset(options.nodes.map(function(node) {
          var cloneNode = node.clone();
          cloneNode.previewType = node.previewType;
          return cloneNode;
        }));
      } else {
        previewModel.previewType = "";
        previewNodes.reset();
      }
      instance.miniviewer.previewNodes = previewNodes;
      if (options.highlightElement) {
        instance.highlightElement = options.highlightElement;
      } else {
        delete instance.highlightElement;
      }
      if (instance.isPreviewShowing) {
        done();
      } else {
        instance.once("after:show", done);
        instance.show();
      }
      return dfd.promise();
    },
    isShowing: function() {
      return !!instance && instance.isPreviewShowing;
    },
    hide: function() {
      instance && instance.hide();
    },
    destroy: function() {
      instance && instance.destroy();
    },
    getPreviewModel: function(context) {
      if (!previewModel) {
        previewModel = new PreviewModel(undefined, {
          connector: context.getObject(ConnectorFactory),
          autofetch: true
        });
      }
      return previewModel;
    }
  });
  return DocPreviewView;
});