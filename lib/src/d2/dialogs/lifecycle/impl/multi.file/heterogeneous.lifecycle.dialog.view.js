/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/models/nodes", "csui/controls/progressblocker/blocker", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "d2/controls/multi.item.multi.steps/multi.item.multi.steps.view", "d2/utils/constants", "d2/dialogs/document.esignature.dialog/document.esignature.dialog.view", "d2/dialogs/document.external.esign.dialog/document.external.esign.dialog.view", "i18n!d2/dialogs/lifecycle/impl/nls/lang", "i18n!d2/dialogs/document.external.esign.dialog/impl/nls/lang", "hbs!d2/dialogs/lifecycle/impl/heterogeneous.lifecycle", "css!d2/dialogs/lifecycle/impl/heterogeneous.lifecycle" ], function(_, $, Backbone, Marionette, NodeCollection, BlockingView, LayoutViewEventsPropagationMixin, MultiItemView, constants, DocumentESignatureDialogView, DocumentExternalESignDialogView, lang, documentExternalESignLang, template) {
  "use strict";
  var D2HetrogeneousLifecycleView = Marionette.LayoutView.extend({
    className: "multifile-lifecycle-steps",
    template: template,
    constructor: function D2HetrogeneousLifecycleView(options) {
      this.context = options.context;
      this.wizard = options.wizard;
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.propagateEventsToRegions();
      this.listenTo(this, "multi.item:change", this.onMultiStepChange);
      this.listenTo(this, "multi.item:submit", this.onSubmit);
      if (this.wizard) {
        BlockingView.delegate(this, this.wizard);
      } else {
        BlockingView.imbue(this);
      }
      this.enableReorder = false;
    },
    regions: {
      multiFileLifecycleStepsRegion: ".multifile-lifecycle"
    },
    onStepBeforeActive: function() {
      if (this.multiItemView) {
        this.multiItemView.updateAllItemState(constants.ItemStates.NOT_VISITED);
        this.multiItemView.showFirstItem();
      }
    },
    onRender: function() {
      var me = this, collection = new NodeCollection(me.options.status.nodes.models);
      collection.each(function(node) {
        node.set("itemState", constants.ItemStates.NOT_VISITED);
      });
      var options = _.extend({
        itemDetailsViewSteps: this.options.wizard.options.multiSteps,
        parent: this,
        modelKey: "node",
        enableReorder: this.enableReorder,
        collection: collection,
        itemOptions: {
          parent: this,
          wizard: this.wizard
        }
      }, me.options);
      this.multiItemView = new MultiItemView(options);
      this.multiFileLifecycleStepsRegion.show(this.multiItemView);
      this.multiItemView.showFirstItem();
    },
    nextItem: function() {
      var index = this.multiItemView && this.multiItemView.getIndexValue();
      var steps = this.options.wizard.options.multiSteps;
      var selectedModel = this.multiItemView && this.multiItemView.getSelectedModel();
      if (selectedModel && index >= 0 && _.isUndefined(steps[selectedModel.get("id")][index + 1])) {
        this.multiItemView.updateNodeStatus(this.multiItemView.currentItemDetailsView.getItemModel && this.multiItemView.currentItemDetailsView.getItemModel(), constants.ItemStates.VALIDATED);
        this.multiItemView.options.parent.trigger("multi.item:validation", true);
      }
      this.multiItemView.nextItem();
    },
    invalidatedItem: function() {
      var index = this.multiItemView && this.multiItemView.getIndexValue();
      var steps = this.options.wizard.options.multiSteps;
      var selectedModel = this.multiItemView && this.multiItemView.getSelectedModel();
      if (selectedModel && index >= 0 && _.isUndefined(steps[selectedModel.get("id")][index + 1])) {
        this.multiItemView.updateNodeStatus(this.multiItemView.currentItemDetailsView.getItemModel(), constants.ItemStates.NOT_VALIDATED);
        this.multiItemView.options.parent.trigger("multi.item:validation", false);
      }
    },
    previousStep: function() {
      this.multiItemView.previousStep();
    },
    next: function() {
      if (this.multiItemView.validateSelectedItem() && this.validateAllItems()) {
        this.wizard.nextStep();
      }
    },
    onSubmit: function() {
      if (this.multiItemView.checkItemStatus()) {
        this.wizard.nextStep();
      }
    },
    getTitle: function() {
      if (this.multiItemView && (this.multiItemView.currentItemDetailsView instanceof DocumentESignatureDialogView || this.multiItemView.currentItemDetailsView instanceof DocumentExternalESignDialogView)) {
        return this.multiItemView.currentItemDetailsView.options.node && this.multiItemView.currentItemDetailsView.options.node.lifeCycleStateConfig && this.multiItemView.currentItemDetailsView.options.node.lifeCycleStateConfig["menu-label"] ? _.str.sformat(lang.D2HeterogeneousLifecycleESignTitle, this.multiItemView.currentItemDetailsView.options.node.lifeCycleStateConfig["menu-label"]) : lang.D2LifecycleESignTitle;
      } else {
        return this.multiItemView && this.multiItemView.currentItemDetailsView && this.multiItemView.currentItemDetailsView.getTitle && this.multiItemView.currentItemDetailsView.getTitle();
      }
    },
    getSubTitle: function() {
      var index = this.multiItemView ? this.multiItemView.getModelIndex() : 0;
      var me = this;
      if (this.multiItemView && this.multiItemView.currentItemDetailsView && this.multiItemView.currentItemDetailsView instanceof DocumentExternalESignDialogView) {
        return _.str.sformat(documentExternalESignLang.DocumentESignEachDocumentSubtitle, index + 1, me.options.status.nodes.models.length);
      }
      return _.str.sformat(lang.filePositionMessage, index + 1, me.options.status.nodes.models.length);
    },
    getButtonLabel: function() {
      var selectedModel = this.multiItemView && this.multiItemView.getSelectedModel();
      var index = this.multiItemView && this.multiItemView.getIndexValue();
      var isFinalStep = this.multiItemView && this.multiItemView.isFinalStep();
      var steps = this.options.wizard.options.multiSteps;
      if (isFinalStep) {
        return lang.D2LifcycleSubmitStepLabel;
      } else if (selectedModel && index >= 0 && _.isUndefined(steps[selectedModel.get("id")][index + 1])) {
        return lang.D2LifecycleMultiFileNextFileLabel;
      } else {
        return lang.D2LifecycleMultiFileContinueLabel;
      }
    },
    getPrevButtonToolTip: function() {
      if (this.multiItemView) {
        return this.multiItemView.getPrevButtonToolTip();
      }
    },
    onMultiStepChange: function() {
      this.options.wizard.refreshHeader();
      this.options.wizard.refreshFooter();
    },
    checkBackButtonVisibility: function() {
      if (this.multiItemView && this.multiItemView.modelIndex === 0 && this.multiItemView.getIndexValue() === 0) {
        return true;
      } else {
        return false;
      }
    },
    isNextButtonDisabled: function() {
      if (this.multiItemView) {
        return !(this.multiItemView.checkItemStatus() && this.multiItemView.currentItemDetailsView.isValid && this.multiItemView.currentItemDetailsView.isValid());
      }
    }
  });
  _.extend(D2HetrogeneousLifecycleView.prototype, LayoutViewEventsPropagationMixin);
  return D2HetrogeneousLifecycleView;
});