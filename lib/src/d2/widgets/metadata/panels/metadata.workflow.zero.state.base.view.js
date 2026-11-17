/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/marionette", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "nuc/models/nodes", "csui/utils/commands", "d2/controls/button.toolbar/button.toolbar.view", "hbs!d2/widgets/metadata/panels/impl/metadata.workflow.zero.state.base", "css!d2/widgets/metadata/panels/impl/metadata.workflow.zero.state.base" ], function(_, Marionette, TabableRegionBehavior, NodeCollection, commands, ButtonToolbarView, template) {
  "use strict";
  var MetadataWorkflowZeroStateBaseView = Marionette.LayoutView.extend({
    className: "d2-metadata-workflow-zero-state",
    template: template,
    behaviors: {
      TabableRegionBehavior: {
        behaviorClass: TabableRegionBehavior
      }
    },
    currentlyFocusedElement: ".binf-btn-primary",
    regions: {
      toolbarRegion: ".d2-workflow-zero-state-actionbar"
    },
    templateHelpers: function() {
      return {
        message: this.options.zeroStateMessage
      };
    },
    constructor: function MetadataWorkflowZeroStateBaseView(options) {
      options = options || {};
      Marionette.LayoutView.prototype.constructor.call(this, options);
      if (_.isString(this.options.actionsButtonLabel) && !_.isEmpty(this.options.actionsButtonLabel)) {
        this.setupChildViews();
      }
    },
    setupChildViews: function() {
      this._setupButtonToolbarView();
    },
    _setupButtonToolbarView: function() {
      var buttonsConfig = {
        center: [ {
          id: "zeroStateAction",
          className: "binf-btn-primary" + (_.isString(this.options.actionButtonClassName) ? " " + this.options.actionButtonClassName : ""),
          label: this.options.actionsButtonLabel,
          showLabel: true,
          clickHandler: this._onClickActionButton.bind(this)
        } ]
      };
      this.buttonToolbarView = new ButtonToolbarView(buttonsConfig);
    },
    onRender: function() {
      this.showChildViews();
    },
    showChildViews: function() {
      this._showButtonToolbarView();
    },
    _showButtonToolbarView: function() {
      this.buttonToolbarView && this.toolbarRegion.show(this.buttonToolbarView);
    },
    _onClickActionButton: function(event) {
      event.stopPropagation();
      event.preventDefault();
      if (_.isString(this.options.actionCommandSignature) && !_.isEmpty(this.options.actionCommandSignature)) {
        var cmd = commands.get(this.options.actionCommandSignature), cmdOptions = _.defaults({
          nodes: new NodeCollection([ this.options.model ])
        }, this.options.actionCommandOptions);
        cmd && cmd.execute(cmdOptions);
      }
    }
  });
  return MetadataWorkflowZeroStateBaseView;
});