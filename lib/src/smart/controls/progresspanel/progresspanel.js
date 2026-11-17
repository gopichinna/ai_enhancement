/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/utils/messagehelper", "smart/controls/progresspanel/progresspanel.view.ext", "smart/utils/accessibility", "smart/controls/progresspanel/progresspanel.wrapper.view", "smart/controls/progresspanel/loaderpanel/loaderpanel.view", "smart/controls/progresspanel/progressbar.maximize/progressbar.maximize.view", "smart/controls/icons.v2/icons.v2", "smart/lib/binf/js/binf" ], function(module, _, $, Backbone, Marionette, MessageHelper, ProgressPanelView, Accessibility, ProgressPanelWrapperView, LoaderPanelView, ProgressbarMinimizeView) {
  "use strict";
  var config = module.config();
  _.defaults(config, {
    enablePermanentHeaderMessages: false
  });
  if (Accessibility.isAccessibleMode()) {
    config.enablePermanentHeaderMessages = true;
  }
  var messageHelper = new MessageHelper(), globals = {}, hasDefaultRegion, getPanelFromStack, sameActionPanel;
  var progressPanel = {
    setProgresspanelMessageRegionView: function(messageRegionView, options) {
      this._cleanupPreviousMessageRegion();
      options = _.defaults({}, options, {
        useClass: true,
        sizeToParentContainer: true
      });
      options.enableMinimiseButtonOnProgressPanel && (globals.enableMinimiseButtonOnProgressPanel = options.enableMinimiseButtonOnProgressPanel);
      globals.miniProgressBarClass = options.miniProgressBarClass;
      globals.miniProgressBarTarget = options.miniProgressBarTarget;
      options.classes && (globals.classNames = options.classes);
      globals.relatedView = options.useClass ? undefined : messageRegionView;
      globals.sizeToParentContainer = options.sizeToParentContainer;
      globals.messageRegionView = messageRegionView;
      if (globals.messageRegionView && globals.fileUploadCollection && globals.progressPanel) {
        globals.progressPanel = this._makeProgressPanel();
        options.progressPanel = globals.progressPanel;
      }
    },
    _createMiniProgressBar: function(options) {
      if (!globals.miniProgressBar) {
        var el = $("<div>").addClass(globals.miniProgressBarClass + " " + "binf-hidden"), region = new Marionette.Region({
          el: el
        }), minimisedProgrssBarview = new ProgressbarMinimizeView({
          parentView: options.parentView,
          miniProgressBarClass: globals.miniProgressBarClass && globals.miniProgressBarClass.split(" ")[0]
        });
        globals.miniProgressBarTarget && el.appendTo(globals.miniProgressBarTarget);
        globals.miniProgressBar = minimisedProgrssBarview;
        region.show(minimisedProgrssBarview);
      }
    },
    setFileUploadCollection: function(fileUploadCollection) {
      globals.fileUploadCollection = fileUploadCollection;
      if (globals.progressPanel) {
        if (globals.fileUploadCollection) {
          globals.progressPanel = this._makeProgressPanel();
        } else {
          this.hideFileUploadProgress();
        }
      }
    },
    reset: function() {
      this.hideFileUploadProgress();
      this.emptyStackPanels();
      this._cleanupPreviousMessageRegion();
    },
    hideFileUploadProgress: function() {
      if (globals.progressPanel) {
        globals.progressPanel.closePanel = true;
        globals.progressPanel.doClose();
        globals.progressPanel = globals.wrapperView?.stackProgressPanels[globals.wrapperView?.stackProgressPanels.length - 1];
        globals.overallProgress = globals.progressPanel?.computeOverAllProgress()?.percentage || 0;
      }
    },
    emptyStackPanels: function() {
      if (globals.wrapperView) {
        globals.wrapperView.stackProgressPanels.length = 0;
      }
      globals?.progressPanelContainer?.remove();
      globals?.panelWrapper?.remove();
      getPanelFromStack = undefined;
      sameActionPanel = undefined;
      globals.overallProgress = 0;
      globals.progressPanel = undefined;
    },
    _addEventHandlers: function(view) {
      var resizeHandler = function() {
        messageHelper.resizePanel(view, globals.relatedView);
      };
      $(window).on("resize", resizeHandler);
      view.listenTo(globals.messageRegionView, "resize", resizeHandler);
      view.once("before:destroy", function() {
        $(window).off("resize", resizeHandler);
        view.stopListening(globals.messageRegionView, "resize", resizeHandler);
      });
    },
    showFileUploadProgress: function(fileUploadCollection, options) {
      console.warn("this method has been deprecated! please use showProgressPanel.");
      this.showProgressPanel(fileUploadCollection, options);
    },
    showProgressPanel: function(fileUploadCollection, options) {
      if (fileUploadCollection) {
        if (!globals.fileUploadCollection) {
          globals.fileUploadCollection = fileUploadCollection;
        }
        getPanelFromStack = undefined;
        if (globals?.wrapperView?.stackProgressPanels?.length) {
          getPanelFromStack = globals?.wrapperView?.stackProgressPanels.filter(progressPanel => {
            return progressPanel.options.actionType === options.actionType && !progressPanel.isProgressCompleted();
          });
        }
        sameActionPanel = undefined;
        if (getPanelFromStack?.length) {
          sameActionPanel = getPanelFromStack[getPanelFromStack.length - 1];
          globals.fileUploadCollection = sameActionPanel.collection;
          sameActionPanel.collection.add(fileUploadCollection.models);
        } else {
          globals.fileUploadCollection = fileUploadCollection;
        }
        if (!sameActionPanel) {
          globals.progressPanel = this._makeProgressPanel(_.extend(options, {
            enableMinimiseButton: globals.enableMinimiseButtonOnProgressPanel,
            enablePermanentHeaderMessages: options?.configOptions?.enablePermanentHeaderMessages ? options.configOptions.enablePermanentHeaderMessages : config.enablePermanentHeaderMessages
          }));
          globals.wrapperView?.stackProgressPanels.push(globals.progressPanel);
          if (globals.enableMinimiseButtonOnProgressPanel) {
            options.parentView = globals.messageRegionView;
            this._createMiniProgressBar(options);
          }
          globals.progressPanel.doShow(globals.relativeView, globals.messageRegionView);
        }
      }
    },
    isActionInProgress: function(actionType, message, title) {},
    showPermissionApplyingProgress: function(permissionAppliedCollection, options) {
      if (permissionAppliedCollection) {
        globals.permissionAppliedCollection = permissionAppliedCollection;
        globals.progressPanel = this.__makePermissionProgressPanel(options);
      }
      if (!globals.progressPanel && permissionAppliedCollection) {
        globals.progressPanel = this._makeProgressPanel(options);
      }
      if (globals.progressPanel.state === "rejected" && globals.progressPanel.collection.models[0].attributes.commandName === "ViewPermission") {
        globals.progressPanel.$el.addClass("csui-no-error-message-panel");
      }
      if (globals.progressPanel) {
        globals.progressPanel.doShow(globals.relativeView, globals.messageRegionView);
      }
    },
    showLoader: function(xhr, options) {
      this.hideFileUploadProgress();
      if (!globals.loaderPanel) {
        globals.loaderPanel = this._makeLoaderPanel(_.extend({
          xhr: xhr
        }, options));
      } else {
        globals.loaderPanel.doShow(globals.relativeView, globals.messageRegionView, xhr);
      }
      globals.loaderPanel.listenTo(globals.loaderPanel, "destroy", function(args) {
        options.onDestroy && options.onDestroy(args);
        globals.loaderPanel = undefined;
      });
      xhr && xhr.always(function(resp) {
        globals.loaderPanel && globals.loaderPanel.destroy();
        options.onDestroy && options.onDestroy(resp);
        globals.loaderPanel = undefined;
      });
    },
    changeLoaderMessage: function(message, xhr) {
      if (globals.loaderPanel) {
        globals.loaderPanel.$el.find("#csui-loading-stage").text(message);
        globals.loaderPanel.updateXHRReference(xhr);
      }
    },
    _makeProgressPanel: function(options) {
      options || (options = {});
      _.defaults(options, {
        collection: globals.fileUploadCollection,
        sizeToParentContainer: globals.sizeToParentContainer,
        messageHelper: messageHelper
      });
      this._ensureMessageRegion();
      this._ensureProgressPanelWrapper(options);
      globals.wrapperView?._onProcessPending();
      var oldPanel = "";
      var PPView = options && options.ProgressPanelview ? options.ProgressPanelview : ProgressPanelView, progressPanel = messageHelper.activatePanel(messageHelper.createPanel(globals, PPView, {
        ...options,
        stackProgressPanels: globals.wrapperView?.stackProgressPanels
      }, oldPanel), globals.relatedView, globals.progressPanelContainer, oldPanel);
      this._addEventHandlers(progressPanel);
      globals.messageRegionView.trigger("add:progressPanelwrapper:eventhandlers", progressPanel);
      return progressPanel;
    },
    __makePermissionProgressPanel: function(options) {
      options || (options = {});
      _.defaults(options, {
        collection: globals.permissionAppliedCollection,
        sizeToParentContainer: globals.sizeToParentContainer,
        messageHelper: messageHelper
      });
      this._ensureMessageRegion();
      this._ensureProgressPanelWrapper();
      var PPView = options && options.ProgressPanelview ? options.ProgressPanelview : ProgressPanelView, progressPanel = messageHelper.activatePanel(messageHelper.createPanel(globals, PPView, options), globals.relatedView, globals.progressPanelContainer);
      this._addEventHandlers(progressPanel);
      return progressPanel;
    },
    _ensureProgressPanelWrapper: function(options) {
      if (globals.progressPanelContainer && document.querySelectorAll(".smart-progresspanel-wrapper").length) {
        return;
      }
      let messageRegionContainer = globals.messageRegionView.$el;
      options.messageRegionView = globals.messageRegionView;
      var progressPanelWrapperView = new ProgressPanelWrapperView(options);
      progressPanelWrapperView.render();
      progressPanelWrapperView.$el.appendTo(messageRegionContainer);
      globals.progressPanelContainer = progressPanelWrapperView.progressPanelContainer;
      globals.wrapperView = progressPanelWrapperView;
    },
    _ensureMessageRegion: function() {
      if (globals.messageRegionView) {
        return;
      }
      var modalContainer = $.fn.binf_modal.getDefaultContainer(), messageContainer = $("<div>", {
        class: "csui-message-container"
      }, {
        style: "position:absolute; top: 0; left: 0; width: 0; height: 100vh;"
      }).appendTo(modalContainer);
      globals.messageRegionView = new Backbone.View({
        el: messageContainer
      });
      hasDefaultRegion = true;
    },
    _cleanupPreviousMessageRegion: function() {
      if (hasDefaultRegion) {
        globals.messageRegionView.remove();
        hasDefaultRegion = false;
      }
      globals.progressPanel?.destroy();
      globals.wrapperView?.destroy();
      globals = {};
    },
    _makeLoaderPanel: function(options) {
      options || (options = {});
      _.defaults(options, {
        sizeToParentContainer: globals.sizeToParentContainer,
        messageHelper: messageHelper
      });
      this._ensureMessageRegion();
      var loaderPanel = messageHelper.activatePanel(messageHelper.createPanel(globals, LoaderPanelView, options, globals.progressPanel), globals.relatedView, globals.messageRegionView, globals.progressPanel);
      this._addEventHandlers(loaderPanel);
      return loaderPanel;
    },
    _getAllFocusableElements: function() {
      return globals.wrapperView?._getAllFocusableElements() || [];
    }
  };
  return progressPanel;
});