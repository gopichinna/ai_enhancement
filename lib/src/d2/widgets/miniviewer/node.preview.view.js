/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "csui/dialogs/modal.alert/modal.alert", "nuc/models/nodes", "csui/utils/commandhelper", "csui/utils/contexts/factories/node", "d2/commands/open", "d2/dialogs/document.preview/document.preview.plugins", "d2/widgets/miniviewer/impl/empty.view", "i18n!d2/widgets/miniviewer/impl/nls/lang", "hbs!d2/widgets/miniviewer/impl/node.preview", "css!d2/widgets/miniviewer/impl/node.preview" ], function(require, _, $, Backbone, Marionette, LayoutViewEventsPropagationMixin, Alert, NodeCollection, CommandHelper, NodeModelFactory, CommandOpen, docPreviewPlugins, EmptyView, lang, template) {
  "use strict";
  var NodePreviewView = Marionette.LayoutView.extend({
    className: "d2-node-preview-container",
    template: template,
    regions: {
      rgnViewer: ".d2-node-preview",
      rgnAltPresentation: ".d2-node-preview-alternative"
    },
    constructor: function NodePreviewView(options) {
      options = options || {};
      this.context = options.context;
      this.cmdOpen = new CommandOpen();
      Marionette.LayoutView.prototype.constructor.call(this, options);
      this.propagateEventsToRegions();
      this.listenTo(this.model, "error", this._onViewerError).listenTo(this.model, "sync", this._renderViewer);
      this.listenTo(this, "panel:expand", function() {
        this.viewer.trigger("panel:expand");
      });
      this.listenTo(this, "panel:collapse", function() {
        this.viewer.trigger("panel:collapse");
      });
    },
    initialize: function(options) {
      this.model = options.model || this.context.getModel(NodeModelFactory);
      this.nodes = options.nodes;
    },
    _onViewerError: function(err) {
      if (this.isLoadingViewer) {
        this.isLoadingViewer = false;
      }
      this._showNoPreview();
      err && Alert.showError(err);
    },
    onRender: function() {
      this._renderViewer();
    },
    _renderViewer: function() {
      if (!this.model.fetched) {
        return;
      }
      var node = this.model, plugin = docPreviewPlugins.findAtLeastOneByNode(this.model, {
        openInNewTab: false
      });
      if (plugin) {
        if (_.isFunction(plugin.ViewerClass)) {
          this._openViewer(node, plugin);
        } else if (_.isString(plugin.ViewerClassPath) && !_.isEmpty(plugin.ViewerClassPath)) {
          require([ plugin.ViewerClassPath ], function(ViewerClass) {
            plugin.ViewerClass = ViewerClass;
            this._openViewer(node, plugin);
          }.bind(this), this._showNoPreview.bind(this));
        } else {
          this._showNoPreview();
        }
      } else {
        this._showNoPreview();
      }
    },
    _openViewer: function(node, plugin) {
      this.$el.removeClass("suppress-viewer");
      if (!this.viewer) {
        this.isLoadingViewer = true;
        this.viewer = new plugin.ViewerClass(_.defaults({
          model: node,
          isPreviewMode: true,
          previewNodes: this.previewNodes
        }, this.options, plugin.viewerOptions));
        this.viewer.stopListening(this.viewer.model, "change sync");
        this.listenTo(this.viewer, "viewer:init", this._onViewerInit).listenTo(this.viewer, "viewer:error", this._onViewerError).listenTo(this.viewer, "viewer:expand", function(e) {
          this.trigger("viewer:expand", e);
          this._onViewerExpand(e);
        }.bind(this)).listenTo(this.viewer, "viewer:collapse", function(e) {
          this.trigger("viewer:collapse", e);
        }.bind(this)).listenTo(this.viewer, "viewer:close", function(e) {
          this.trigger("viewer:close", e);
        }.bind(this)).listenTo(this.viewer, "overlay:panel:expand", function(e) {
          this.trigger("overlay:panel:expand", e);
        }.bind(this)).listenTo(this.viewer, "overlay:panel:collapse", function(e) {
          this.trigger("overlay:panel:collapse", e);
        }.bind(this)).listenToOnce(this.viewer, "destroy", this._onViewerDestroy);
        this.trigger("viewer:create");
        this.rgnViewer.show(this.viewer);
      } else {
        if (this.isLoadingViewer === true || this.viewer.__proto__.constructor !== plugin.ViewerClass || !_.isFunction(this.viewer.reloadViewer)) {
          if (_.isFunction(this.viewer.closeViewer)) {
            this.viewer.closeViewer().done(function(node, plugin) {
              this._openViewer(node, plugin);
            }.bind(this, node, plugin));
          } else {
            this.viewer.destroy();
            this._openViewer(node, plugin);
          }
        } else {
          this.isLoadingViewer = true;
          this.viewer.reloadViewer();
        }
      }
    },
    _showNoPreview: function() {
      if (!this.emptyView) {
        this.emptyView = new EmptyView({
          iconClass: "no-preview",
          message: lang.noPreview
        });
        this.listenTo(this.emptyView, "viewer:close", function(e) {
          this.trigger("viewer:close", e);
        }.bind(this));
      }
      this.$el.addClass("suppress-viewer");
      this._activateAlternateView(this.emptyView);
    },
    _activateAlternateView: function(view) {
      if (view && this.rgnAltPresentation.currentView !== view) {
        this.rgnAltPresentation.empty({
          preventDestroy: true
        });
        this.rgnAltPresentation.show(view, {
          render: !view.isRendered
        });
      }
    },
    _onViewerInit: function() {
      this.isLoadingViewer = false;
    },
    _onViewerExpand: function(e, showCollapseButton) {
      if (!e || !e.isDefaultPrevented()) {
        this.model.skipPreview = true;
        var cmdStatus = {
          context: this.context,
          nodes: new NodeCollection([ this.model ]),
          suppressSuccessMessage: true,
          suppressFailMessage: true
        };
        CommandHelper.handleExecutionResults(this.cmdOpen.execute(cmdStatus, {
          viewerOptions: {
            showCollapseButton: _.isBoolean(showCollapseButton) ? showCollapseButton : true
          },
          skipDefaultActionCheck: true
        }), {
          command: this.cmdOpen,
          suppressSuccessMessage: cmdStatus.suppressSuccessMessage,
          suppressFailMessage: cmdStatus.suppressFailMessage
        }).always(function() {
          this.model.skipPreview = false;
        }.bind(this));
      }
    },
    _onViewerDestroy: function() {
      this.isLoadingViewer = false;
      this._showNoPreview();
      this.viewer && this.stopListening(this.viewer);
      delete this.viewer;
    },
    onBeforeDestroy: function() {
      this.emptyView && this.emptyView.destroy();
      this.viewer && this.viewer.destroy();
    }
  });
  _.extend(NodePreviewView.prototype, LayoutViewEventsPropagationMixin);
  return NodePreviewView;
});