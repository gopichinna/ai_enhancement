/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "dctmw/controls/split.panel/split.panel.view", "d2/controls/mixins/view.state/workflow.view.state.mixin", "d2/utils/contexts/factories/workflow", "d2/widgets/task.documents/task.documents.view" ], function(_, $, SplitPanelView, WorkflowViewStateMixin, WorkflowModelFactory, TaskDocumentsView) {
  "use strict";
  var WorkflowDocumentsView = TaskDocumentsView.extend({
    constructor: function WorkflowDocumentsView() {
      TaskDocumentsView.prototype.constructor.apply(this, arguments);
    },
    initialize: function(options) {
      options = options || {};
      if (options.container) {
        this.container = options.container;
      } else if (options.data.containerId) {
        this.container = this.context.getModel(WorkflowModelFactory, {
          workflow: {
            attributes: {
              id: this.options.data.containerId
            }
          }
        });
      }
      if (!this.model) {
        this.model = this.context.getModel(WorkflowModelFactory, {
          attributes: options.data.id && {
            id: options.data.id
          },
          temporary: true
        });
        options.model = this.model;
      }
      if (!this.container) {
        this.container = options.model.clone();
      }
      options.container = this.container;
      TaskDocumentsView.prototype.initialize.call(this, options);
    },
    addInitialURLParamSupport: function() {
      this.addUrlParametersSupport(WorkflowViewStateMixin.PROPERTY_CONSTANTS.DOCUMENTS_PERSPECTIVE_INIT_URL_PARAMS);
    },
    _renderChildrenViews: function() {
      if (!this.splitPanel) {
        this.splitPanel = new SplitPanelView({
          type: SplitPanelView.TYPES.THREE_WAY
        });
        this.rgnPanels.show(this.splitPanel);
      }
      TaskDocumentsView.prototype._renderChildrenViews.apply(this, arguments);
    }
  });
  WorkflowViewStateMixin.mixin(WorkflowDocumentsView.prototype);
  return WorkflowDocumentsView;
});